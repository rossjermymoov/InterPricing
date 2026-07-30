const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require('./db');
const auth = require('./auth');

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
    const { markups, fuel, caps } = req.body || {};
    if (markups) cfg.settings.markups = { ...cfg.settings.markups, ...numify(markups) };
    if (fuel) cfg.settings.fuel = { ...cfg.settings.fuel, ...numify(fuel) };
    if (caps) cfg.settings.caps = { ...cfg.settings.caps, ...numify(caps) };
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

// ---- static front end + SPA fallback ----
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

initDbAndListen();
async function initDbAndListen() {
  try { await db.initDb(); } catch (e) { console.error('[server] initDb error:', e.message); }
  app.listen(PORT, () => console.log('International Rate Calculator listening on port ' + PORT));
}
