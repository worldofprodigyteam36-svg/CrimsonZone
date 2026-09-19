const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

const { baremuxPath } = require('@mercuryworkshop/bare-mux/node');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const IDENTITY_HEADER_NAMES = [
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-forwarded-port',
  'x-real-ip',
  'forwarded',
  'via',
  'cf-connecting-ip',
  'true-client-ip',
  'client-ip',
  'real-ip',
];

function stripIdentityHeaders(headers) {
  for (const name of IDENTITY_HEADER_NAMES) {
    delete headers[name];
    delete headers[name.toUpperCase()];
  }

  return headers;
}

app.use((req, res, next) => {
  stripIdentityHeaders(req.headers);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

function sendUvFallback(req, res) {
  res.status(502).type('html').send(
    '<!doctype html><meta charset="utf-8"><title>Proxy not ready</title>' +
    '<body style="font-family:system-ui;background:#111;color:#eee;padding:24px">' +
    '<h1>Proxy service worker is not active yet.</h1>' +
    '<p>Refresh the page and try the proxy again.</p>' +
    `<pre style="white-space:pre-wrap;color:#aaa">URL: ${req.originalUrl}\n` +
    `Sec-Fetch-Dest: ${req.get('sec-fetch-dest') || 'missing'}\n` +
    `Sec-Fetch-Mode: ${req.get('sec-fetch-mode') || 'missing'}</pre></body>`
  );
}

// Proxied requests should be intercepted by /uv/sw.js before they reach Express.
// If they reach the server, show a clear fallback instead of the app shell.
app.use(/^\/uv\/service(?:\/|$)/, (req, res) => {
  console.warn('[UV] Proxied request reached Express fallback:', req.url);
  sendUvFallback(req, res);
});

app.use('/uv/', (req, res, next) => {
  if (req.path === '/sw.js' || req.path === '/uv.sw.js') {
    res.set('Service-Worker-Allowed', '/');
    res.set('Cache-Control', 'no-store');
  }
  next();
});

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/epoxy/', express.static(path.join(__dirname, '../node_modules/@mercuryworkshop/epoxy-transport/dist')));
app.use('/baremux/', express.static(baremuxPath));

// UV files (explicit routes before wildcard)
app.get('/uv/uv.config.js', (req, res) => res.sendFile(path.join(__dirname, '../public/uv/uv.config.js')));
app.get('/uv/uv.bundle.js', (req, res) => res.sendFile(path.join(__dirname, '../public/uv/uv.bundle.js')));
app.get('/uv/uv.client.js', (req, res) => res.sendFile(path.join(__dirname, '../public/uv/uv.client.js')));
app.get('/uv/uv.handler.js', (req, res) => res.sendFile(path.join(__dirname, '../public/uv/uv.handler.js')));
app.get('/uv/uv.sw.js', (req, res) => res.sendFile(path.join(__dirname, '../public/uv/uv.sw.js')));

function readDataFile(filename) {
  const filePath = path.join(__dirname, '../data', filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`[ERROR] Reading ${filename}:`, err.message);
    return [];
  }
}

app.get('/api/games', (req, res) => res.json({ success: true, data: readDataFile('games.json') }));
app.get('/api/apps',  (req, res) => res.json({ success: true, data: readDataFile('apps.json') }));
app.get('/api/tools', (req, res) => res.json({ success: true, data: readDataFile('tools.json') }));

app.get(['/wisp', '/wisp/'], (req, res) => {
  res.status(200).type('text').send('Wisp endpoint is online. WebSocket upgrade required.');
});

app.get('/api/proxy-health', (req, res) => {
  const target = 'https://duckduckgo.com/';
  const request = https.get(target, { timeout: 10000 }, response => {
    response.resume();
    res.json({
      success: true,
      target,
      statusCode: response.statusCode,
      serverCanReachTarget: response.statusCode >= 200 && response.statusCode < 500,
    });
  });

  request.on('timeout', () => {
    request.destroy(new Error('Outbound HTTPS request timed out.'));
  });

  request.on('error', err => {
    res.status(502).json({
      success: false,
      target,
      error: err.message,
      code: err.code,
    });
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/uv/service/')) {
    sendUvFallback(req, res);
  } else if (path.extname(req.path) && req.path !== '/') {
    res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const { server: wisp, logging } = require('@mercuryworkshop/wisp-js/server');
logging.set_level(logging.NONE);

const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  stripIdentityHeaders(req.headers);

  const pathname = new URL(req.url, 'http://localhost').pathname.replace(/\/+$/, '');
  if (pathname === '/wisp') {
    wisp.routeRequest(req, socket, head);
  } else {
    socket.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log('\x1b[31m');
  console.log('  ██████╗██████╗ ██╗███╗   ███╗███████╗ ██████╗ ███╗   ██╗');
  console.log('  ██╔═══╝██╔══██╗██║████╗ ████║██╔════╝██╔═══██╗████╗  ██║');
  console.log('  ██║    ██████╔╝██║██╔████╔██║███████╗██║   ██║██╔██╗ ██║');
  console.log('  ██║    ██╔══██╗██║██║╚██╔╝██║╚════██║██║   ██║██║╚██╗██║');
  console.log('  ██████╗██║  ██║██║██║ ╚═╝ ██║███████║╚██████╔╝██║ ╚████║');
  console.log('  ╚═════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝');
  console.log('\x1b[0m');
  console.log(`  \x1b[31m🔴 ZONE\x1b[0m  →  http://${HOST}:${PORT}\n`);
});

module.exports = { app, server };
