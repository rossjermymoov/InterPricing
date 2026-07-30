# DPD vs UPS International Rate Calculator

Single-page rate calculator, served by a zero-dependency Node server.

## Run locally
```
npm start        # serves index.html on $PORT (default 3000)
```

## Deploy (Railway)
Railway auto-detects Node via Nixpacks and runs `npm start` (see `railway.json`). Set no env vars; Railway injects `PORT`.

## Structure
- `index.html` — the whole app (logic + rate data + Chart.js, all inlined)
- `server.js` — static server
- `source/` — generator script + data to rebuild `index.html`

## Note on data
All rate data is currently inlined in `index.html` and therefore visible to anyone who can open the page. Keep this repo and the Railway service private until rates are moved server-side.
