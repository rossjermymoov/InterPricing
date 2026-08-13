const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require('./db');
const auth = require('./auth');
const pricing = require('./pricing');
const { fetchPickups, fetchPickupsRaw } = require('./pickups');

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
    const { fuelByService, caps, accessorials } = req.body || {};
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
// ADMIN: test a postcode against the courier pickup API (diagnose + reveal response shape).
app.post('/api/pickups-test', auth.requireAdmin, async (req, res) => {
  try {
    const { postcode, carriers } = req.body || {};
    if (!postcode) return res.status(400).json({ error: 'Postcode required' });
    res.json(await fetchPickupsRaw(postcode, carriers));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

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
