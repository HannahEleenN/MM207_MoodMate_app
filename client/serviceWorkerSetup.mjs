// During development we prefer to avoid any registered Service Worker interfering with fresh builds.
// This file will aggressively unregister any existing service workers to ensure the browser fetches
// the latest files from the network while you're developing.

if ('serviceWorker' in navigator)
{
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.endsWith('.local');
    const enableSW = window.__ENABLE_SW__ === true;

    // If explicitly disabled, unregister and exit
    if (window.__DISABLE_SW__ === true) {
        navigator.serviceWorker.getRegistrations?.().then(regs => regs.forEach(r => r.unregister()));
    }

    // In development, we prefer no SW unless explicitly enabled. In production (not localhost) we register.
    if (!isLocalhost || enableSW) {
        navigator.serviceWorker.register('/service_worker.js')
            .then(reg => console.info('Service worker registered:', reg.scope))
            .catch(err => console.warn('Service worker registration failed:', err));
    } else {
        // Still attempt to unregister old SWs to avoid stale caches during dev
        navigator.serviceWorker.getRegistrations?.().then(regs => {
            regs.forEach(r => {
                console.info('Unregistering service worker (dev):', r.scope);
                r.unregister();
            });
        }).catch(err => console.warn('Could not enumerate/unregister service workers:', err));
    }
}