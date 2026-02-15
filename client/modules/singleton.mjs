/**
 * Singleton & State Management
 * This file acts as the single source of truth (Model) and
 * provides a unified fetch function for the entire app.
 */

export async function universalFetch(url, options = {})
{
    try {
        // Automatically set Content-Type for POST/PUT requests with a body
        if (options.body && !options.headers) {
            options.headers = { 'Content-Type': 'application/json' };
        }

        const response = await fetch(url, options);

        // Parse body in all cases so we can include useful information on errors
        const isHtml = url.endsWith('.html');

        if (!response.ok) {
            // Try to parse JSON body, otherwise read text, otherwise provide an empty message
            let errorBody = null;
            try {
                errorBody = isHtml ? await response.text() : await response.json();
            } catch (parseErr) {
                try { errorBody = await response.text(); } catch (_) { errorBody = null; }
            }

            const err = new Error(`Fetch error: ${response.status}`);
            err.status = response.status;
            err.body = errorBody;
            throw err;
        }

        // Decide whether to return plain text (HTML views) or parsed JSON (API data)
        return isHtml ? await response.text() : await response.json();

    } catch (err) {
        console.error("UniversalFetch error:", err);
        throw err;
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// State Management with Proxy (Observer Pattern)

const state = {
    users: [],
    moods: [],
    currentUser: null,
    currentView: 'login' // Initial view for the router
};

// Add a small helper to subscribe to state changes by property name.
// Returns an unsubscribe function when called.
state.onChange = function(property, callback)
{
    if (typeof callback !== 'function') return () => {};
    const listener = (e) => {
        if (e && e.detail && e.detail.property === property) {
            callback(e.detail.value);
        }
    };
    window.addEventListener('stateChanged', listener);
    return () => window.removeEventListener('stateChanged', listener);
};

// ---------------------------------------------------------------------------------------------------------------------
// Proxy Wrapper (Observer Pattern)

export const store = new Proxy(state,
{
    set(target, property, value)
    {
        target[property] = value;

        // Notify the application (e.g., the Router) that the state has changed
        window.dispatchEvent(new CustomEvent('stateChanged', {
            detail: { property, value }
        }));

        return true;
    }
});