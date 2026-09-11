/**
 * Server-Sent Events (SSE) Manager
 * Real-time event broadcasting to active customer and admin dashboards
 */

class SSEManager {
  constructor() {
    this.clients = new Set();
  }

  addClient(req, res, user) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

    const client = { req, res, user };
    this.clients.add(client);

    req.on('close', () => {
      this.clients.delete(client);
    });
  }

  broadcast(eventType, data) {
    const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
    for (const client of this.clients) {
      try {
        client.res.write(`data: ${payload}\n\n`);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }
}

module.exports = new SSEManager();
