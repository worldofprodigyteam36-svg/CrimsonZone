/* global UVServiceWorker, __uv$config */
importScripts('/uv/uv.bundle.js');
importScripts('/uv/uv.config.js');
importScripts(__uv$config.sw || '/uv/uv.sw.js');

const uv = new UVServiceWorker();

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

function hostnameMatchesDomain(hostname, domain) {
  const normalizedHostname = String(hostname || '').toLowerCase();
  const normalizedDomain = String(domain || '').toLowerCase();

  return normalizedHostname === normalizedDomain || normalizedHostname.endsWith(`.${normalizedDomain}`);
}

function isBlockedIpLookupHost(url) {
  const blocklist = Array.isArray(__uv$config.ipBlocklist) ? __uv$config.ipBlocklist : [];
  const hostname = url && url.hostname;

  return blocklist.some(domain => hostnameMatchesDomain(hostname, domain));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

async function blockedIpLookupResponse(url) {
  try {
    const response = await fetch('/blocked.html', { cache: 'no-store' });
    if (response.ok) {
      const html = await response.text();

      return new Response(html.replaceAll('{{BLOCKED_URL}}', escapeHtml(url.href)), {
        status: 451,
        statusText: 'Blocked',
        headers: {
          'content-type': response.headers.get('content-type') || 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    }
  } catch (error) {
    console.warn('[UV] Failed to load /blocked.html:', error);
  }

  return new Response('Blocked by proxy privacy policy.', {
    status: 451,
    statusText: 'Blocked',
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

uv.on('request', event => {
  const headers = event.data.headers || {};

  for (const name of IDENTITY_HEADER_NAMES) {
    delete headers[name];
    delete headers[name.toUpperCase()];
  }

  const protocol = event.data.url && event.data.url.protocol;
  if (protocol === 'stun:' || protocol === 'stuns:' || protocol === 'turn:' || protocol === 'turns:') {
    event.respondWith(new Response('WebRTC transport blocked', { status: 403 }));
    return;
  }

  if (isBlockedIpLookupHost(event.data.url)) {
    event.respondWith(blockedIpLookupResponse(event.data.url));
  }
});

async function handleRequest(event) {
  if (uv.route(event)) {
    return await uv.fetch(event);
  }

  return fetch(event.request);
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});
