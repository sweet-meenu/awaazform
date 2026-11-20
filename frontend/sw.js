/* Generated into public/sw.js after next build. Never cache API responses or user documents. */
const VERSION = '460d378a0cf02d47';
const CACHE = `awaazform-shell-${VERSION}`;
const PRECACHE = ["/","/form","/documents","/profiles","/settings","/report","/privacy","/share","/offline","/_next/static/uHnORqNiKGKwjuZtnrVgR/_buildManifest.js","/_next/static/uHnORqNiKGKwjuZtnrVgR/_clientMiddlewareManifest.js","/_next/static/uHnORqNiKGKwjuZtnrVgR/_ssgManifest.js","/_next/static/media/07c7676b89ed2778-s.p.2bn3s6zvc0dyp.woff2","/_next/static/media/11dd2674118891ce-s.3fnhzl7vreycw.woff2","/_next/static/media/2542c97081d27b0c-s.0tlm39yf_ckdx.woff2","/_next/static/media/2fb76073e23fd9e4-s.3lvt2whj97whp.woff2","/_next/static/media/356810c1c81c4d60-s.p.2qe5xx8d5sx8i.woff2","/_next/static/media/45462fd7b7c12654-s.0k62hbripvv8p.woff2","/_next/static/media/46a9e2f250689b4a-s.0-dom-5bn10r2.woff2","/_next/static/media/5bc02fdab8c33fd8-s.0iws-x-_m0m6k.woff2","/_next/static/media/6131cbbf5549afa2-s.2uwcyprjm3xu3.woff2","/_next/static/media/648dfd57dbd478a1-s.2h3p55pchisjm.woff2","/_next/static/media/6cc1ab76fa999d2c-s.0f7v04cdymq72.woff2","/_next/static/media/76b70a1dbe058eb5-s.1y4-pdgsjb-pw.woff2","/_next/static/media/7d8aa323c2a5602a-s.0jxe124sc_62t.woff2","/_next/static/media/896f877212e69066-s.1rzgyqoc5r_1p.woff2","/_next/static/media/9379da8ac5af6a68-s.3xa5d8otat0m1.woff2","/_next/static/media/a582cd8757547b1f-s.p.2oqonvbxcl6a7.woff2","/_next/static/media/ba63f6a0e436df8e-s.3-6t-g6q0vh0a.woff2","/_next/static/chunks/0-o94719lpzt_.js","/_next/static/chunks/0_xng8_evpprk.js","/_next/static/chunks/0baki7izuz03y.js","/_next/static/chunks/0bbbbb2bwlilg.js","/_next/static/chunks/0cz1d0mv5g_q7.js","/_next/static/chunks/0e6y930zv6tsz.js","/_next/static/chunks/0khkfrmq3waem.js","/_next/static/chunks/0ocxyjfdvyq33.js","/_next/static/chunks/0qz2cvvated1j.js","/_next/static/chunks/0z2q4pnpzvcn5.js","/_next/static/chunks/1anivk5ezva9y.css","/_next/static/chunks/1inwawzg9xsdj.js","/_next/static/chunks/1na-g1zb2hte3.js","/_next/static/chunks/1uke8-pa7i19z.js","/_next/static/chunks/1x4nbtf2-k12v.js","/_next/static/chunks/24_osncrtekfq.js","/_next/static/chunks/256-ogydz25gv.js","/_next/static/chunks/27asakenpaew4.js","/_next/static/chunks/2fb6omf-1503m.js","/_next/static/chunks/2h1w0ceji0k4w.js","/_next/static/chunks/2s2qb-n56klw_.js","/_next/static/chunks/2ut55zb9qnnh5.js","/_next/static/chunks/380zbaoioutzf.js","/_next/static/chunks/3d7p5s2gtnakj.js","/_next/static/chunks/3dgl-mmodp-_l.js","/_next/static/chunks/3gzeyvgtvgzeh.js","/_next/static/chunks/3qwtpnt8hv654.js","/_next/static/chunks/3wragjgj90uw7.js","/_next/static/chunks/3xz7gkv91lv42.js","/_next/static/chunks/41kcduypitkqv.js","/_next/static/chunks/4570tf7_yhhqd.js","/_next/static/chunks/turbopack-3-ry682tkyiqk.js","/icons/apple-touch-icon.png","/icons/icon-192.png","/icons/icon-512.png","/icons/logo.svg","/icons/maskable-192.png","/icons/maskable-512.png","/manifest.webmanifest","/pdf.worker.min.mjs"];
const SHELLS = new Set(['/', '/form', '/documents', '/profiles', '/settings', '/report', '/privacy', '/share', '/offline']);
const INBOX = 'awaazform-share';
const MAX_FILE = 10 * 1024 * 1024;
const RETENTION = 60 * 60 * 1000;

