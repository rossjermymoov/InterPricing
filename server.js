const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require('./db');
const auth = require('./auth');
const pricing = require('./pricing');
const { fetchPickups, fetchPickupsRaw } = require('./pickups');
const ups = require('./ups');
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
    const pc = card.config && card.config.postcode;
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
    const services = (r.services || []).map((s) => ({
      code: s.code, name: s.name, days: s.days, currency: s.currency,
      price: Math.round((s.cost * (1 + markup / 100) + hsCharge) * 100) / 100,
    }));
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
const CODE2KEY = { '11': 'us', '65': 'ux' }; // UPS Standard -> us · Worldwide (Express) Saver -> ux
app.post('/api/card-rate', async (req, res) => {
  try {
    const { token, country, postcode, weight, l, w, h } = req.body || {};
    if (!country || !token || !db.hasDb) return res.json({ enabled: false, services: [] });
    const card = await db.getCardByToken(token);
    if (!card || card.enabled === false) return res.json({ enabled: false, services: [] });
    const iso = nameToIso(country);
    if (!iso) return res.json({ enabled: false, services: [] }); // unknown country name → card uses static
    const mkObj = (card.config && card.config.markup) || {};
    const markupOf = (key) => (typeof mkObj === 'number' ? mkObj : (Number(mkObj[key]) || 0));

    const r = await ups.quoteRates({
      mode: 'export', sender: MOOV_ORIGIN,
      receiver: { country: iso, postcode: postcode || '' },
      packages: [{ qty: 1, weight: weight || 1, l, w, h }], value: 100, currency: 'GBP',
    });
    if (!r || !r.enabled) return res.json({ enabled: false, services: [] });

    const services = [];
    (r.services || []).forEach((s) => {
      const key = CODE2KEY[s.code]; if (!key) return;
      const factor = 1 + markupOf(key) / 100;
      const bd = s.breakdown || {};
      // Scale published components into sell terms so the breakdown reconciles to the sell total:
      // sellComponent = publishedComponent × (negotiated/published) × (1 + markup).
      const np = (bd.pubTotal && bd.negTotal) ? (bd.negTotal / bd.pubTotal) : 1;
      const scale = (v) => (v == null ? null : Math.round(v * np * factor * 100) / 100);
      const accessorials = (bd.accessorials || []).map((a) => ({ name: a.name, amt: scale(a.amt), remote: !!a.remote })).filter((a) => a.amt > 0);
      services.push({
        key, code: s.code, name: s.name, days: s.days,
        price: Math.round(s.cost * factor * 100) / 100,
        base: scale(bd.base), fuel: scale(bd.fuel), accessorials,
        remote: accessorials.some((a) => a.remote),
      });
    });
    res.json({ enabled: true, postcodeUsed: !!(postcode && String(postcode).trim()), services });
  } catch (e) { res.json({ enabled: false, error: e.message, services: [] }); }
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
