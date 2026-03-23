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
        const swUrl = '/service_worker.mjs?v=' + Date.now();
        (async () =>
        {
            try {
                const reg = await navigator.serviceWorker.register(swUrl, { type: 'module' });
                console.info('Service worker registered (module):', reg.scope);
            } catch (err)
            {
                try {
                    const reg2 = await navigator.serviceWorker.register(swUrl);
                    console.info('Service worker registered (classic fallback):', reg2.scope);
                } catch (err2) {
                    console.warn('Service worker registration failed (module and classic):', err2);
                }
            }
        })();
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