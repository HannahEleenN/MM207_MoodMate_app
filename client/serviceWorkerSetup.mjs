// During development we prefer to avoid any registered Service Worker interfering with fresh builds.
// This file will aggressively unregister any existing service workers to ensure the browser fetches
// the latest files from the network while you're developing.

if ('serviceWorker' in navigator)
{
    // Always attempt to unregister any previously installed service workers (development-friendly)
    navigator.serviceWorker.getRegistrations?.().then(regs => {
        regs.forEach(r => {
            console.info('Unregistering service worker (dev):', r.scope);
            r.unregister();
        });
    }).catch(err => console.warn('Could not enumerate/unregister service workers:', err));

    // Skip registering a new service worker in development by default. If you want to enable a SW for
    // production/testing, change this logic to only register when a flag is present.
}