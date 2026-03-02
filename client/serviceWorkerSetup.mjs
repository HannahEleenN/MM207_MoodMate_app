if ('serviceWorker' in navigator)
{
    const isLocal = /localhost|127\.0\.0\.1/.test(location.hostname);
    if (!isLocal) {
        window.addEventlistener('load', () =>
        {
            navigator.serviceWorker.register('service-worker.js')
            .then(r => console.log('SW:', r.scope))
            .catch(err => console.log('SW registration failed:', err));
        });
    } else {
        navigator.serviceWorker.getRegistrations?.().then(rs => rs.forEach(r => r.unregister()));
    }
}