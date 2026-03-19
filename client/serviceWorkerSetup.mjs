if ('serviceWorker' in navigator)
{
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.endsWith('.local');
    const enableSW = typeof globalThis['__ENABLE_SW__'] !== 'undefined' ? globalThis['__ENABLE_SW__'] === true : false;

    if (typeof globalThis['__DISABLE_SW__'] !== 'undefined' && globalThis['__DISABLE_SW__'] === true)
    {
        navigator.serviceWorker.getRegistrations?.().then(regs =>
        {
            return Promise.all(regs.map(r => r.unregister()));
        }).then(() => {
            console.info('Service workers unregistered via __DISABLE_SW__ flag');
        }).catch(err => console.warn('Failed to unregister service workers:', err));
    }

    if (!isLocalhost || enableSW)
    {
        navigator.serviceWorker.register('/service_worker.mjs')
            .then(reg => console.info('Service worker registered:', reg.scope))
            .catch(err => console.warn('Service worker registration failed:', err));
    } else {
        navigator.serviceWorker.getRegistrations?.().then(regs =>
        {
            return Promise.all(regs.map(r =>
            {
                console.info('Unregistering service worker (dev):', r.scope);
                return r.unregister();
            }));
        }).catch(err => console.warn('Could not enumerate/unregister service workers:', err));
    }
}