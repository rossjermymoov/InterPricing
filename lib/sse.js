/**
 * Server-Sent Events (SSE) Manager
 * Real-time event broadcasting to active customer and admin dashboards
 */

class SSEManager {
  constructor() {
    this.clients = new Set();
  }

  addClient(req, res, user) {
    const token = (req.query && req.query.token) ? String(req.query.token).trim() : null;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

    const client = { req, res, user, token };
    this.clients.add(client);

    req.on('close', () => {
      this.clients.delete(client);
    });
  }

  broadcast(eventType, data, scope = {}) {
    const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
    const targetToken = scope.token || (data && data.token) || null;

    for (const client of this.clients) {
      try {
        const isAdmin = client.user && (client.user.role === 'admin' || client.user.role === 'sales');
        // Admins receive all telemetry; customer cards only receive events scoped to their card token
        if (isAdmin) {
          client.res.write(`data: ${payload}\n\n`);
        } else if (targetToken && client.token === targetToken) {
          client.res.write(`data: ${payload}\n\n`);
        } else if (!targetToken && !scope.adminOnly && client.user) {
          client.res.write(`data: ${payload}\n\n`);
        }
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }
}

module.exports = new SSEManager();
