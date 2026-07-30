// Data layer: Postgres when DATABASE_URL is present, else read-only seed.json fallback.
const fs = require('fs');
const path = require('path');

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
    console.log('[db] No DATABASE_URL — serving config from seed.json (read-only).');
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rate_config (
      id         integer PRIMARY KEY DEFAULT 1,
      data       jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT rate_config_singleton CHECK (id = 1)
    );
  `);
  const { rows } = await pool.query('SELECT 1 FROM rate_config WHERE id = 1');
  if (rows.length === 0) {
    await pool.query('INSERT INTO rate_config (id, data) VALUES (1, $1)', [JSON.stringify(readSeed())]);
    console.log('[db] Seeded rate_config from seed.json');
  } else {
    console.log('[db] rate_config already present');
  }
}

async function getConfig() {
  if (pool) {
    try {
      const { rows } = await pool.query('SELECT data FROM rate_config WHERE id = 1');
      if (rows[0]) return rows[0].data;
    } catch (e) {
      console.error('[db] read failed, falling back to seed.json:', e.message);
    }
  }
  return readSeed();
}

async function setConfig(data) {
  if (!pool) throw new Error('No database configured (DATABASE_URL missing)');
  await pool.query(
    `INSERT INTO rate_config (id, data, updated_at) VALUES (1, $1, now())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [JSON.stringify(data)]
  );
  return true;
}

module.exports = { initDb, getConfig, setConfig, hasDb: !!pool };
