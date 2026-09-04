// Data layer: Postgres when DATABASE_URL is present, else read-only seed.json (config only; auth needs a DB).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const seedPath = path.join(__dirname, 'seed.json');
const economyRatesPath = '/Users/rossjermy/.gemini/antigravity/brain/02660440-f478-43cc-ae1e-43d4f47eb078/scratch/economy_rates.json';
const readSeed = () => {
  const s = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  if (fs.existsSync(economyRatesPath)) {
    try {
      const econ = JSON.parse(fs.readFileSync(economyRatesPath, 'utf8'));
      if (econ.ups_economy_ddp) s.ups_economy_ddp = econ.ups_economy_ddp;
      if (econ.c2zone_economy_ddp) s.c2zone_economy_ddp = econ.c2zone_economy_ddp;
      if (econ.ups_economy_ddu) s.ups_economy_ddu = econ.ups_economy_ddu;
      if (econ.c2zone_economy_ddu) s.c2zone_economy_ddu = econ.c2zone_economy_ddu;
    } catch (e) {
      console.error('[db] Error loading economy rates:', e.message);
    }
  }
  s.dataVersion = 20;
  return s;
};

// Fill missing keys in target from defaults (deep), without overwriting existing values.
const deepFill = (target, defaults) => {
  for (const k of Object.keys(defaults)) {
    if (target[k] === undefined) target[k] = defaults[k];
    else if (defaults[k] && typeof defaults[k] === 'object' && !Array.isArray(defaults[k]) && typeof target[k] === 'object') deepFill(target[k], defaults[k]);
  }
  return target;
};

let pool = null;
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });
  // Don't let a transient connection drop crash the process.
  pool.on('error', (e) => console.error('[db] idle client error (recovering):', e.message));
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rate_cards (
      id serial PRIMARY KEY,
      token text UNIQUE NOT NULL,
      customer text,
      config jsonb NOT NULL DEFAULT '{}'::jsonb,
      enabled boolean NOT NULL DEFAULT true,
      created_by integer,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quote_logs (
      id serial PRIMARY KEY,
      card_id integer,
      token text,
      customer text,
      mode text,
      sender_country text,
      sender_company text,
      receiver_country text,
      receiver_postcode text,
      parcels integer,
      weight_kg numeric,
      goods_value numeric,
      currency text,
      cheapest numeric,
      services jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );`);
  await pool.query(`CREATE INDEX IF NOT EXISTS quote_logs_created_idx ON quote_logs (created_at DESC);`);
  await pool.query(`ALTER TABLE quote_logs ADD COLUMN IF NOT EXISTS debug jsonb;`); // raw UPS request/response for diagnostics
  await pool.query(`
    CREATE TABLE IF NOT EXISTS collections (
      id serial PRIMARY KEY,
      prn text,
      status text NOT NULL DEFAULT 'created',
      company_name text,
      contact_name text,
      phone text,
      email text,
      address_line text,
      city text,
      postal_code text,
      country_code text DEFAULT 'GB',
      pickup_date text,
      ready_time text,
      close_time text,
      parcels integer DEFAULT 1,
      total_weight_kg numeric,
      tracking_number text,
      special_instruction text,
      service_code text,
      response jsonb,
      created_by integer,
      created_at timestamptz NOT NULL DEFAULT now()
    );`);
  await pool.query(`CREATE INDEX IF NOT EXISTS collections_created_idx ON collections (created_at DESC);`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shipments (
      id serial PRIMARY KEY,
      shipment_id text,
      tracking_number text NOT NULL,
      status text NOT NULL DEFAULT 'booked',
      mode text NOT NULL DEFAULT 'import',
      carrier text NOT NULL DEFAULT 'UPS',
      service_code text,
      service_name text,
      card_id integer,
      customer text,
      token text,
      sender jsonb,
      receiver jsonb,
      packages jsonb,
      total_weight_kg numeric,
      goods_value numeric,
      cost_price numeric,
      sell_price numeric,
      prn text,
      label_base64 text,
      documents_attached jsonb,
      response jsonb,
      created_by integer,
      created_at timestamptz NOT NULL DEFAULT now()
    );`);
  await pool.query(`CREATE INDEX IF NOT EXISTS shipments_created_idx ON shipments (created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS shipments_tracking_idx ON shipments (tracking_number);`);
  await migrateConfig();
  console.log('[db] schema ready (rate_config, users, app_secrets, rate_cards, quote_logs, collections, shipments)');
}

