// Zero-dependency static server for the rate calculator (single-page app).
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const FILE = path.join(__dirname, 'index.html');
const html = fs.readFileSync(FILE); // read once at boot

http.createServer((req, res) => {
  if (req.url === '/healthz') { res.writeHead(200); return res.end('ok'); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(html);
}).listen(PORT, () => console.log('Rate calculator listening on port ' + PORT));
