# International Rate Calculator

Web app that compares carrier services (DPD, UPS, more to come) by destination, weight and dimensions, with fuel and markup, and highlights the cheapest for the customer.

## Stack
- **Node/Express** backend (`server.js`)
- **PostgreSQL** for rate/config storage (`db.js`) — optional in dev
- Vanilla JS front end in `public/` (Chart.js served locally), data-driven via the config API

## How data flows
- All rates + settings live in the database (`rate_config` JSONB row), served at **`GET /api/config`**.
- The front end fetches `/api/config` on load — no rates are baked into the page.
- If `DATABASE_URL` is not set, the server falls back to read-only **`seed.json`** (handy for local dev and first boot).

## Run locally
```
npm install
npm start            # http://localhost:3000  (uses seed.json if no DATABASE_URL)
```

Rebuild the front end after editing `source/build_frontend.py`:
```
npm run build        # regenerates public/index.html + copies Chart.js
```

## Deploy on Railway
1. Connect this GitHub repo as a Railway service (auto-detects Node, runs `npm start`).
2. Add a **PostgreSQL** database to the project. Railway exposes `DATABASE_URL`; reference it on the app service so the server sees it.
3. On first boot the server creates the `rate_config` table and seeds it from `seed.json`.
4. **Settings → Networking → Generate Domain** for the public URL.

## Environment
- `DATABASE_URL` — Postgres connection string (Railway injects this).
- `PORT` — injected by Railway; defaults to 3000 locally.
- `PGSSLMODE=disable` — only if connecting to a non-SSL local Postgres.

## Auth
In-house email/password with roles **admin** and **sales**. First visit shows a one-time
setup screen to create the admin (no default password). JWT is stored in an httpOnly cookie;
the signing secret is auto-generated and stored in the DB (`app_secrets`) so logins survive
restarts. Set `SESSION_SECRET` to pin it explicitly. Admins manage users in-app; `/api/config`
and all data require a login.

## Roadmap
1. Foundation — Express + Postgres, rates server-side *(done)*
2. User management — in-house email/password auth, admin & sales roles *(done)*
3. Rate-card upload — admin uploads DPD/UPS spreadsheets to update services & rates
4. Customer rate-card outputs

## Structure
```
server.js            Express app (API + static + SPA fallback)
db.js                Postgres pool, schema init, seed, get/set config
seed.json            Initial rates + settings (fallback + first-boot seed)
public/index.html    Front end (fetches /api/config)
public/chart.umd.js  Chart.js (served locally)
source/              Front-end generator + data origin
```