self.addEventListener('install', (event) => {
  // Atomic installation: a failed download leaves the previous worker and its cache usable.
  // No skipWaiting here: an update must not interrupt someone's form or microphone.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Keep one previous build for other open tabs during an explicitly accepted update.
    const previous = (await caches.keys()).filter((k) => k.startsWith('awaazform-shell-') && k !== CACHE);
    await Promise.all(previous.slice(0, -1).map((k) => caches.delete(k)));
    await pruneInbox().catch(() => {});
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/share-target' && request.method === 'POST') {
    event.respondWith(receiveShare(request));
    return;
  }
  // POST, APIs, external origins and Next's RSC payloads are deliberately network-only.
  if (request.method !== 'GET' || url.pathname.startsWith('/api/') || request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.status < 500) return response;
      } catch { /* The app shell contains no personal data; restore the local session in React. */ }
      const cache = await caches.open(CACHE);
      return (SHELLS.has(url.pathname) && await cache.match(url.pathname)) || await cache.match('/offline') || Response.error();
    })());
    return;
  }
  // Only immutable build assets and explicit public assets are eligible for caching.
  if (url.pathname.startsWith('/_next/static/') || PRECACHE.includes(url.pathname)) {
    event.respondWith((async () => {
      const current = await caches.open(CACHE);
      const cached = await current.match(request) || (url.pathname.startsWith('/_next/static/') && await caches.match(request));
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && url.pathname.startsWith('/_next/static/')) {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })());
  }
});

self.addEventListener('message', (event) => {
  const source = event.source;
  if (!source || !('url' in source) || new URL(source.url).origin !== self.location.origin) return;
  if (event.data?.type === 'ACTIVATE_UPDATE') {
    event.waitUntil(self.skipWaiting());
    return;
  }
  const { type, id } = event.data || {};
  if (!['READ_SHARE', 'DELETE_SHARE'].includes(type) || !/^[a-f0-9-]{36}$/.test(id || '')) return;
  if (new URL(source.url).pathname !== '/share') return;
  event.waitUntil((async () => {
    try {
      if (type === 'DELETE_SHARE') {
        await inboxOperation('readwrite', (store) => store.delete(id));
        event.ports[0]?.postMessage({ ok: true });
        return;
      }
      await pruneInbox();
      const record = await inboxOperation('readonly', (store) => store.get(id));
      if (!record) throw new Error('missing');
      const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: record.iv }, record.key, record.bytes);
      const form = await new Response(bytes, { headers: { 'Content-Type': record.contentType } }).formData();
      event.ports[0]?.postMessage({ file: form.get('files'), url: form.get('url'), text: form.get('text'), title: form.get('title') });
    } catch {
      event.ports[0]?.postMessage({ error: 'unavailable' });
    }
  })());
});

async function receiveShare(request) {
  const redirect = (query) => Response.redirect(new URL(`/share?${query}`, self.location.origin), 303);
  try {
    const length = Number(request.headers.get('content-length'));
    if (length > MAX_FILE + 64 * 1024) return redirect('error=large');
    const form = await request.formData();
    const files = form.getAll('files').filter((v) => v instanceof File && v.size);
    if (files.length > 1) return redirect('error=multiple');
    const file = files[0];
    if (file && file.size > MAX_FILE) return redirect('error=large');
    if (file && !/\.(pdf|docx)$/i.test(file.name) && !['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) return redirect('error=type');
    const safe = new FormData();
    if (file) safe.set('files', file);
    for (const name of ['url', 'text', 'title']) {
      const value = form.get(name);
      if (typeof value === 'string') safe.set(name, value.slice(0, 8192));
    }
    if (!file && !safe.get('url') && !safe.get('text')) return redirect('error=type');
    const response = new Response(safe);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const bytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await response.arrayBuffer());
    const id = crypto.randomUUID();
    await pruneInbox();
    await inboxOperation('readwrite', (store) => store.put({ id, iv, key, bytes, contentType: response.headers.get('content-type'), createdAt: Date.now() }));
    return redirect(`id=${id}`);
  } catch {
    return redirect('error=unavailable');
  }
}

function inboxOperation(mode, operation) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(INBOX, 1);
    open.onupgradeneeded = () => open.result.createObjectStore('items', { keyPath: 'id' });
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('items', mode);
      const request = operation(tx.objectStore('items'));
      tx.oncomplete = () => { db.close(); resolve(request?.result); };
      tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
    };
  });
}

async function pruneInbox() {
  const all = await inboxOperation('readonly', (store) => store.getAll());
  const sorted = all.sort((a, b) => b.createdAt - a.createdAt);
  await Promise.all(sorted.filter((r, i) => i >= 4 || Date.now() - r.createdAt > RETENTION)
    .map((r) => inboxOperation('readwrite', (store) => store.delete(r.id))));
}
