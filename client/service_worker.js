"use strict";

const VERSION = 'v1.1';
const CACHE_NAME = `mood-tracker-cache-${VERSION}`;
const URLS_TO_CACHE = [
    '/index.html',
    '/style.css',
    ];

self.addEventListener("install", (event) =>
{
    event.waitUntil((async () =>
    {
        const cache = await caches.open("cacheName_identifier");
        cache.addAll(URLS_TO_CACHE);
    })()
    );
});

self.addEventListener("fetch", (event) =>
{
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});