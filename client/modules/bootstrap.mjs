if (typeof window !== 'undefined')
{
    try
    {
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink)
        {
            console.debug('Manifest href preserved as relative:', manifestLink.href);
        }
    } catch (e) {
        console.warn('Could not verify manifest href:', e);
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
