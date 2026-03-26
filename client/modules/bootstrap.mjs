if (typeof window !== 'undefined')
{
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

    const noisyErrorPattern = /A listener indicated an asynchronous response/i;
    
    window.addEventListener('unhandledrejection', (event) =>
    {
        try
        {
            const reason = event.reason;
            const msg = reason && reason.message ? String(reason.message) : String(reason);
            if (typeof msg === 'string' && noisyErrorPattern.test(msg))
            {
                event.preventDefault();
                console.debug('Suppressed service worker message error (extension):', msg);
            }
        } catch (e) {
            console.error('Error in unhandledrejection suppression handler', e);
        }
    }, true);

    window.addEventListener('error', (event) =>
    {
        try
        {
            const msg = event && event.message ? String(event.message) : '';
            if (typeof msg === 'string' && noisyErrorPattern.test(msg))
            {
                try { event.preventDefault(); } catch (_) {}
                try { event.stopImmediatePropagation(); } catch (_) {}
                console.debug('Suppressed service worker message error (error event):', msg);
            }
        } catch (e) {
            console.error('Error in error-event suppression handler', e);
        }
    }, true);
}
