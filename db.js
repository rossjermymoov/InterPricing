// Data layer: Postgres when DATABASE_URL is present, else read-only seed.json (config only; auth needs a DB).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const seedPath = path.join(__dirname, 'seed.json');
const readSeed = () => JSON.parse(fs.readFileSync(seedPath, 'utf8'));

let pool = null;
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });
}

async function initDb() {
  if (!pool) {
    console.log('[db] No DATABASE_URL — config from seed.json; auth is disabled until a database is attached.');
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rate_config (
      id integer PRIMARY KEY DEFAULT 1,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT rate_config_singleton CHECK (id = 1)
    );`);
  const rc = await pool.query('SELECT 1 FROM rate_config WHERE id = 1');
  if (rc.rows.length === 0) {
    await pool.query('INSERT INTO rate_config (id, data) VALUES (1, $1)', [JSON.stringify(readSeed())]);
    console.log('[db] Seeded rate_config from seed.json');
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS app_secrets (key text PRIMARY KEY, value text NOT NULL);`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      email text UNIQUE NOT NULL,
      name text,
      password_hash text NOT NULL,
      role text NOT NULL DEFAULT 'sales',
      created_at timestamptz NOT NULL DEFAULT now()
    );`);
  console.log('[db] schema ready (rate_config, users, app_secrets)');
}

// ---- config ----
async function getConfig() {
  if (pool) {
    try {
      const { rows } = await pool.query('SELECT data FROM rate_config WHERE id = 1');
      if (rows[0]) return rows[0].data;
    } catch (e) {
      console.error('[db] config read failed, falling back to seed.json:', e.message);
    }
  }
  return readSeed();
}
async function setConfig(data) {
  if (!pool) throw new Error('No database configured');
  await pool.query(
    `INSERT INTO rate_config (id, data, updated_at) VALUES (1, $1, now())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [JSON.stringify(data)]
  );
  return true;
}

// ---- secret (JWT signing key), persisted so logins survive restarts ----
async function getSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (!pool) return 'dev-insecure-secret-change-me';
  const r = await pool.query(`SELECT value FROM app_secrets WHERE key = 'jwt'`);
  if (r.rows[0]) return r.rows[0].value;
  const s = crypto.randomBytes(48).toString('hex');
  await pool.query(`INSERT INTO app_secrets (key, value) VALUES ('jwt', $1) ON CONFLICT (key) DO NOTHING`, [s]);
  const r2 = await pool.query(`SELECT value FROM app_secrets WHERE key = 'jwt'`);
  return r2.rows[0].value;
}

// ---- users ----
const pub = (u) => u && { id: u.id, email: u.email, name: u.name, role: u.role, created_at: u.created_at };
async function countUsers() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM users');
  return rows[0].n;
}
async function getUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  return rows[0] || null;
}
async function getUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}
async function createUser({ email, name, password_hash, role }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, name, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING *`,
    [email.trim(), name || null, password_hash, role === 'admin' ? 'admin' : 'sales']
  );
  return pub(rows[0]);
}
async function listUsers() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
  return rows.map(pub);
}
async function updateUser(id, { name, role, password_hash }) {
  const sets = [], vals = [];
  if (name !== undefined) { vals.push(name); sets.push(`name = $${vals.length}`); }
  if (role !== undefined) { vals.push(role === 'admin' ? 'admin' : 'sales'); sets.push(`role = $${vals.length}`); }
  if (password_hash !== undefined) { vals.push(password_hash); sets.push(`password_hash = $${vals.length}`); }
  if (!sets.length) return getUserById(id).then(pub);
  vals.push(id);
  const { rows } = await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`, vals);
  return pub(rows[0]);
}
async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return true;
}

module.exports = {
  initDb, getConfig, setConfig, getSecret,
  countUsers, getUserByEmail, getUserById, createUser, listUsers, updateUser, deleteUser,
  hasDb: !!pool,
};
