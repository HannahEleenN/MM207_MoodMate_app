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

        // If an auth token exists in the global store, attach it as a Bearer token
        try {
            // Note: import cycle avoidance — `store` is defined later in this file.
            // Accessing via global/window allows universalFetch to be used before store initialisation
            const globalStore = (typeof window !== 'undefined' && window.__STORE__) ? window.__STORE__ : null;
            const token = globalStore ? globalStore.authToken : null;
            if (token) {
                options.headers = options.headers || {};
                if (!options.headers.Authorization && !options.headers.authorization) {
                    options.headers['Authorization'] = `Bearer ${token}`;
                }
            }
        } catch (e) {
            // If window isn't available or __STORE__ isn't set yet, ignore.
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
        // Allow automatic detection when lang === 'auto'
        let requested = lang;
        if (lang === 'auto') {
            // Basic browser language detection and primary subtag extraction
            if (typeof navigator !== 'undefined') {
                const nav = navigator.language || navigator.userLanguage || 'en';
                requested = (nav && nav.split('-')[0]) || 'en';
            } else {
                requested = 'en';
            }
        }

        // Try requested language, then fall back to Norwegian, then English
        const attempts = [requested];
        if (!attempts.includes('nb')) attempts.push('nb');
        if (!attempts.includes('no')) attempts.push('no');
        if (!attempts.includes('en')) attempts.push('en');

        let res = null;
        for (const a of attempts) {
            try {
                res = await universalFetch(`./locales/${a}.json`);
                if (res && Object.keys(res).length > 0) {
                    this.i18n = res;
                    break;
                }
            } catch (e) {
                // Try next fallback silently
                // console.debug('i18n load failed for', a, e);
            }
        }

        // If nothing loaded, keep existing i18n or empty object
        if (!res) this.i18n = this.i18n || {};

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

// Simple helper to apply translations to a root element. It looks for elements with
// data-i18n and replaces textContent. For inputs/textareas it also supports data-i18n-placeholder.
state.applyTranslations = function(root = document)
{
    try {
        const elements = root.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t ? this.t(key) : key;
            // If element has a data-i18n-attr attribute, set that attribute (e.g., placeholder)
            const attr = el.getAttribute('data-i18n-attr');
            if (attr && (attr === 'placeholder' || attr === 'title' || attr === 'aria-label')) {
                el.setAttribute(attr, text);
            } else {
                el.textContent = text;
            }
        });

        // Also handle placeholders using data-i18n-placeholder for convenience
        const inputs = root.querySelectorAll('[data-i18n-placeholder]');
        inputs.forEach(inp => {
            const key = inp.getAttribute('data-i18n-placeholder');
            const text = this.t ? this.t(key) : key;
            inp.setAttribute('placeholder', text);
        });

    } catch (e) {
        console.error('applyTranslations error:', e);
    }
};

// Helper to change language programmatically and re-apply translations across the app
state.setLanguage = async function(lang)
{
    await this.loadI18n(lang);
    // Re-apply translations for the current view root
    const root = document.getElementById('app-root');
    if (root) this.applyTranslations(root);

    // Also translate static parts in index.html (modal title, skip link, etc.)
    this.applyTranslations(document);

    // Optionally update document language attribute
    try {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = (lang === 'nb' || lang === 'no') ? 'nb' : (lang === 'sv' ? 'sv' : 'en');
        }
    } catch (e) {}

    // Notify listeners of language change
    window.dispatchEvent(new CustomEvent('stateChanged', { detail: { property: 'i18n', value: this.i18n } }));
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

// Expose the store on window so universalFetch can access the token early (non-invasive)
if (typeof window !== 'undefined') window.__STORE__ = store;

// Global handler to catch unhandled promise rejections and provide clearer logging.
// This is a log-only handler: it does not suppress or change app behavior — it only
// prints the rejection reason and stack to help debugging.
if (typeof window !== 'undefined')
{
    window.addEventListener('unhandledrejection', (event) =>
    {
        try {
            const reason = event.reason;
            // Log a readable representation of the rejection
            console.warn('Unhandled promise rejection:', reason);
            if (reason && reason.stack) console.warn(reason.stack);
            // Do not call event.preventDefault() — keep browser behavior unchanged.
        } catch (e) {
            // Never crash due to logging
            console.error('Error while handling unhandledrejection:', e);
        }
    });
}