// ---- quote logging + reporting ----
async function createQuoteLog(r) {
  if (!pool) return null;
  const { rows } = await pool.query(
    `INSERT INTO quote_logs (card_id, token, customer, mode, sender_country, sender_company, receiver_country, receiver_postcode, parcels, weight_kg, goods_value, currency, cheapest, services, debug)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
    [r.card_id || null, r.token || null, r.customer || null, r.mode || 'import',
     r.sender_country || null, r.sender_company || null, r.receiver_country || null, r.receiver_postcode || null,
     Math.round(Number(r.parcels) || 0), Number(r.weight_kg) || 0, Number(r.goods_value) || 0,
     r.currency || 'GBP', (r.cheapest == null ? null : Number(r.cheapest)), JSON.stringify(r.services || []),
     r.debug ? JSON.stringify(r.debug) : null]);
  return rows[0].id;
}
async function listQuoteLogs({ q, from, to, limit } = {}) {
  if (!pool) return [];
  const where = [], vals = [];
  if (q) { vals.push('%' + String(q).toLowerCase() + '%'); where.push(`(lower(coalesce(customer,'')) LIKE $${vals.length} OR lower(coalesce(sender_country,'')) LIKE $${vals.length} OR lower(coalesce(receiver_postcode,'')) LIKE $${vals.length} OR lower(coalesce(sender_company,'')) LIKE $${vals.length})`); }
  if (from) { vals.push(from); where.push(`created_at >= $${vals.length}`); }
  if (to) { vals.push(to); where.push(`created_at <= $${vals.length}`); }
  const lim = Math.min(500, Math.max(1, Number(limit) || 200));
  const sql = `SELECT * FROM quote_logs ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT ${lim}`;
  const { rows } = await pool.query(sql, vals);
  return rows;
}
async function quoteStats() {
  if (!pool) return { total: 0, today: 0, week: 0, month: 0, perDay: [], perCustomer: [] };
  const one = async (sql) => (await pool.query(sql)).rows[0].c;
  const total = await one('SELECT count(*)::int c FROM quote_logs');
  const today = await one("SELECT count(*)::int c FROM quote_logs WHERE created_at >= date_trunc('day', now())");
  const week = await one("SELECT count(*)::int c FROM quote_logs WHERE created_at >= now() - interval '7 days'");
  const month = await one("SELECT count(*)::int c FROM quote_logs WHERE created_at >= now() - interval '30 days'");
  const perDay = (await pool.query("SELECT to_char(date_trunc('day', created_at),'YYYY-MM-DD') d, count(*)::int c FROM quote_logs WHERE created_at >= now() - interval '29 days' GROUP BY 1 ORDER BY 1")).rows;
  const perCustomer = (await pool.query("SELECT coalesce(customer,'(unknown)') customer, count(*)::int c, max(created_at) last FROM quote_logs GROUP BY 1 ORDER BY c DESC LIMIT 25")).rows;
  return { total, today, week, month, perDay, perCustomer };
}

// Normalise older config shapes (e.g. markups stored as {cost,sell} -> single charge-out number).
async function migrateConfig() {
  const r = await pool.query('SELECT data FROM rate_config WHERE id = 1');
  if (!r.rows[0]) return;
  const cfg = r.rows[0].data;
  const seed = readSeed();
  let changed = false;
  if (cfg.settings) {
    if (!cfg.settings.fuelByService && seed.settings && seed.settings.fuelByService) {
      cfg.settings.fuelByService = seed.settings.fuelByService; changed = true;
    }
    if (!cfg.settings.regions && seed.settings && seed.settings.regions) { cfg.settings.regions = seed.settings.regions; changed = true; }
    // Sync accessorial list from seed (adds new ones, updates structure) while keeping edited rate fields.
    if (seed.settings && Array.isArray(seed.settings.accessorials)) {
      const prev = cfg.settings.accessorials || [];
      const byKey = {}; prev.forEach((a) => { byKey[a.key] = a; });
      const merged = seed.settings.accessorials.map((sa) => {
        const old = byKey[sa.key] || {};
        const keep = {};
        for (const fld of ['list', 'disc', 'pct', 'min', 'sell', 'sellMin', 'sellPct']) if (old[fld] != null) keep[fld] = old[fld];
        return { ...sa, ...keep };
      });
      if (JSON.stringify(merged) !== JSON.stringify(prev)) { cfg.settings.accessorials = merged; changed = true; }
    }
  }
  // Rate-data refresh: when seed.dataVersion changes, replace rate tables but preserve admin settings.
  if ((cfg.dataVersion || 0) !== (seed.dataVersion || 0)) {
    const RATE_KEYS = ['bands','countries','divisor','dpd_classic','dpd_express','dpd_parcel','dpd_expresspak','ups_express','ups_standard','c2zone_express','c2zone_standard','ups_economy_ddp','c2zone_economy_ddp','ups_economy_ddu','c2zone_economy_ddu'];
    for (const k of RATE_KEYS) cfg[k] = seed[k];
    delete cfg.ups; delete cfg.c2zone;
    cfg.settings = deepFill(cfg.settings || {}, seed.settings || {});
    // Duty rules were redefined in v10 — take the DPD duty accessorials straight from seed
    // (the generic sync above preserves edited rate fields, which would keep the old £12.50 / USA bucket).
    const RESET_KEYS = ['dpdEu', 'dpdRow', 'dpdUsa', 'disbursement'];
    const seedAcc = (seed.settings && seed.settings.accessorials) || [];
    const seedByKey = {}; seedAcc.forEach((a) => { seedByKey[a.key] = a; });
    if (cfg.settings && Array.isArray(cfg.settings.accessorials)) {
      cfg.settings.accessorials = cfg.settings.accessorials
        .filter((a) => a.key !== 'dpdUsa' && a.key !== 'ddp' && a.key !== 'merchantProc' && !a.key.endsWith('_dpd'))
        .map((a) => (RESET_KEYS.includes(a.key) && seedByKey[a.key]) ? JSON.parse(JSON.stringify(seedByKey[a.key])) : a);
    }
    cfg.dataVersion = seed.dataVersion;
    changed = true;
    console.log('[db] refreshed rate data to version ' + seed.dataVersion);
  }
  if (changed) {
    await pool.query('UPDATE rate_config SET data = $1 WHERE id = 1', [JSON.stringify(cfg)]);
    console.log('[db] migrated config');
  }
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

// ---- rate cards (shareable customer links) ----
const newToken = () => crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, (m) => ({ '+': 'a', '/': 'b', '=': '' }[m]));
async function createCard({ customer, config, created_by }) {
  const token = newToken();
  const { rows } = await pool.query(
    `INSERT INTO rate_cards (token, customer, config, created_by) VALUES ($1,$2,$3,$4) RETURNING *`,
    [token, customer || null, JSON.stringify(config || {}), created_by || null]
  );
  return rows[0];
}
async function listCards() {
  const { rows } = await pool.query(
    `SELECT rc.*, u.name AS creator_name, u.email AS creator_email
       FROM rate_cards rc LEFT JOIN users u ON u.id = rc.created_by
      ORDER BY rc.created_at DESC`);
  return rows;
}
async function getCardByToken(token) {
  const { rows } = await pool.query('SELECT * FROM rate_cards WHERE token = $1', [token]);
  return rows[0] || null;
}
async function getCardById(id) {
  const { rows } = await pool.query('SELECT * FROM rate_cards WHERE id = $1', [id]);
  return rows[0] || null;
}
async function updateCard(id, { customer, config, enabled }) {
  const sets = [], vals = [];
  if (customer !== undefined) { vals.push(customer); sets.push(`customer = $${vals.length}`); }
  if (config !== undefined) { vals.push(JSON.stringify(config)); sets.push(`config = $${vals.length}`); }
  if (enabled !== undefined) { vals.push(!!enabled); sets.push(`enabled = $${vals.length}`); }
  if (!sets.length) return getCardById(id);
  sets.push('updated_at = now()');
  vals.push(id);
  const { rows } = await pool.query(`UPDATE rate_cards SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`, vals);
  return rows[0];
}
async function deleteCard(id) {
  await pool.query('DELETE FROM rate_cards WHERE id = $1', [id]);
  return true;
}

// ---- collections (pickup requests) ----
async function createCollectionRecord(r) {
  if (!pool) return null;
  const { rows } = await pool.query(
    `INSERT INTO collections (
      prn, status, company_name, contact_name, phone, email,
      address_line, city, postal_code, country_code,
      pickup_date, ready_time, close_time, parcels, total_weight_kg,
      tracking_number, special_instruction, service_code, response, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING id, prn, created_at`,
    [
      r.prn || null,
      r.status || (r.prn ? 'booked' : 'failed'),
      r.company_name || null,
      r.contact_name || null,
      r.phone || null,
      r.email || null,
      r.address_line || null,
      r.city || null,
      r.postal_code || null,
      r.country_code || 'GB',
      r.pickup_date || null,
      r.ready_time || null,
      r.close_time || null,
      Math.max(1, Math.floor(Number(r.parcels) || 1)),
      Number(r.total_weight_kg) || 1.0,
      r.tracking_number || null,
      r.special_instruction || null,
      r.service_code || '011',
      r.response ? JSON.stringify(r.response) : null,
      r.created_by || null,
    ]
  );
  return rows[0];
}

async function listCollections({ limit } = {}) {
  if (!pool) return [];
  const lim = Math.min(100, Math.max(1, Number(limit) || 50));
  const { rows } = await pool.query(`SELECT * FROM collections ORDER BY created_at DESC LIMIT ${lim}`);
  return rows;
}

async function getCollectionByPrn(prn) {
  if (!pool) return null;
  const { rows } = await pool.query(`SELECT * FROM collections WHERE prn = $1`, [String(prn).trim()]);
  return rows[0] || null;
}

async function updateCollectionByPrn(oldPrn, updates) {
  if (!pool) return null;
  const c = await getCollectionByPrn(oldPrn);
  if (!c) return null;
  const { rows } = await pool.query(
    `UPDATE collections SET
      prn = COALESCE($1, prn),
      status = COALESCE($2, status),
      pickup_date = COALESCE($3, pickup_date),
      ready_time = COALESCE($4, ready_time),
      close_time = COALESCE($5, close_time),
      special_instruction = COALESCE($6, special_instruction),
      response = COALESCE($7, response)
     WHERE prn = $8 RETURNING *`,
    [
      updates.prn || null,
      updates.status || null,
      updates.pickup_date || null,
      updates.ready_time || null,
      updates.close_time || null,
      updates.special_instruction || null,
      updates.response ? JSON.stringify(updates.response) : null,
      String(oldPrn).trim(),
    ]
  );
  return rows[0] || null;
}

// ---- shipments (booked shipments with tracking & labels) ----
async function createShipmentRecord(r) {
  if (!pool) return { id: Date.now(), ...r };
  const { rows } = await pool.query(
    `INSERT INTO shipments (
      shipment_id, tracking_number, status, mode, carrier,
      service_code, service_name, card_id, customer, token,
      sender, receiver, packages, total_weight_kg, goods_value,
      cost_price, sell_price, prn, label_base64, documents_attached, response, created_by
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22
    ) RETURNING *`,
    [
      r.shipment_id || null,
      r.tracking_number,
      r.status || 'booked',
      r.mode || 'import',
      r.carrier || 'UPS',
      r.service_code || null,
      r.service_name || null,
      r.card_id || null,
      r.customer || null,
      r.token || null,
      r.sender ? JSON.stringify(r.sender) : null,
      r.receiver ? JSON.stringify(r.receiver) : null,
      r.packages ? JSON.stringify(r.packages) : null,
      Number(r.total_weight_kg) || 1.0,
      Number(r.goods_value) || 0,
      r.cost_price != null ? Number(r.cost_price) : null,
      r.sell_price != null ? Number(r.sell_price) : null,
      r.prn || null,
      r.label_base64 || null,
      r.documents_attached ? JSON.stringify(r.documents_attached) : null,
      r.response ? JSON.stringify(r.response) : null,
      r.created_by || null,
    ]
  );
  return rows[0];
}

async function listShipments({ token, limit } = {}) {
  if (!pool) return [];
  const lim = Math.min(100, Math.max(1, Number(limit) || 50));
  if (token) {
    const { rows } = await pool.query(`SELECT * FROM shipments WHERE token = $1 ORDER BY created_at DESC LIMIT ${lim}`, [token]);
    return rows;
  }
  const { rows } = await pool.query(`SELECT * FROM shipments ORDER BY created_at DESC LIMIT ${lim}`);
  return rows;
}

async function getShipmentById(id) {
  if (!pool || !id) return null;
  const { rows } = await pool.query(`SELECT * FROM shipments WHERE id::text = $1`, [String(id)]);
  return rows[0] || null;
}

async function getShipmentByTracking(tracking) {
  if (!pool || !tracking) return null;
  const { rows } = await pool.query(`SELECT * FROM shipments WHERE tracking_number = $1 OR shipment_id = $1 OR id::text = $1 LIMIT 1`, [String(tracking)]);
  return rows[0] || null;
}

async function updateShipmentStatus(idOrTracking, status) {
  if (!pool || !idOrTracking) return null;
  const { rows } = await pool.query(
    `UPDATE shipments SET status = $2 WHERE id::text = $1 OR tracking_number = $1 OR shipment_id = $1 RETURNING *`,
    [String(idOrTracking), status]
  );
  return rows[0] || null;
}

async function updateShipmentPrn(identifierOrOldPrn, newPrn) {
  if (!pool || !identifierOrOldPrn) return null;
  const { rows } = await pool.query(
    `UPDATE shipments SET prn = $2 WHERE prn = $1 OR id::text = $1 OR tracking_number = $1 OR shipment_id = $1 RETURNING *`,
    [String(identifierOrOldPrn), newPrn]
  );
  return rows[0] || null;
}

async function deleteShipment(idOrTracking) {
  if (!pool || !idOrTracking) return false;
  const { rowCount } = await pool.query(
    `DELETE FROM shipments WHERE id::text = $1 OR tracking_number = $1 OR shipment_id = $1`,
    [String(idOrTracking)]
  );
  return rowCount > 0;
}

async function deleteCancelledShipments({ token } = {}) {
  if (!pool) return 0;
  if (token) {
    const { rowCount } = await pool.query(
      `DELETE FROM shipments WHERE token = $1 AND status = 'cancelled'`,
      [token]
    );
    return rowCount;
  }
  const { rowCount } = await pool.query(`DELETE FROM shipments WHERE status = 'cancelled'`);
  return rowCount;
}

async function updateShipmentDocuments(idOrTracking, docs) {
  if (!pool || !idOrTracking) return null;
  const { rows } = await pool.query(
    `UPDATE shipments SET documents_attached = $2 WHERE id::text = $1 OR tracking_number = $1 OR shipment_id = $1 RETURNING *`,
    [String(idOrTracking), docs ? JSON.stringify(docs) : null]
  );
  return rows[0] || null;
}

module.exports = {
  initDb, getConfig, setConfig, getSecret,
  countUsers, getUserByEmail, getUserById, createUser, listUsers, updateUser, deleteUser,
  createCard, listCards, getCardByToken, getCardById, updateCard, deleteCard,
  createQuoteLog, listQuoteLogs, quoteStats,
  createCollectionRecord, listCollections, getCollectionByPrn, updateCollectionByPrn,
  createShipmentRecord, listShipments, getShipmentById, getShipmentByTracking, updateShipmentStatus, updateShipmentPrn, updateShipmentDocuments,
  deleteShipment, deleteCancelledShipments,
  hasDb: !!pool,
};
