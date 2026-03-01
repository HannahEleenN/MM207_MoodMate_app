/**
 * Singleton & State Management
 * This file acts as the single source of truth (Model) and
 * provides a unified fetch function for the entire app.
 */

// Helper to compute absolute URL for API calls when running in dev
function inferApiBase() {
    if (typeof window === 'undefined') return null;
    if (window.__API_BASE__) return window.__API_BASE__;

    const host = location.hostname;
    // If served from a local preview server (ports like 63342), helpfully point to :3000
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
        // Return the origin only (no '/api' suffix) so callers like 'api/...' become origin + '/api/...'
        return `${location.protocol}//${host}:3000`;
    }
    return null;
}

function withApiBase(path) {
    const base = inferApiBase();
    if (base) {
        if (/^https?:\/\//i.test(path)) return path;
        const p = path.replace(/^\//, '');
        return `${base}/${p}`;
    }
    return path;
}

export async function universalFetch(url, options = {})
{
    try {
        // Automatically set Content-Type for POST/PUT requests with a body
        if (options.body && !options.headers) {
            options.headers = { 'Content-Type': 'application/json' };
        }

        // If the request targets our API (starts with "api/") then prefix the API base
        const finalUrl = url.startsWith('api/') ? withApiBase(url) : url;

        const response = await fetch(finalUrl, options);

        // Parse body in all cases so we can include useful information on errors
        const isHtml = finalUrl.endsWith('.html');

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
    currentChild: null, // Holds the selected child profile for mood logging
    currentView: 'login', // Initial view for the router
    i18n: {} // Loaded translations (key -> Norwegian string)
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

// Simple i18n helpers: replace in-code Norwegian text with keys loaded from JSON
// NOTE: controllers should call loadI18n(lang) on startup and use t(key) to fetch strings.
state.loadI18n = async function(lang = 'no')
{
    try {
        const res = await universalFetch(`./locales/${lang}.json`);
        this.i18n = res || {};
        // Notify listeners that i18n loaded
        window.dispatchEvent(new CustomEvent('stateChanged', { detail: { property: 'i18n', value: this.i18n } }));
        return this.i18n;
    } catch (err) {
        console.error('Failed to load i18n:', err);
        return {};
    }
};

state.t = function(key)
{
    return this.i18n && this.i18n[key] ? this.i18n[key] : key;
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