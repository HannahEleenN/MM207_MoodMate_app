if ('serviceWorker' in navigator)
{
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.endsWith('.local');
    const enableSW = window.__ENABLE_SW__ === true;

    if (window.__DISABLE_SW__ === true) {
        navigator.serviceWorker.getRegistrations?.().then(regs => regs.forEach(r => r.unregister()));
    }

    if (!isLocalhost || enableSW) {
        navigator.serviceWorker.register('/service_worker.js')
            .then(reg => console.info('Service worker registered:', reg.scope))
            .catch(err => console.warn('Service worker registration failed:', err));
    } else {
        navigator.serviceWorker.getRegistrations?.().then(regs => {
            regs.forEach(r => {
                console.info('Unregistering service worker (dev):', r.scope);
                r.unregister();
            });
        }).catch(err => console.warn('Could not enumerate/unregister service workers:', err));
    }
}