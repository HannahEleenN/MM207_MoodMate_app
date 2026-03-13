if (typeof window !== 'undefined')
{
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        window.__API_BASE__ = `${location.protocol}//${location.hostname}:3000`;
    }

    try
    {
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink && window.__API_BASE__)
        {
            const hrefAttr = manifestLink.getAttribute('href') || '';
            if (!/^(https?:)?\/\//.test(hrefAttr))
            {
                const base = String(window.__API_BASE__).replace(/\/$/, '');
                manifestLink.href = `${base}/${hrefAttr.replace(/^(?:\.\/|\/) /, '')}`;
                manifestLink.setAttribute('href', manifestLink.href);
                console.debug('Manifest href adjusted to', manifestLink.href);
            } else {
                console.debug('Manifest href is absolute, skipping adjustment:', hrefAttr);
            }
        }
    } catch (e) {
        console.warn('Could not adjust manifest href:', e);
    }

    window.addEventListener('unhandledrejection', (event) =>
    {
        try
        {
            const reason = event.reason;
            const msg = reason && reason.message ? String(reason.message) : String(reason);
            if (typeof msg === 'string' && msg.includes('A listener indicated an asynchronous response'))
            {
                event.preventDefault();
                console.debug('Suppressed noisy extension/unhandledrejection:', msg);
            }
        } catch (e) {
            console.error('Error in unhandledrejection suppression handler', e);
        }
    });

    window.addEventListener('error', (event) =>
    {
        try
        {
            const msg = event && event.message ? String(event.message) : '';
            if (typeof msg === 'string' && msg.includes('A listener indicated an asynchronous response'))
            {
                try { event.preventDefault(); } catch (_) {}
                try { event.stopImmediatePropagation(); } catch (_) {}
                console.debug('Suppressed noisy extension/error event:', msg);
            }
        } catch (e) {
            console.error('Error in error-event suppression handler', e);
        }
    });
}