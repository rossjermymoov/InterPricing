const express = require('express');
const path = require('path');
const { initDb, getConfig, hasDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '8mb' }));

app.get('/healthz', (req, res) => res.json({ ok: true, db: hasDb }));

// Config API — the calculator reads all rates + settings from here.
app.get('/api/config', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json(await getConfig());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Static front end
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

initDb()
  .catch((e) => console.error('[server] initDb error:', e.message))
  .finally(() => app.listen(PORT, () => console.log('International Rate Calculator listening on port ' + PORT)));
