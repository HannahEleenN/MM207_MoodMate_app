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
];

// ---------------------------------------------------------------------------------------------------------------------

self.addEventListener("install", (event) =>
{
    event.waitUntil((async () =>
    {
        const cache = await caches.open(CACHE_NAME);

        for (const url of URLS_TO_CACHE)
        {
            try {
                await cache.add(url);
            } catch (err) {
                console.warn('Service worker: failed to cache', url, err);
            }
        }

        try
        {
            const manifestResponse = await fetch('/manifest.json');
            if (manifestResponse && manifestResponse.ok)
            {
                const manifest = await manifestResponse.json();
                const manifestIcons = (manifest && manifest.icons && Array.isArray(manifest.icons)) ? manifest.icons : [];
                if (manifestIcons.length)
                {
                    for (const icon of manifestIcons)
                    {
                        if (icon && icon.src)
                        {
                            const path = '/' + String(icon.src).replace(/^\/+/, '');
                            try { await cache.add(path); } catch (err) { console.warn('Service worker: failed to cache manifest icon', path, err); }
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Service worker: could not load manifest.json', err);
        }

        try
        {
            const resp = await fetch('/assets/flags/flags.json');
            if (resp && resp.ok)
            {
                const flags = await resp.json();
                const flagEntries = Array.isArray(flags) ? flags : [];
                if (flagEntries.length)
                {
                    for (const f of flagEntries)
                    {
                        const fileName = f && (f['flagImage'] || f['file'] || f['flag']) ? (f['flagImage'] || f['file'] || f['flag']) : null;
                        const path = fileName ? ('/' + String(fileName).replace(/^\/+/, '')) : null;
                        if (path)
                        {
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

// ---------------------------------------------------------------------------------------------------------------------

self.addEventListener('activate', (event) =>
{
    event.waitUntil((async () =>
    {
        const keys = await caches.keys();
        await Promise.all(keys.map(k =>
        {
            if (k !== CACHE_NAME) return caches.delete(k);
            return Promise.resolve(true);
        }));
        await self.clients.claim();
    })());
});

// ---------------------------------------------------------------------------------------------------------------------

function isNavigationRequest(request)
{
    return request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'));
}

// ---------------------------------------------------------------------------------------------------------------------

self.addEventListener("fetch", (event) =>
{
    const req = event.request;

    if (req.url.includes('/assets/flags/'))
    {
        event.respondWith((async () =>
        {
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(req);
            if (cached) return cached;
            try
            {
                const resp = await fetch(req);
                if (resp && resp.ok)
                {
                    try { await cache.put(req, resp.clone()); } catch (e) { }
                    return resp;
                }
            } catch (e) {
            }
            return caches.match('/offline.html');
        })());
        return;
    }

    if (req.url.includes('/api/'))
    {
        event.respondWith((async () =>
        {
            try
            {
                const networkResp = await fetch(req);
                if (req.method === 'GET')
                {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(req, networkResp.clone());
                }
                return networkResp;
            } catch (err)
            {
                const cached = await caches.match(req);
                return cached || new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
            }
        })());
        return;
    }

    if (isNavigationRequest(req))
    {
        event.respondWith((async () =>
        {
            try
            {
                const networkResp = await fetch(req);
                const cache = await caches.open(CACHE_NAME);
                await cache.put(req, networkResp.clone());
                return networkResp;
            } catch (err)
            {
                const cached = await caches.match(req);
                if (cached) return cached;
                const offline = await caches.match('/offline.html');
                return offline || new Response('<h1>Offline</h1><p>You are offline.</p>', { headers: { 'Content-Type': 'text/html' } });
            }
        })());
        return;
    }
    event.respondWith(caches.match(req).then(response => response || fetch(req).catch(() => caches.match('/offline.html'))));
});

// ---------------------------------------------------------------------------------------------------------------------

self.addEventListener('message', (event) =>
{
    if (!event || !event.data) return;
    (async () =>
    {
        try
        {
            const data = event.data;
            if (data && data.type === 'PING' && event.source && typeof event.source.postMessage === 'function') {
                try { event.source.postMessage({ type: 'PONG', version: VERSION }); } catch (e) {  }
            }
        } catch (err) {
            console.error('Service worker message handler error:', err);
        }
    })();
});