const VERSION = 'v2.1';
const CACHE_NAME = `mood-tracker-cache-${VERSION}`;
console.info('Service worker starting, version:', VERSION);

const URLS_TO_CACHE = [
    '/index.html',
    '/style.css',
    '/app.mjs',
    '/manifest.json',
    '/offline.html',
    '/assets/icons/MoodMate_Favicon.svg'
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
            let manifestIcons = [];
            const manifestResponse = await fetch('/manifest.json');
            if (manifestResponse && manifestResponse.ok)
            {
                const manifest = await manifestResponse.json();
                // manifestIcons is the array from manifest.json icons property
                manifestIcons = (manifest && manifest.icons && Array.isArray(manifest.icons)) ? manifest.icons : [];
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
                    for (const flagEntry of flagEntries)
                    {
                        const fileName = flagEntry && (flagEntry['flagImage'] || flagEntry['file'] || flagEntry['flag']) ? (flagEntry['flagImage'] || flagEntry['file'] || flagEntry['flag']) : null;
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
        await Promise.all(keys.map(cacheKey =>
        {
            if (cacheKey !== CACHE_NAME) return caches.delete(cacheKey);
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

function isTranslationRequest(request)
{
    return request.url.includes('/translations/');
}

// ---------------------------------------------------------------------------------------------------------------------

self.addEventListener("fetch", (event) =>
{
    const request = event.request;
    
    if (isTranslationRequest(request))
    {
        event.respondWith((async () =>
        {
            try
            {
                return await fetch(request);
            } catch (err)
            {
                return new Response(JSON.stringify({}), { status: 503, headers: { 'Content-Type': 'application/json' } });
            }
        })());
        return;
    }

    if (request.url.includes('/assets/flags/'))
    {
        event.respondWith((async () =>
        {
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(request);
            if (cached) return cached;
            try
            {
                const resp = await fetch(request);
                if (resp && resp.ok)
                {
                    try { await cache.put(request, resp.clone()); } catch (e) { }
                    return resp;
                }
            } catch (e) {
            }
            return caches.match('/offline.html');
        })());
        return;
    }

    if (request.url.includes('/api/'))
    {
        event.respondWith((async () =>
        {
            try
            {
                const networkResp = await fetch(request);
                if (request.method === 'GET')
                {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(request, networkResp.clone());
                }
                return networkResp;
            } catch (err)
            {
                const cached = await caches.match(request);
                return cached || new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
            }
        })());
        return;
    }

    if (isNavigationRequest(request))
    {
        event.respondWith((async () =>
        {
            try
            {
                const networkResp = await fetch(request);
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, networkResp.clone());
                return networkResp;
            } catch (err)
            {
                const cached = await caches.match(request);
                if (cached) return cached;
                const offline = await caches.match('/offline.html');
                return offline || new Response('<h1>Offline</h1><p>You are offline.</p>', { headers: { 'Content-Type': 'text/html' } });
            }
        })());
        return;
    }
    event.respondWith(caches.match(request).then(response => response || fetch(request).catch(() => caches.match('/offline.html'))));
});

// ---------------------------------------------------------------------------------------------------------------------

self.addEventListener('message', (event) =>
{
    if (!event || !event.data) return;
    
    const messageData = event.data;
    
    if (messageData && messageData.type === 'PING' && event.source && typeof event.source.postMessage === 'function')
    {
        try { 
            event.source.postMessage({ type: 'PONG', version: VERSION }); 
        } catch (e) { 
            console.warn('[service-worker] Failed to send PONG:', e);
        }
    }
}, false);
