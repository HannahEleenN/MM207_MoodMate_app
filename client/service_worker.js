"use strict";

const VERSION = 'v1.2';
const CACHE_NAME = `mood-tracker-cache-${VERSION}`;
const URLS_TO_CACHE = [
    '/index.html',
    '/style.css',
    '/app.mjs',
    '/manifest.json',
    '/offline.html',
    '/assets/icons/MoodMate_Favicon.svg',
    '/assets/icons/Favicon_Smileys.png'
];

self.addEventListener("install", (event) =>
{
    event.waitUntil((async () =>
    {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(URLS_TO_CACHE);
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