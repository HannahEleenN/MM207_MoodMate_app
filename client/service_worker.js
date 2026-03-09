"use strict";

const VERSION = 'v1.4';
const CACHE_NAME = `mood-tracker-cache-${VERSION}`;
console.info('Service worker starting, version:', VERSION);
const URLS_TO_CACHE = [
    '/index.html',
    '/style.css',
    '/app.mjs',
    '/manifest.json',
    '/offline.html',
    '/assets/icons/MoodMate_Favicon.svg',
    '/assets/icons/Favicon_Smileys.png'
    // Flag files will be discovered and cached during install by reading assets/flags/flags.json
];

self.addEventListener("install", (event) =>
{
    event.waitUntil((async () =>
    {
        const cache = await caches.open(CACHE_NAME);

        // First, cache the known core files (tolerant per-file)
        for (const url of URLS_TO_CACHE) {
            try {
                await cache.add(url);
            } catch (err) {
                console.warn('Service worker: failed to cache', url, err);
            }
        }

        // Try to fetch manifest.json and cache any icons listed there
        try {
            const mresp = await fetch('/manifest.json');
            if (mresp && mresp.ok) {
                const manifest = await mresp.json();
                if (manifest && Array.isArray(manifest.icons)) {
                    for (const icon of manifest.icons) {
                        if (icon && icon.src) {
                            const path = '/' + String(icon.src).replace(/^\/+/, '');
                            try { await cache.add(path); } catch (err) { console.warn('Service worker: failed to cache manifest icon', path, err); }
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Service worker: could not load manifest.json', err);
        }

        // Then try to fetch flags.json to discover additional flag assets to cache
        try {
            const resp = await fetch('/assets/flags/flags.json');
            if (resp && resp.ok) {
                const flags = await resp.json();
                if (Array.isArray(flags)) {
                    for (const f of flags) {
                        // Normalize path to start with '/'
                        const path = f && f.file ? ('/' + String(f.file).replace(/^\/+/, '')) : null;
                        if (path) {
                            try {
                                await cache.add(path);
                            } catch (err) {
                                console.warn('Service worker: failed to cache flag', path, err);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Service worker: could not load flags.json', err);
        }

        await self.skipWaiting();
    })()
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        // Remove old caches
        const keys = await caches.keys();
        await Promise.all(keys.map(k => {
            if (k !== CACHE_NAME) return caches.delete(k);
            return Promise.resolve();
        }));
        await self.clients.claim();
    })());
});

// A small helper to determine if this is a navigation request
function isNavigationRequest(request) {
    return request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'));
}

self.addEventListener("fetch", (event) =>
{
    const req = event.request;

    // Runtime caching for flag assets: if a flag is requested and not cached, fetch and cache it
    if (req.url.includes('/assets/flags/')) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(req);
            if (cached) return cached;
            try {
                const resp = await fetch(req);
                if (resp && resp.ok) {
                    try { await cache.put(req, resp.clone()); } catch (e) { /* ignore */ }
                    return resp;
                }
            } catch (e) {
                // fallback to offline
            }
            return caches.match('/offline.html');
        })());
        return;
    }

    // Try specialized handling for API requests
    if (req.url.includes('/api/')) {
        // Network-first for API requests, fallback to cache if offline
        event.respondWith((async () => {
            try {
                const networkResp = await fetch(req);
                // Optionally cache API GET responses (not caching POST/PUT)
                if (req.method === 'GET') {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(req, networkResp.clone());
                }
                return networkResp;
            } catch (err) {
                const cached = await caches.match(req);
                return cached || new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
            }
        })());
        return;
    }

    // Navigation requests: network-first then cache then offline page
    if (isNavigationRequest(req)) {
        event.respondWith((async () => {
            try {
                const networkResp = await fetch(req);
                const cache = await caches.open(CACHE_NAME);
                cache.put(req, networkResp.clone());
                return networkResp;
            } catch (err) {
                const cached = await caches.match(req);
                if (cached) return cached;
                // Return offline page for navigation fallbacks
                const offline = await caches.match('/offline.html');
                return offline || new Response('<h1>Offline</h1><p>You are offline.</p>', { headers: { 'Content-Type': 'text/html' } });
            }
        })());
        return;
    }

    // Otherwise, default to cache-first for assets
    event.respondWith(caches.match(req).then(response => response || fetch(req).catch(() => caches.match('/offline.html'))));
});