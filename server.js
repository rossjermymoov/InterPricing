const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require('./db');
const auth = require('./auth');
const pricing = require('./pricing');
const { fetchPickups, fetchPickupsRaw } = require('./pickups');
const ups = require('./ups');
const emailService = require('./email');
const { nameToIso } = require('./countries');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // Railway terminates TLS in front of us
app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());
app.use(auth.attachUser);

const isEmail = (s) => typeof s === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.trim());

app.get('/healthz', (req, res) => res.json({ ok: true, db: db.hasDb }));

// ---- auth / setup ----
app.get('/api/needs-setup', async (req, res) => {
  if (!db.hasDb) return res.json({ authEnabled: false, needsSetup: false });
  try {
    res.json({ authEnabled: true, needsSetup: (await db.countUsers()) === 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/setup', async (req, res) => {
  if (!db.hasDb) return res.status(400).json({ error: 'No database configured' });
  try {
    if ((await db.countUsers()) > 0) return res.status(409).json({ error: 'Setup already completed' });
    const { email, name, password } = req.body || {};
    if (!isEmail(email)) return res.status(400).json({ error: 'Valid email required' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const user = await db.createUser({ email, name, password_hash: await auth.hashPassword(password), role: 'admin' });
    res.cookie(auth.COOKIE, await auth.signToken(user), auth.cookieOptions());
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', async (req, res) => {
  if (!db.hasDb) return res.status(400).json({ error: 'No database configured' });
  try {
    const { email, password } = req.body || {};
    const u = await db.getUserByEmail((email || '').trim());
    if (!u || !(await auth.checkPassword(password || '', u.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = { id: u.id, email: u.email, name: u.name, role: u.role };
    res.cookie(auth.COOKIE, await auth.signToken(user), auth.cookieOptions());
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie(auth.COOKIE, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: req.user });
});

app.post('/api/me/password', auth.requireAuth, async (req, res) => {
  try {
    const { current, next } = req.body || {};
    const u = await db.getUserById(req.user.id);
    if (!u || !(await auth.checkPassword(current || '', u.password_hash))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    if (!next || next.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    await db.updateUser(u.id, { password_hash: await auth.hashPassword(next) });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- config (locked behind auth when a DB is present) ----
app.get('/api/config', (req, res, next) => {
  if (db.hasDb && !req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}, async (req, res) => {
  try { res.set('Cache-Control', 'no-store'); res.json(await db.getConfig()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- pricing/settings (admin only), persisted in the config ----
app.put('/api/settings', auth.requireAdmin, async (req, res) => {
  try {
    const cfg = await db.getConfig();
    cfg.settings = cfg.settings || {};
    const numify = (o) => {
      const r = {};
      for (const k in o) { const v = o[k]; r[k] = (v && typeof v === 'object') ? numify(v) : Number(v); }
      return r;
    };
    const { fuelByService, caps, accessorials, euCustomsDuty } = req.body || {};
    if (req.body && req.body.upsFuelMarkup != null) cfg.settings.upsFuelMarkup = Number(req.body.upsFuelMarkup) || 0;
    if (req.body && req.body.importMarkupPct != null) cfg.settings.importMarkupPct = Number(req.body.importMarkupPct) || 0;
    if (req.body && req.body.debugRaw != null) cfg.settings.debugRaw = !!req.body.debugRaw;
    if (req.body && req.body.hsFreeLines != null) cfg.settings.hsFreeLines = Math.max(0, Math.floor(Number(req.body.hsFreeLines) || 0));
    if (req.body && req.body.hsLineCharge != null) cfg.settings.hsLineCharge = Number(req.body.hsLineCharge) || 0;
    if (euCustomsDuty && typeof euCustomsDuty === 'object') {
      const cur = cfg.settings.euCustomsDuty || {};
      cfg.settings.euCustomsDuty = {
        enabled: euCustomsDuty.enabled != null ? !!euCustomsDuty.enabled : !!cur.enabled,
        eurPerGbp: euCustomsDuty.eurPerGbp != null ? Number(euCustomsDuty.eurPerGbp) : (cur.eurPerGbp || 0),
        perSku: euCustomsDuty.perSku != null ? Number(euCustomsDuty.perSku) : (cur.perSku != null ? cur.perSku : 3),
        thresholdEur: euCustomsDuty.thresholdEur != null ? Number(euCustomsDuty.thresholdEur) : (cur.thresholdEur || 150),
        label: 'EU customs duty',
      };
    }
    if (fuelByService) {
      cfg.settings.fuelByService = cfg.settings.fuelByService || {};
      for (const k of Object.keys(fuelByService)) {
        const cur = cfg.settings.fuelByService[k] || {};
        const inc = fuelByService[k] || {};
        cfg.settings.fuelByService[k] = {
          name: inc.name || cur.name || k,
          cost: inc.cost != null ? Number(inc.cost) : (cur.cost || 0),
          sell: inc.sell != null ? Number(inc.sell) : (cur.sell || 0),
        };
      }
    }
    if (caps) cfg.settings.caps = { ...cfg.settings.caps, ...numify(caps) };
    if (Array.isArray(accessorials)) {
      const cur = cfg.settings.accessorials || [];
      cfg.settings.accessorials = cur.map((a) => {
        const inc = accessorials.find((x) => x.key === a.key) || {};
        return {
          ...a,
          list: inc.list != null ? Number(inc.list) : a.list,
          disc: inc.disc != null ? Number(inc.disc) : a.disc,
          pct: inc.pct != null ? Number(inc.pct) : a.pct,
          min: inc.min != null ? Number(inc.min) : a.min,
          sell: inc.sell != null && inc.sell !== '' ? Number(inc.sell) : (a.sell != null ? a.sell : null),
          sellMin: inc.sellMin != null && inc.sellMin !== '' ? Number(inc.sellMin) : (a.sellMin != null ? a.sellMin : null),
          sellPct: inc.sellPct != null && inc.sellPct !== '' ? Number(inc.sellPct) : (a.sellPct != null ? a.sellPct : null),
        };
      });
    }
    await db.setConfig(cfg);
    res.json({ settings: cfg.settings });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- user management (admin only) ----
app.get('/api/users', auth.requireAdmin, async (req, res) => {
  try { res.json({ users: await db.listUsers() }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', auth.requireAdmin, async (req, res) => {
  try {
    const { email, name, role, password } = req.body || {};
    if (!isEmail(email)) return res.status(400).json({ error: 'Valid email required' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (await db.getUserByEmail(email)) return res.status(409).json({ error: 'A user with that email already exists' });
    const user = await db.createUser({ email, name, password_hash: await auth.hashPassword(password), role });
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/users/:id', auth.requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const target = await db.getUserById(id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    const { name, role, password } = req.body || {};
    // Guard: don't allow removing the last admin
    if (role && role !== 'admin' && target.role === 'admin') {
      const admins = (await db.listUsers()).filter((u) => u.role === 'admin');
      if (admins.length <= 1) return res.status(400).json({ error: 'Cannot demote the last admin' });
    }
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (role !== undefined) patch.role = role;
    if (password) {
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      patch.password_hash = await auth.hashPassword(password);
    }
    res.json({ user: await db.updateUser(id, patch) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', auth.requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });
    const target = await db.getUserById(id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'admin') {
      const admins = (await db.listUsers()).filter((u) => u.role === 'admin');
      if (admins.length <= 1) return res.status(400).json({ error: 'Cannot delete the last admin' });
    }
    await db.deleteUser(id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- shareable customer rate cards (admin/sales manage; public views) ----
app.post('/api/cards', auth.requireAuth, async (req, res) => {
  if (!db.hasDb) return res.status(400).json({ error: 'No database configured' });
  try {
    const { customer, config } = req.body || {};
    const card = await db.createCard({ customer, config: config || {}, created_by: req.user.id });
    res.json({ card });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/cards', auth.requireAuth, async (req, res) => {
  if (!db.hasDb) return res.json({ cards: [] });
  try { res.json({ cards: await db.listCards() }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.patch('/api/cards/:id', auth.requireAuth, async (req, res) => {
  if (!db.hasDb) return res.status(400).json({ error: 'No database configured' });
  try {
    const id = parseInt(req.params.id, 10);
    if (!(await db.getCardById(id))) return res.status(404).json({ error: 'Card not found' });
    const { customer, config, enabled } = req.body || {};
    res.json({ card: await db.updateCard(id, { customer, config, enabled }) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/cards/:id', auth.requireAuth, async (req, res) => {
  if (!db.hasDb) return res.status(400).json({ error: 'No database configured' });
  try {
    const id = parseInt(req.params.id, 10);
    if (!(await db.getCardById(id))) return res.status(404).json({ error: 'Card not found' });
    await db.deleteCard(id); res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
// PUBLIC: customer-facing payload (final prices only) — no auth.
app.get('/api/card/:token', async (req, res) => {
  try {
    const card = db.hasDb ? await db.getCardByToken(req.params.token) : null;
    if (!card || card.enabled === false) return res.status(404).json({ error: 'This rate card is not available.' });
    res.set('Cache-Control', 'no-store');
    const payload = pricing.buildCardPayload(await db.getConfig(), card);
    const conf = card.config || {};
    const pc = conf.postcode || (conf.deliveryAddress && conf.deliveryAddress.postcode);
    if (pc) {
      try {
        const carriers = [...new Set((payload.services || []).map((s) => s.carrier))];
        const pk = await fetchPickups(pc, carriers.length ? carriers : undefined);
        if (pk) { payload.dropoffs = pk.dropoffs; payload.origin = pk.origin; payload.postcode = pc; }
      } catch (e) { console.error('[pickups]', e.message); }
    }
    res.json(payload);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUBLIC: Live parcel shop / drop-off points lookup (DPD Pickup Shops & UPS Access Points)
app.get('/api/pickups', async (req, res) => {
  try {
    const pc = String(req.query.postcode || '').trim() || 'SY11 4FN';
    const carrier = req.query.carrier ? [req.query.carrier] : undefined;
    const pk = await fetchPickups(pc, carrier);
    res.json(pk || { dropoffs: [], origin: null, postcode: pc });
  } catch (e) {
    res.status(500).json({ error: e.message, dropoffs: [] });
  }
});
app.post('/api/pickups', async (req, res) => {
  try {
    const { postcode, carriers } = req.body || {};
    const pc = String(postcode || '').trim() || 'SY11 4FN';
    const pk = await fetchPickups(pc, carriers);
    res.json(pk || { dropoffs: [], origin: null, postcode: pc });
  } catch (e) {
    res.status(500).json({ error: e.message, dropoffs: [] });
  }
});
// PUBLIC: the per-card sender address book (suppliers this customer imports from).
// Authorized by possession of the card token — the same token that shows the card.
app.put('/api/card/:token/addressbook', async (req, res) => {
  try {
    if (!db.hasDb) return res.status(400).json({ error: 'No database configured' });
    const card = await db.getCardByToken(req.params.token);
    if (!card || card.enabled === false) return res.status(404).json({ error: 'Rate card not available.' });
    const clean = (s) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').slice(0, 120).trim();
    let list = Array.isArray(req.body && req.body.addressBook) ? req.body.addressBook : [];
    list = list.slice(0, 200).map((a) => ({
      company: clean(a.company), name: clean(a.name), country: clean(a.country).toUpperCase().slice(0, 2),
      line1: clean(a.line1), line2: clean(a.line2), city: clean(a.city), postcode: clean(a.postcode),
      phone: clean(a.phone), email: clean(a.email),
    })).filter((a) => a.company || a.line1 || a.postcode);
    const config = Object.assign({}, card.config || {}, { addressBook: list });
    await db.updateCard(card.id, { config });
    res.json({ ok: true, addressBook: list });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
// ADMIN: test a postcode against the courier pickup API (diagnose + reveal response shape).
app.post('/api/pickups-test', auth.requireAdmin, async (req, res) => {
  try {
    const { postcode, carriers } = req.body || {};
    if (!postcode) return res.status(400).json({ error: 'Postcode required' });
    res.json(await fetchPickupsRaw(postcode, carriers));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPS OAuth callback. Landed Cost uses the Client Credentials flow (client id + secret, no
// redirect), so this endpoint is not hit by that path — it exists so the redirect URI registered
// on the UPS app is valid, and to support the Authorization Code flow if we ever enable it.
app.get('/api/ups/callback', (req, res) => {
  const { code, error, error_description } = req.query || {};
  res.type('html');
  if (error) {
    return res.status(400).send('<!doctype html><meta charset="utf-8"><title>UPS authorization failed</title>'
      + '<body style="font-family:system-ui;padding:40px;max-width:640px;margin:auto">'
      + '<h2 style="color:#B91C1C">UPS authorization failed</h2><p>' + String(error_description || error).replace(/[<>]/g, '') + '</p></body>');
  }
  res.send('<!doctype html><meta charset="utf-8"><title>UPS connected</title>'
    + '<body style="font-family:system-ui;padding:40px;max-width:640px;margin:auto">'
    + '<h2 style="color:#0E9C63">UPS authorization received</h2><p>'
    + (code ? 'An authorization code was returned — you can close this window.' : 'This is the UPS OAuth callback endpoint for InterPricing. Nothing to do here.')
    + '</p></body>');
});

// Allowed UPS Services across export and import quoting:
// - UPS Standard ('11')
// - UPS Worldwide Saver ('65')
// - UPS Worldwide Express ('07' / '7')
// Excluded / Ignored: Worldwide Express Plus ('54') and Worldwide Expedited ('08')
const ALLOWED_UPS_CODES = new Set(['11', '65', '07', '7', '011', '065', '007']);

// PUBLIC: live import/export quotes via UPS. Returns marked-up sell prices only (never cost).
app.post('/api/import-quote', async (req, res) => {
  try {
    const { mode, sender, receiver, packages, value, currency, token, hsLines } = req.body || {};
    const r = await ups.quoteRates({ mode, sender, receiver, packages, value, currency });
    if (!r || !r.enabled) return res.json({ enabled: false, services: [] });
    const cfg = await db.getConfig();
    // Markup precedence: this customer's card → global import setting → env → 0.
    let markup = null, card = null;
    if (token && db.hasDb) {
      try {
        card = await db.getCardByToken(token);
        const cm = card && card.config && card.config.importMarkupPct;
        if (cm != null && isFinite(Number(cm))) markup = Number(cm);
      } catch (_) {}
    }
    if (markup == null) {
      const p = Number((cfg.settings || {}).importMarkupPct);
      markup = isFinite(p) ? p : (Number(process.env.UPS_IMPORT_MARKUP) || 0);
    }
    // HS / tariff-line charge: first N lines free, then a flat fee per extra line (full price, not marked up).
    const st = cfg.settings || {};
    const hsFree = Number.isFinite(Number(st.hsFreeLines)) ? Number(st.hsFreeLines) : 5;
    const hsPerLine = Number.isFinite(Number(st.hsLineCharge)) ? Number(st.hsLineCharge) : 2.95;
    const linesReq = Math.max(0, Math.floor(Number(hsLines) || 0));
    const hsExtra = Math.max(0, linesReq - hsFree);
    const hsCharge = Math.round(hsExtra * hsPerLine * 100) / 100;

    // Custom surcharges from settings (Disbursement fee, US merchant processing fee, etc.)
    const configuredAcc = Array.isArray(st.accessorials) ? st.accessorials : [];
    const isUsLane = (c) => {
      const u = String(c || '').trim().toUpperCase();
      return u === 'US' || u === 'USA' || u === 'UNITED STATES';
    };
    const isUsShipment = isUsLane(sender && sender.country) || isUsLane(receiver && receiver.country);

    const gv = Number(req.body && (req.body.value || req.body.goodsValue) || 0);
    const customSurcharges = [];
    configuredAcc.filter((a) => (a.applyTo || '').toLowerCase() === 'ups').forEach((a) => {
      let charge = 0;
      if (a.basis === 'pctValue') {
        const minVal = Number(a.min) || 14.35;
        const disc = Number(a.disc) || 0;
        const cost = Math.round(minVal * (1 - disc / 100) * 100) / 100;
        const customerMin = a.sellMin != null && a.sellMin !== '' ? Number(a.sellMin) : (a.sell != null && a.sell !== '' ? Number(a.sell) : minVal);
        charge = customerMin;
      } else {
        const cost = Math.round((a.list || 0) * (1 - (a.disc || 0) / 100) * 100) / 100;
        charge = a.sell != null && a.sell !== '' ? Number(a.sell) : cost;
      }
      if (a.cond === 'always') {
        customSurcharges.push({ key: a.key, name: a.name || 'Disbursement fee', amt: charge });
      }
    });
    const customSurTotal = customSurcharges.reduce((sum, x) => sum + x.amt, 0);

    const upsFuelMarkup = Number((cfg.settings || {}).upsFuelMarkup) || 0;
    const services = (r.services || [])
      .filter((s) => ALLOWED_UPS_CODES.has(String(s.code)))
      .map((s) => {
      const bd = s.breakdown || {};
      const factor = 1 + markup / 100;
      const baseMarkedUp = Math.round(bd.base * factor * 100) / 100;
      const liveAcc = (bd.accessorials || []).map((a) => ({
        code: a.code,
        name: a.name,
        amt: Math.round((a.amt || 0) * 100) / 100,
        remote: !!a.remote,
      })).filter((a) => a.amt > 0);

      const allSurcharges = [...liveAcc, ...customSurcharges];
      if (hsCharge > 0) {
        allSurcharges.push({ key: 'hs', name: 'HS customs entry (' + hsExtra + ' extra line' + (hsExtra === 1 ? '' : 's') + ')', amt: hsCharge });
      }
      const surchargesTotal = allSurcharges.reduce((t, x) => t + x.amt, 0);
      const fuelRate = (bd.base > 0 && bd.fuel > 0) ? ((bd.fuel / bd.base) * (1 + upsFuelMarkup / 100)) : 0;
      const fuelAmount = Math.round((baseMarkedUp + surchargesTotal) * fuelRate * 100) / 100;
      const finalPrice = Math.round((baseMarkedUp + fuelAmount + surchargesTotal) * 100) / 100;

      return {
        code: s.code,
        name: s.name,
        days: s.days,
        currency: s.currency,
        price: finalPrice,
        base: baseMarkedUp,
        fuel: fuelAmount,
        surcharges: allSurcharges,
        customSurcharges,
      };
    });
    res.json({ enabled: true, services, hs: { lines: linesReq, free: hsFree, extra: hsExtra, perLine: hsPerLine, charge: hsCharge } });

    // Log the quote (non-blocking; never affects the customer response).
    try {
      const pkgs = Array.isArray(packages) ? packages : [];
      const qtyOf = (p) => Math.max(1, Math.floor(Number(p.qty) || 1));
      const parcels = pkgs.reduce((n, p) => n + qtyOf(p), 0);
      const weight = pkgs.reduce((w, p) => w + qtyOf(p) * (Number(p.weight) || 0), 0);
      const cheapest = services.length ? Math.min.apply(null, services.map((s) => s.price)) : null;
      const logServices = (r.services || []).map((s, i) => ({ code: s.code, name: s.name, days: s.days, cost: s.cost, price: services[i] ? services[i].price : null }));
      // Keep the raw UPS request/response for diagnostics unless debug capture is switched off.
      const debug = ((cfg.settings || {}).debugRaw === false) ? null
        : { status: r.status, markupPct: markup, hs: { lines: linesReq, extra: hsExtra, charge: hsCharge }, request: r.request, raw: (r.raw || '').slice(0, 24000) };
      db.createQuoteLog({
        card_id: card ? card.id : null, token: token || null, customer: card ? card.customer : null, mode: mode || 'import',
        sender_country: (sender && sender.country) || null, sender_company: (sender && sender.company) || null,
        receiver_country: (receiver && receiver.country) || null, receiver_postcode: (receiver && receiver.postcode) || null,
        parcels, weight_kg: Math.round(weight * 10) / 10, goods_value: Number(value) || 0, currency: currency || 'GBP',
        cheapest, services: logServices, debug,
      }).catch((e) => console.error('[quotelog]', e.message));
    } catch (e) { console.error('[quotelog]', e.message); }
  } catch (e) { res.status(502).json({ error: e.message }); }
});
// PUBLIC: live outbound (export) UPS pricing for a customer's rate card. Token-authorized;
// returns the customer's SELL price (their per-service markup applied) plus a markup-scaled
// charge breakdown — never raw cost. Falls back to enabled:false so the card uses static rates.
const MOOV_ORIGIN = { country: 'GB', postcode: 'SY11 4FN', city: 'Whittington', line1: '1 Mellor Meadows', name: 'MOOV Parcel' };
const CODE2KEY = {
  '01': 'u1', '1': 'u1',
  '02': 'u2', '2': 'u2',
  '03': 'ug', '3': 'ug',
  '07': 'ue', '7': 'ue', // Worldwide Express
  '08': 'ud', '8': 'ud', // Worldwide Expedited
  '11': 'us', '011': 'us', // Standard
  '12': 'u3', // 3 Day Select
  '54': 'up', // Worldwide Express Plus
  '65': 'ux', '065': 'ux', // Worldwide Saver
  '96': 'uf', // Worldwide Express Freight
};

app.post('/api/card-rate', async (req, res) => {
  try {
    const { token, country, postcode, weight, l, w, h, residential, value } = req.body || {};
    if (!country || !token || !db.hasDb) return res.json({ enabled: false, services: [] });
    const card = await db.getCardByToken(token);
    if (!card || card.enabled === false) return res.json({ enabled: false, services: [] });
    const iso = nameToIso(country);
    if (!iso) return res.json({ enabled: false, services: [] }); // unknown country name → card uses static

    const numWeight = Number(weight) || 0;
    const sides = [l, w, h].map(Number).filter(x => x > 0).sort((a, b) => b - a);
    const longest = sides[0] || 0, second = sides[1] || 0, third = sides[2] || 0;
    const girth = (l && w && h) ? (longest + 2 * second + 2 * third) : 0;
    if (numWeight > 70 || longest > 274 || girth > 400) {
      return res.json({ enabled: true, services: [], maxExceeded: true });
    }

    const cfg = await db.getConfig();
    const st = cfg.settings || {};
    const euCountries = (st.regions && st.regions.eu) || [];
    const isEu = euCountries.includes(country) || euCountries.includes(iso);
    const mkObj = (card.config && card.config.markup) || {};
    const markupOf = (key, code) => {
      if (typeof mkObj === 'number') return mkObj;
      const regKey = isEu ? key + '_eu' : key + '_row';
      if (mkObj[regKey] != null && isFinite(Number(mkObj[regKey]))) return Number(mkObj[regKey]);
      if (['07', '08', '54', '65', 'ue', 'ud', 'up', 'ux'].includes(key) || ['07', '08', '54', '65'].includes(code)) {
        const uxReg = isEu ? 'ux_eu' : 'ux_row';
        if (mkObj[uxReg] != null && isFinite(Number(mkObj[uxReg]))) return Number(mkObj[uxReg]);
        if (mkObj['ux'] != null && isFinite(Number(mkObj['ux']))) return Number(mkObj['ux']);
      }
      if (key === 'us' || ['11', '011', '03'].includes(code)) {
        const usReg = isEu ? 'us_eu' : 'us_row';
        if (mkObj[usReg] != null && isFinite(Number(mkObj[usReg]))) return Number(mkObj[usReg]);
        if (mkObj['us'] != null && isFinite(Number(mkObj['us']))) return Number(mkObj['us']);
      }
      if (mkObj[key] != null && isFinite(Number(mkObj[key]))) return Number(mkObj[key]);
      if (mkObj.default != null && isFinite(Number(mkObj.default))) return Number(mkObj.default);
      return Number(st.importMarkupPct) || 0;
    };

    const goodsVal = Number(value) || 100;
    const r = await ups.quoteRates({
      mode: 'export', sender: MOOV_ORIGIN,
      receiver: { country: iso, postcode: postcode || '', residential: !!residential },
      packages: [{ qty: 1, weight: numWeight || 1, l, w, h }], value: goodsVal, currency: 'GBP',
    });
    if (!r || !r.enabled) return res.json({ enabled: false, services: [] });

    const upsFuelMarkup = Number((cfg.settings || {}).upsFuelMarkup) || 0;
    const services = [];
    (r.services || []).filter((s) => ALLOWED_UPS_CODES.has(String(s.code))).forEach((s) => {
      const key = CODE2KEY[s.code] || ('ups_' + s.code);
      const mk = markupOf(key, s.code);
      const factor = 1 + mk / 100;
      const bd = s.breakdown || {};
      const baseMarkedUp = Math.round(bd.base * factor * 100) / 100;
      const accessorials = (bd.accessorials || []).map((a) => ({
        code: a.code,
        name: a.name,
        amt: Math.round((a.amt || 0) * 100) / 100,
        remote: !!a.remote,
      })).filter((a) => a.amt > 0);
      const surTotal = accessorials.reduce((t, x) => t + x.amt, 0);
      const fuelRate = (bd.base > 0 && bd.fuel > 0) ? ((bd.fuel / bd.base) * (1 + upsFuelMarkup / 100)) : 0;
      const fuelAmount = Math.round((baseMarkedUp + surTotal) * fuelRate * 100) / 100;

      services.push({
        key, code: s.code, name: s.name, days: s.days,
        price: Math.round((baseMarkedUp + fuelAmount + surTotal) * 100) / 100,
        base: baseMarkedUp, fuel: fuelAmount, accessorials,
        remote: accessorials.some((a) => a.remote),
      });
    });
    res.json({ enabled: true, postcodeUsed: !!(postcode && String(postcode).trim()), residentialUsed: !!residential, services });
  } catch (e) { res.json({ enabled: false, error: e.message, services: [] }); }
});

// PUBLIC/ADMIN: live quote endpoint for the main calculator (returns UPS Standard & Express Saver).
app.post('/api/calc-rate', async (req, res) => {
  try {
    const { country, postcode, weight, l, w, h, residential, markup, value } = req.body || {};
    if (!country) return res.status(400).json({ error: 'Country is required' });
    const iso = nameToIso(country);
    if (!iso) return res.status(400).json({ error: 'Could not map country name to ISO code' });

    const numWeight = Number(weight) || 0;
    const sides = [l, w, h].map(Number).filter(x => x > 0).sort((a, b) => b - a);
    const longest = sides[0] || 0, second = sides[1] || 0, third = sides[2] || 0;
    const girth = (l && w && h) ? (longest + 2 * second + 2 * third) : 0;
    if (numWeight > 70 || longest > 274 || girth > 400) {
      return res.json({ enabled: true, services: [], maxExceeded: true });
    }

    const cfg = await db.getConfig();
    const st = cfg.settings || {};
    const globalMarkup = Number(st.importMarkupPct) || 0;
    const upsFuelMarkup = Number(st.upsFuelMarkup) || 0;
    const euCountries = (st.regions && st.regions.eu) || [];
    const isEu = euCountries.includes(country) || euCountries.includes(iso);
    const mkObj = (markup && typeof markup === 'object') ? markup : (typeof markup === 'number' ? markup : {});
    const markupOf = (key, code) => {
      if (typeof mkObj === 'number') return mkObj;
      const regKey = isEu ? key + '_eu' : key + '_row';
      if (mkObj[regKey] != null && isFinite(Number(mkObj[regKey]))) return Number(mkObj[regKey]);
      if (['07', '08', '54', '65', 'ue', 'ud', 'up', 'ux'].includes(key) || ['07', '08', '54', '65'].includes(code)) {
        const uxReg = isEu ? 'ux_eu' : 'ux_row';
        if (mkObj[uxReg] != null && isFinite(Number(mkObj[uxReg]))) return Number(mkObj[uxReg]);
        if (mkObj['ux'] != null && isFinite(Number(mkObj['ux']))) return Number(mkObj['ux']);
      }
      if (key === 'us' || ['11', '011', '03'].includes(code)) {
        const usReg = isEu ? 'us_eu' : 'us_row';
        if (mkObj[usReg] != null && isFinite(Number(mkObj[usReg]))) return Number(mkObj[usReg]);
        if (mkObj['us'] != null && isFinite(Number(mkObj['us']))) return Number(mkObj['us']);
      }
      if (mkObj[key] != null && isFinite(Number(mkObj[key]))) return Number(mkObj[key]);
      if (mkObj.default != null && isFinite(Number(mkObj.default))) return Number(mkObj.default);
      return globalMarkup;
    };

    const goodsVal = Number(value) || 100;
    const r = await ups.quoteRates({
      mode: 'export', sender: MOOV_ORIGIN,
      receiver: { country: iso, postcode: postcode || '', residential: !!residential },
      packages: [{ qty: 1, weight: numWeight || 1, l, w, h }], value: goodsVal, currency: 'GBP',
    });
    if (!r || !r.enabled) {
      return res.json({
        enabled: false,
        error: r ? r.error : 'UPS rate call returned no rates',
        status: r ? r.status : null,
        raw: r ? r.raw : null,
        request: r ? r.request : null,
        services: []
      });
    }

    const services = [];
    (r.services || []).filter((s) => ALLOWED_UPS_CODES.has(String(s.code))).forEach((s) => {
      const key = CODE2KEY[s.code] || ('ups_' + s.code);
      const mk = markupOf(key, s.code);
      const factor = 1 + mk / 100;
      const bd = s.breakdown || {};
      const costBase = Math.round((bd.base || 0) * 100) / 100;
      const costFuel = Math.round((bd.fuel || 0) * 100) / 100;
      const sellBase = Math.round(costBase * factor * 100) / 100;

      const accessorials = (bd.accessorials || []).map((a) => ({
        code: a.code,
        name: a.name,
        costAmt: Math.round((a.amt || 0) * 100) / 100,
        amt: Math.round((a.amt || 0) * 100) / 100,
        remote: !!a.remote,
      })).filter((a) => a.amt > 0);
      const surTotal = accessorials.reduce((t, x) => t + x.amt, 0);
      const fuelRate = (costBase > 0 && costFuel > 0) ? ((costFuel / costBase) * (1 + upsFuelMarkup / 100)) : 0;
      const sellFuel = Math.round((sellBase + surTotal) * fuelRate * 100) / 100;

      services.push({
        key, code: s.code, name: s.name, days: s.days,
        costPrice: Math.round((costBase + costFuel + surTotal) * 100) / 100,
        costBase,
        costFuel,
        sellPrice: Math.round((sellBase + sellFuel + surTotal) * 100) / 100,
        sellBase,
        sellFuel,
        markupPct: mk,
        markupAmt: Math.round(((sellBase + sellFuel) - (costBase + costFuel)) * 100) / 100,
        accessorials,
        remote: accessorials.some((a) => a.remote),
      });
    });
    res.json({
      enabled: true,
      postcodeUsed: !!(postcode && String(postcode).trim()),
      residentialUsed: !!residential,
      status: r.status,
      raw: r.raw,
      request: r.request,
      services
    });
  } catch (e) {
    res.json({ enabled: false, error: e.message, services: [] });
  }
});

// PUBLIC/ADMIN: Live UPS Call Inspector (returns exact request JSON, endpoint URL, headers, and raw response)
app.post('/api/ups-inspect-rate', async (req, res) => {
  try {
    const { country, postcode, weight, l, w, h, residential, value } = req.body || {};
    const iso = nameToIso(country) || country || 'US';
    const numWeight = Number(weight) || 5;
    const goodsVal = Number(value) || 100;
    const out = await ups.quoteRatesRaw({
      mode: 'export',
      sender: MOOV_ORIGIN,
      receiver: { country: iso, postcode: postcode || '', residential: !!residential },
      packages: [{ qty: 1, weight: numWeight, l: l || 30, w: w || 20, h: h || 15 }],
      value: goodsVal,
      currency: 'GBP',
    });
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ADMIN/SALES: quote reporting — the log and the daily stats.
app.get('/api/quotes', auth.requireAuth, async (req, res) => {
  try { res.json({ quotes: await db.listQuoteLogs({ q: req.query.q, from: req.query.from, to: req.query.to, limit: req.query.limit }) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/quotes/stats', auth.requireAuth, async (req, res) => {
  try { res.json(await db.quoteStats()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// AUTHENTICATED: Create a collection / pickup with UPS
app.post('/api/collections', auth.requireAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    const { addressLine1, addressLine, address, city, postalCode, postcode, phone, email } = payload;
    const addr = addressLine1 || addressLine || address;
    const pc = postalCode || postcode;
    if (!addr || !city || !pc) {
      return res.status(400).json({ ok: false, error: 'Address line, city, and postal code are required.' });
    }
    if (!phone) {
      return res.status(400).json({ ok: false, error: 'Phone number is required for collections.' });
    }

    const r = await ups.createPickup(payload);

    let saved = null;
    try {
      saved = await db.createCollectionRecord({
        prn: r.prn,
        status: r.ok ? 'booked' : 'failed',
        company_name: payload.companyName || payload.company || payload.contactName,
        contact_name: payload.contactName || payload.companyName,
        phone: payload.phone,
        email: payload.email,
        address_line: addr + (payload.addressLine2 ? ', ' + payload.addressLine2 : ''),
        city: payload.city,
        postal_code: pc,
        country_code: payload.country || 'GB',
        pickup_date: payload.pickupDate,
        ready_time: payload.readyTime,
        close_time: payload.closeTime,
        parcels: payload.parcels,
        total_weight_kg: payload.weight || payload.totalWeight,
        tracking_number: payload.trackingNumber,
        special_instruction: payload.specialInstruction || payload.instructions,
        service_code: payload.serviceCode || '011',
        response: r,
        created_by: req.user ? req.user.id : null,
      });
    } catch (e) { console.error('[collections db]', e.message); }

    if (!r.ok) {
      return res.status(400).json({ ok: false, error: r.error, status: r.status, raw: r.raw, request: r.request, savedId: saved ? saved.id : null });
    }

    res.json({
      ok: true,
      prn: r.prn,
      rateStatus: r.rateStatus,
      savedId: saved ? saved.id : null,
      createdAt: saved ? saved.created_at : new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// AUTHENTICATED / CARD TOKEN: Cancel a collection request with UPS
app.post('/api/collections/cancel', async (req, res) => {
  try {
    const { prn, token } = req.body || {};
    if (!prn) return res.status(400).json({ ok: false, error: 'PRN is required to cancel a pickup.' });

    if (token) {
      const card = db.hasDb ? await db.getCardByToken(token) : null;
      if (!card || card.enabled === false) return res.status(404).json({ ok: false, error: 'Rate card not available' });
    } else if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const cancelRes = await ups.cancelPickup(prn);

    if (db.hasDb) {
      await db.updateCollectionByPrn(prn, { status: 'cancelled', response: cancelRes });
    }

    res.json({
      ok: true,
      prn,
      status: 'cancelled',
      message: cancelRes.ok ? 'Collection successfully cancelled with UPS.' : 'Collection marked cancelled in Moov system.',
      upsNotice: cancelRes.ok ? null : cancelRes.error,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// AUTHENTICATED / CARD TOKEN: Reschedule a collection with UPS (cancels old PRN, books new date/time)
app.post('/api/collections/reschedule', async (req, res) => {
  try {
    const { oldPrn, token, pickupDate, readyTime, closeTime, instructions } = req.body || {};
    if (!oldPrn) return res.status(400).json({ ok: false, error: 'Current PRN is required to reschedule.' });
    if (!pickupDate) return res.status(400).json({ ok: false, error: 'New pickup date is required.' });

    if (token) {
      const card = db.hasDb ? await db.getCardByToken(token) : null;
      if (!card || card.enabled === false) return res.status(404).json({ ok: false, error: 'Rate card not available' });
    } else if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const existing = db.hasDb ? await db.getCollectionByPrn(oldPrn) : null;

    // 1. Send Cancellation to UPS
    const cancelRes = await ups.cancelPickup(oldPrn);

    // 2. Build payload for new pickup
    const newPayload = {
      companyName: existing ? existing.company_name : req.body.companyName,
      contactName: existing ? existing.contact_name : req.body.contactName,
      phone: existing ? existing.phone : req.body.phone,
      email: existing ? existing.email : req.body.email,
      addressLine: existing ? existing.address_line : req.body.addressLine,
      city: existing ? existing.city : req.body.city,
      postcode: existing ? existing.postal_code : req.body.postcode,
      country: existing ? existing.country_code : (req.body.country || 'GB'),
      pickupDate: pickupDate,
      readyTime: readyTime || (existing ? existing.ready_time : '10:00'),
      closeTime: closeTime || (existing ? existing.close_time : '17:00'),
      parcels: existing ? existing.parcels : (req.body.parcels || 1),
      weight: existing ? existing.total_weight_kg : (req.body.weight || 1),
      trackingNumber: existing ? existing.tracking_number : req.body.trackingNumber,
      specialInstruction: instructions || (existing ? existing.special_instruction : ''),
      serviceCode: existing ? existing.service_code : (req.body.serviceCode || '011'),
    };

    const newPickup = await ups.createPickup(newPayload);
    if (!newPickup.ok) {
      return res.status(400).json({
        ok: false,
        error: 'Failed to book rescheduled pickup with UPS: ' + newPickup.error,
        cancelStatus: cancelRes.ok ? 'cancelled' : 'cancel_failed'
      });
    }

    // 3. Update DB
    if (db.hasDb) {
      await db.updateCollectionByPrn(oldPrn, {
        prn: newPickup.prn,
        status: 'rescheduled',
        pickup_date: pickupDate,
        ready_time: newPayload.readyTime,
        close_time: newPayload.closeTime,
        special_instruction: newPayload.specialInstruction,
        response: { cancel: cancelRes, newPickup },
      });
    }

    res.json({
      ok: true,
      oldPrn,
      newPrn: newPickup.prn,
      pickupDate,
      readyTime: newPayload.readyTime,
      closeTime: newPayload.closeTime,
      rateStatus: newPickup.rateStatus,
      message: 'Collection successfully rescheduled with UPS.',
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PUBLIC / AUTH: Create / Book a pickup collection for an existing booked shipment
app.post('/api/collections/create-for-shipment', async (req, res) => {
  try {
    const { token, shipmentId, trackingNumber, pickupDate, readyTime, closeTime, instructions } = req.body || {};
    let card = null;
    if (token) {
      card = db.hasDb ? await db.getCardByToken(token) : null;
      if (!card) return res.status(404).json({ ok: false, error: 'Invalid card token' });
    } else if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Authorization required.' });
    }

    const sId = shipmentId || trackingNumber;
    if (!sId) return res.status(400).json({ ok: false, error: 'Shipment ID or tracking number required.' });

    let existing = null;
    if (db.hasDb) {
      existing = await db.getShipmentByTracking(sId) || await db.getShipmentById(sId);
    }
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Shipment record not found.' });
    }

    const sender = (typeof existing.sender === 'object' && existing.sender) ? existing.sender : {};
    const pkgs = Array.isArray(existing.packages) ? existing.packages : [];
    const totalWt = Number(existing.total_weight_kg) || pkgs.reduce((sum, p) => sum + (Number(p.weight) || 0) * (parseInt(p.qty, 10) || 1), 0) || 1;
    const totalPieces = pkgs.reduce((sum, p) => sum + (parseInt(p.qty, 10) || 1), 0) || 1;

    const pickupRes = await ups.createPickup({
      companyName: sender.company || sender.name || 'Sender',
      contactName: sender.name || sender.company || 'Sender',
      phone: sender.phone || '07498991612',
      email: sender.email || '',
      addressLine: sender.line1 || '1 Main Street',
      addressLine2: sender.line2 || '',
      city: sender.city || '',
      postcode: sender.postcode || '',
      country: sender.country || 'GB',
      destinationCountry: (existing.receiver && existing.receiver.country) || 'GB',
      pickupDate: pickupDate,
      readyTime: readyTime || '10:00',
      closeTime: closeTime || '17:00',
      parcels: totalPieces,
      weight: Math.round(totalWt * 10) / 10,
      trackingNumber: existing.tracking_number || trackingNumber,
      specialInstruction: instructions || '',
      serviceCode: existing.service_code || '065',
    });

    if (!pickupRes.ok) {
      return res.status(400).json({
        ok: false,
        error: 'UPS Collection Error: ' + pickupRes.error,
        raw: pickupRes.raw,
      });
    }

    if (db.hasDb) {
      await db.updateShipmentPrn(sId, pickupRes.prn);
      await db.createCollectionRecord({
        prn: pickupRes.prn,
        status: 'booked',
        carrier: 'UPS',
        service_code: existing.service_code || '065',
        card_id: existing.card_id || (card ? card.id : null),
        customer: existing.customer || (card ? card.customer : null),
        token: token || null,
        company_name: sender.company || sender.name || 'Sender',
        contact_name: sender.name || sender.company || 'Sender',
        phone: sender.phone || '',
        email: sender.email || '',
        address_line: sender.line1 || '',
        city: sender.city || '',
        postal_code: sender.postcode || '',
        country_code: sender.country,
        pickup_date: pickupDate,
        ready_time: readyTime || '10:00',
        close_time: closeTime || '17:00',
        parcels: totalPieces,
        total_weight_kg: Math.round(totalWt * 10) / 10,
        tracking_number: existing.tracking_number || trackingNumber,
        special_instruction: instructions || '',
        response: pickupRes.json,
      });
    }

    res.json({
      ok: true,
      prn: pickupRes.prn,
      pickupDate,
      readyTime: readyTime || '10:00',
      closeTime: closeTime || '17:00',
      message: 'Collection successfully booked with UPS. PRN: ' + pickupRes.prn,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PUBLIC / CARD-AUTHENTICATED: Book Import Shipment with UPS & Electronic Documents + Schedule Collection
app.post('/api/book-import', async (req, res) => {
  try {
    const {
      token, sender, receiver, packages, serviceCode, goodsValue,
      invoiceBase64, invoiceFormat, packingSlipBase64, packingSlipFormat,
      bookPickup, pickupDate, readyTime, closeTime, instructions
    } = req.body || {};

    let card = null;
    if (token) {
      card = db.hasDb ? await db.getCardByToken(token) : null;
      if (!card) return res.status(404).json({ ok: false, error: 'Invalid card token' });
    }

    if (!sender || !sender.country || !sender.city || !sender.line1) {
      return res.status(400).json({ ok: false, error: 'Origin sender collection address (line1, city, country) is required.' });
    }
    if (!receiver || !receiver.country || !receiver.city || !receiver.line1) {
      return res.status(400).json({ ok: false, error: 'Destination delivery address (line1, city, country) is required.' });
    }

    const pkgs = (Array.isArray(packages) && packages.length) ? packages : [{ weight: 1, qty: 1 }];

    // 1. Book the shipment with UPS (Step 1)
    const shipResult = await ups.bookShipment({
      sender,
      receiver,
      packages: pkgs,
      serviceCode: serviceCode || '65',
      goodsValue: goodsValue || 0,
      invoiceBase64,
      invoiceFormat,
      packingSlipBase64,
      packingSlipFormat,
    });

    if (!shipResult.ok) {
      return res.status(400).json({
        ok: false,
        error: shipResult.error || 'UPS failed to book shipment consignment.',
        raw: shipResult.raw,
        request: shipResult.request,
      });
    }

    const trackingNumber = shipResult.trackingNumber;
    let prn = null;
    let pickupResult = null;

    // 2. Automatically schedule collection (Step 2: made sequentially with tracking number)
    if (bookPickup !== false && trackingNumber) {
      // Brief pause to ensure UPS registers tracking number in its transaction ledger
      await new Promise(r => setTimeout(r, 600));
      try {
        const totalWt = pkgs.reduce((sum, p) => sum + (Math.max(1, parseInt(p.qty, 10) || 1) * (Number(p.weight) || 1)), 0);
        const totalPieces = pkgs.reduce((sum, p) => sum + Math.max(1, parseInt(p.qty, 10) || 1), 0);

        pickupResult = await ups.createPickup({
          companyName: sender.company || sender.name || 'Sender',
          contactName: sender.name || sender.company || 'Sender',
          phone: sender.phone || '07498991612',
          email: sender.email || '',
          addressLine: sender.line1 || '1 Main Street',
          addressLine2: sender.line2 || '',
          city: sender.city || '',
          postcode: sender.postcode || '',
          country: sender.country,
          destinationCountry: receiver.country || 'GB',
          pickupDate: pickupDate,
          readyTime: readyTime || '10:00',
          closeTime: closeTime || '17:00',
          parcels: totalPieces,
          weight: Math.round(totalWt * 10) / 10,
          trackingNumber: trackingNumber,
          specialInstruction: instructions || '',
          serviceCode: serviceCode || '065',
        });
        if (pickupResult && pickupResult.ok) {
          prn = pickupResult.prn;
          if (db.hasDb) {
            try {
              await db.createCollectionRecord({
                prn: pickupResult.prn,
                status: 'booked',
                carrier: 'UPS',
                service_code: serviceCode || '065',
                card_id: card ? card.id : null,
                customer: card ? card.customer : (req.user ? req.user.email : null),
                token: token || null,
                company_name: sender.company || sender.name || 'Sender',
                contact_name: sender.name || sender.company || 'Sender',
                phone: sender.phone || '',
                email: sender.email || '',
                address_line: sender.line1 || '',
                city: sender.city || '',
                postal_code: sender.postcode || '',
                country_code: sender.country,
                pickup_date: pickupDate,
                ready_time: readyTime || '10:00',
                close_time: closeTime || '17:00',
                parcels: totalPieces,
                total_weight_kg: Math.round(totalWt * 10) / 10,
                tracking_number: trackingNumber,
                special_instruction: instructions || '',
                response: pickupResult.json,
              });
            } catch (cdbErr) {
              console.error('[book-import collection db error]', cdbErr.message);
            }
          }
        } else {
          console.error('[book-import pickup error]', pickupResult ? pickupResult.error : 'Unknown pickup error');
        }
      } catch (e) {
        console.error('[book-import pickup error]', e.message);
      }
    }

    // 3. Save booking into database
    const totalWt = pkgs.reduce((sum, p) => sum + (Math.max(1, parseInt(p.qty, 10) || 1) * (Number(p.weight) || 1)), 0);
    const compiledPackages = (shipResult.packages || []).map((sp, idx) => {
      const orig = pkgs[idx] || pkgs[0] || {};
      return {
        trackingNumber: sp.trackingNumber,
        labelGraphic: sp.labelGraphic,
        htmlImage: sp.htmlImage,
        weight: orig.weight || 1,
        l: orig.l || 10,
        w: orig.w || 10,
        h: orig.h || 10,
        packaging: orig.packaging || 'custom',
      };
    });

    let saved = null;
    try {
      saved = await db.createShipmentRecord({
        shipment_id: shipResult.shipmentId,
        tracking_number: trackingNumber,
        status: 'booked',
        mode: 'import',
        carrier: 'UPS',
        service_code: serviceCode || '65',
        service_name: ups.svcName(serviceCode || '65'),
        card_id: card ? card.id : null,
        customer: card ? card.customer : (req.user ? req.user.email : null),
        token: token || null,
        sender,
        receiver,
        packages: compiledPackages.length ? compiledPackages : pkgs,
        total_weight_kg: Math.round(totalWt * 10) / 10,
        goods_value: Number(goodsValue) || 0,
        cost_price: shipResult.totalCost,
        sell_price: null,
        prn: prn,
        label_base64: (shipResult.packages && shipResult.packages[0] && shipResult.packages[0].labelGraphic) || null,
        documents_attached: {
          invoice: !!invoiceBase64,
          packingSlip: !!packingSlipBase64,
        },
        response: { shipment: shipResult.json, pickup: pickupResult ? pickupResult.json : null },
        created_by: req.user ? req.user.id : null,
      });
    } catch (e) {
      console.error('[book-import db error]', e.message);
    }

    res.json({
      ok: true,
      shipmentId: shipResult.shipmentId,
      trackingNumber,
      prn,
      packages: compiledPackages.length ? compiledPackages : shipResult.packages,
      documentsAttached: {
        invoice: !!invoiceBase64,
        packingSlip: !!packingSlipBase64,
      },
      pickupBooked: !!prn,
      pickupError: (pickupResult && !pickupResult.ok) ? pickupResult.error : null,
      savedId: saved ? saved.id : null,
      createdAt: saved ? saved.created_at : new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PUBLIC / AUTH: Void / Cancel a booked UPS shipment AND its associated collection simultaneously
app.post('/api/shipments/cancel', async (req, res) => {
  try {
    const { token, shipmentId, trackingNumber, prn } = req.body || {};
    let card = null;
    if (token) {
      card = db.hasDb ? await db.getCardByToken(token) : null;
      if (!card) return res.status(404).json({ ok: false, error: 'Invalid card token' });
    } else if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Authorization required to cancel shipment.' });
    }

    const sId = shipmentId || trackingNumber;
    if (!sId && !prn) {
      return res.status(400).json({ ok: false, error: 'Tracking number or PRN required to cancel.' });
    }

    // Lookup any associated PRN from the database shipment record if not explicitly provided
    let targetPrn = prn;
    if (!targetPrn && db.hasDb && sId) {
      const existing = await db.getShipmentByTracking(sId) || (shipmentId ? await db.getShipmentById(shipmentId) : null);
      if (existing && existing.prn) {
        targetPrn = existing.prn;
      }
    }

    // 1. Cancel / Void shipment with UPS
    let voidResult = { ok: true };
    if (sId) {
      voidResult = await ups.voidShipment({ shipmentId: sId, trackingNumber });
    }

    // 2. Simultaneously cancel driver pickup collection with UPS
    let pickupResult = { ok: true };
    if (targetPrn) {
      pickupResult = await ups.cancelPickup(targetPrn);
    }

    // 3. Mark both cancelled in database
    if (db.hasDb) {
      if (sId) await db.updateShipmentStatus(sId, 'cancelled');
      if (targetPrn) await db.updateCollectionByPrn(targetPrn, { status: 'cancelled' });
    }

    res.json({
      ok: true,
      voided: voidResult.ok,
      pickupCancelled: pickupResult.ok,
      prnCancelled: targetPrn || null,
      message: 'Shipment ' + (sId || '') + (targetPrn ? (' and collection PRN ' + targetPrn) : '') + ' cancelled successfully.',
      upsNotice: (!voidResult.ok ? voidResult.error : null) || (!pickupResult.ok ? pickupResult.error : null),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PUBLIC / AUTH: Live Tracking query with activity timeline, collection milestone, and POD / signature (supports single & multi-piece shipments)
app.get('/api/shipments/:tracking/track', async (req, res) => {
  try {
    const { tracking } = req.params;
    if (!tracking) return res.status(400).json({ ok: false, error: 'Tracking number or shipment ID required' });

    // 1. Check if tracking identifier corresponds to a database shipment record
    let shipment = null;
    if (db.hasDb) {
      shipment = await db.getShipmentByTracking(tracking) || await db.getShipmentById(tracking);
    }

    const pkgList = (shipment && Array.isArray(shipment.packages) && shipment.packages.length)
      ? shipment.packages
      : [{ trackingNumber: tracking }];

    // If multi-piece shipment, query tracking for all packages in parallel
    const parcelResults = await Promise.all(
      pkgList.map(async (pkg, idx) => {
        const trk = pkg.trackingNumber || tracking;
        const resObj = await ups.trackShipment(trk);
        return {
          parcelIndex: idx + 1,
          totalParcels: pkgList.length,
          trackingNumber: trk,
          weight: pkg.weight || null,
          dimensions: (pkg.l && pkg.w && pkg.h) ? `${pkg.l} × ${pkg.w} × ${pkg.h} cm` : null,
          packaging: pkg.packaging || 'custom',
          ok: resObj.ok,
          statusCode: resObj.statusCode || '',
          statusDescription: resObj.statusDescription || (resObj.ok ? 'Active' : (resObj.error || 'Pending Scans')),
          isCollected: !!resObj.isCollected,
          isDelivered: !!resObj.isDelivered,
          activities: resObj.activities || [],
          delivery: resObj.delivery || {},
          error: resObj.error || null,
          raw: resObj.raw || null,
        };
      })
    );

    // Primary parcel result (or first successful one)
    const primary = parcelResults.find(p => p.ok) || parcelResults[0];

    // Aggregated overall shipment status across parcels
    const anyCollected = parcelResults.some(p => p.isCollected);
    const allDelivered = parcelResults.length > 0 && parcelResults.every(p => p.isDelivered);
    const anyDelivered = parcelResults.some(p => p.isDelivered);

    const calculatedDbStatus = allDelivered ? 'delivered' : (anyCollected ? 'in_transit' : (shipment && shipment.status ? shipment.status : 'booked'));
    if (shipment && db.hasDb && shipment.status !== 'cancelled' && shipment.status !== calculatedDbStatus) {
      try {
        await db.updateShipmentStatus(shipment.id, calculatedDbStatus);
      } catch (err) {
        console.error('[track] status update error:', err.message);
      }
    }

    res.json({
      ok: parcelResults.some(p => p.ok),
      shipmentId: (shipment && (shipment.shipment_id || shipment.id)) || null,
      trackingNumber: tracking,
      masterTracking: (shipment && shipment.tracking_number) || tracking,
      statusCode: primary.statusCode || (allDelivered ? 'D' : (anyCollected ? 'IT' : 'M')),
      statusDescription: allDelivered ? 'Delivered' : (anyDelivered ? 'Partially Delivered' : (anyCollected ? 'In Transit / Collected' : (primary.statusDescription || 'Manifest Registered'))),
      isCollected: anyCollected,
      isDelivered: allDelivered,
      anyDelivered: anyDelivered,
      activities: primary.activities || [],
      delivery: primary.delivery || {},
      parcels: parcelResults,
      multiPiece: parcelResults.length > 1,
      error: (!parcelResults.some(p => p.ok)) ? primary.error : null,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PUBLIC / AUTH: Delete / Remove a specific shipment record (e.g. failed/cancelled test)
app.all(['/api/shipments/:id/delete', '/api/shipments/delete'], async (req, res) => {
  try {
    const { token, id, trackingNumber, shipmentId } = { ...req.query, ...req.body, ...req.params };
    const target = id || trackingNumber || shipmentId;
    if (!target) return res.status(400).json({ ok: false, error: 'Shipment identifier required to delete.' });

    if (db.hasDb) {
      const deleted = await db.deleteShipment(target);
      return res.json({ ok: true, deleted, message: 'Shipment removed from history.' });
    }
    res.json({ ok: true, message: 'Shipment removed.' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PUBLIC / AUTH: Purge all cancelled shipments
app.post('/api/shipments/purge-cancelled', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (db.hasDb) {
      const count = await db.deleteCancelledShipments({ token });
      return res.json({ ok: true, purgedCount: count, message: `Removed ${count} cancelled shipment(s) from history.` });
    }
    res.json({ ok: true, purgedCount: 0 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Email configuration status
app.get('/api/email/status', (req, res) => {
  res.json({
    ok: true,
    configured: emailService.isConfigured(),
    sender: process.env.EMAIL_FROM || '"MOOV Parcel Team" <service@moovparcel.co.uk>',
    replyTo: process.env.EMAIL_REPLY_TO || 'service@moovparcel.co.uk',
  });
});

// PUBLIC (with card token) / AUTH: Email shipping labels and collection details
app.post('/api/shipments/:id/email-labels', async (req, res) => {
  try {
    const { id } = req.params;
    const { token, to, cc, customMessage, pdfBase64, pdfFilename } = req.body || {};

    let card = null;
    if (token) {
      card = db.hasDb ? await db.getCardByToken(token) : null;
      if (!card || card.enabled === false) return res.status(404).json({ ok: false, error: 'Rate card not available' });
    } else if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    let shipment = null;
    if (db.hasDb) {
      shipment = await db.getShipmentById(id) || await db.getShipmentByTracking(id);
    }
    if (!shipment) {
      return res.status(404).json({ ok: false, error: 'Shipment record not found' });
    }

    const toEmail = (to || '').trim() || (shipment.sender && shipment.sender.email) || (shipment.receiver && shipment.receiver.email);
    if (!toEmail) {
      return res.status(400).json({ ok: false, error: 'Recipient email address is required.' });
    }

    if (!emailService.isConfigured()) {
      return res.status(400).json({
        ok: false,
        error: 'Google Workspace email is not active yet. Please configure GMAIL_APP_PASSWORD in environment variables.',
      });
    }

    await emailService.sendShipmentLabelsEmail({
      to: toEmail,
      cc: (cc || '').trim(),
      shipment,
      customMessage,
      pdfBase64,
      pdfFilename,
    });

    res.json({
      ok: true,
      sentTo: toEmail,
      message: `Labels and collection details successfully sent to ${toEmail}`,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PUBLIC (with card token) / AUTH: Upload / Attach post-shipment customs documents (Commercial Invoice / Packing List)
app.post('/api/shipments/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    const { token, documentType, fileName, base64, format } = req.body || {};

    let card = null;
    if (token) {
      card = db.hasDb ? await db.getCardByToken(token) : null;
      if (!card || card.enabled === false) return res.status(404).json({ ok: false, error: 'Rate card not available' });
    } else if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    if (!base64) {
      return res.status(400).json({ ok: false, error: 'Document file content (Base64) is required.' });
    }

    let shipment = null;
    if (db.hasDb) {
      shipment = await db.getShipmentById(id) || await db.getShipmentByTracking(id);
    }
    if (!shipment) {
      return res.status(404).json({ ok: false, error: 'Shipment record not found' });
    }

    const docType = documentType || '002'; // 002 = Commercial Invoice, 004 = Packing List
    const docFmt = (format || 'PDF').toUpperCase();

    // 1. Transmit to UPS Paperless Document API if tracking number exists
    let upsDocResult = { ok: true };
    if (shipment.tracking_number) {
      upsDocResult = await ups.uploadPaperlessDocument({
        trackingNumber: shipment.tracking_number,
        documentType: docType,
        base64Content: base64,
        format: docFmt,
      });
    }

    // 2. Update local database record
    let updatedShipment = null;
    if (db.hasDb) {
      const existingDocs = (typeof shipment.documents_attached === 'object' && shipment.documents_attached) ? shipment.documents_attached : {};
      const updatedDocs = {
        ...existingDocs,
        invoice: docType === '002' ? true : existingDocs.invoice,
        packingSlip: docType === '004' ? true : existingDocs.packingSlip,
        invoiceFileName: docType === '002' ? (fileName || 'Commercial_Invoice.pdf') : existingDocs.invoiceFileName,
        packingSlipFileName: docType === '004' ? (fileName || 'Packing_Slip.pdf') : existingDocs.packingSlipFileName,
        uploadedAt: new Date().toISOString(),
      };
      updatedShipment = await db.updateShipmentDocuments(shipment.id || id, updatedDocs);
    }

    res.json({
      ok: true,
      upsPaperless: upsDocResult.ok,
      upsNotice: upsDocResult.ok ? null : upsDocResult.error,
      shipment: updatedShipment || shipment,
      message: docType === '002'
        ? 'Commercial Invoice uploaded & attached to shipment successfully.'
        : 'Packing List uploaded & attached to shipment successfully.',
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// AUTHENTICATED: List all booked shipments
app.get('/api/shipments', auth.requireAuth, async (req, res) => {
  try {
    const list = await db.listShipments({ limit: req.query.limit });
    res.json({ shipments: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CARD TOKEN: List shipments for a specific customer card
app.get('/api/card/:token/shipments', async (req, res) => {
  try {
    const card = db.hasDb ? await db.getCardByToken(req.params.token) : null;
    if (!card || card.enabled === false) return res.status(404).json({ error: 'Rate card not available' });
    const list = await db.listShipments({ token: req.params.token, limit: req.query.limit || 20 });
    res.json({ shipments: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// AUTHENTICATED: List previous collection requests
app.get('/api/collections', auth.requireAuth, async (req, res) => {
  try {
    const list = await db.listCollections({ limit: req.query.limit });
    res.json({ collections: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ADMIN: raw UPS rating test — confirm credentials + response shape against CIE/production.
app.post('/api/ups-test', auth.requireAdmin, async (req, res) => {
  try { res.json(await ups.quoteRatesRaw(req.body || {})); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
// PUBLIC: import/export quote page (clean URL; also served as /import-quote by static).
app.get('/import', (req, res) => res.sendFile(path.join(__dirname, 'public', 'import-quote.html')));

// PUBLIC: branded card page.
app.get('/card/:token', (req, res) => res.sendFile(path.join(__dirname, 'public', 'card.html')));

// ---- static front end + SPA fallback ----
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

initDbAndListen();
async function initDbAndListen() {
  try { await db.initDb(); } catch (e) { console.error('[server] initDb error:', e.message); }
  app.listen(PORT, () => console.log('International Rate Calculator listening on port ' + PORT));
}
