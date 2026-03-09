/**
 * singleton.mjs — Single source of truth (Model + State Management)
 *
 * Exports:
 *   store          — Reactive Proxy over app state. Set properties to trigger listeners.
 *   universalFetch — Normalised fetch wrapper (handles API base URL, auth token, HTML vs JSON).
 *   onChange       — Subscribe to a specific state key: onChange('currentView', cb).
 */

// ---------------------------------------------------------------------------------------------------------------------
// API base-URL helpers
// ---------------------------------------------------------------------------------------------------------------------

function inferApiBase() {
    if (typeof window === 'undefined') return null;
    if (window.__API_BASE__) return window.__API_BASE__;

    const host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
        // Dev preview server → point API calls at :3000
        return `${location.protocol}//${host}:3000`;
    }
    return null;
}

function withApiBase(path) {
    const base = inferApiBase();
    if (!base) return path;
    if (/^https?:\/\//i.test(path)) return path; // already absolute
    return `${base}/${path.replace(/^\//, '')}`;
}

// ---------------------------------------------------------------------------------------------------------------------
// universalFetch
// Small wrapper that resolves api paths, attaches auth token if available, and parses JSON/html.
// Logs non-OK responses (status + body) to help debugging during development.
// ---------------------------------------------------------------------------------------------------------------------

export async function universalFetch(url, options = {}) {
    try {
        // Detect API style paths that start with 'api/' or '/api/'
        const isApiPath = typeof url === 'string' && /^(\/?api\/)\w*/.test(url);
        const pathOnly = typeof url === 'string' ? url.split('?')[0] : url;
        const isHtmlPath = typeof pathOnly === 'string' && /\.html$/i.test(pathOnly);

        const finalUrl = isApiPath ? withApiBase(url) : url;

        // Attach JSON Content-Type when a body is present and no header is set
        if (options.body && !options.headers?.['Content-Type']) {
            options.headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        }

        // Attach Bearer token from window.__STORE__ if available
        try {
            const token = (typeof window !== 'undefined' && window.__STORE__) ? window.__STORE__.token : null;
            if (token && !options.headers?.Authorization && !options.headers?.authorization) {
                options.headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
            }
        } catch (_) {
            // store not yet initialised — safe to ignore
        }

        const response = await fetch(finalUrl, { credentials: 'same-origin', ...options });

        if (!response.ok) {
            let body = null;
            try { body = isHtmlPath ? await response.text() : await response.json(); }
            catch (_) { try { body = await response.text(); } catch (__) { /* ignore */ } }

            // Debug: log non-OK responses with parsed body where possible
            try { console.error('[universalFetch] non-ok response', { url: finalUrl, status: response.status, body }); } catch (e) { /* ignore logging failure */ }

            const err = new Error(`Fetch error: ${response.status}`);
            err.status = response.status;
            err.body = body;
            return Promise.reject(err);
        }

        return isHtmlPath ? await response.text() : await response.json();

    } catch (err) {
        console.error('universalFetch error:', err);
        return Promise.reject(err);
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------------------------------------------------

const _state = {
    currentView: 'login',   // drives the SPA router
    currentUser: null,      // logged-in parent user object
    currentChild: null,     // selected child profile
    users: [],
    profiles: [],
    moods: [],
    token: null,            // JWT from server
    i18n: {}                // loaded translation strings
};

// ---------------------------------------------------------------------------------------------------------------------
// Listener registry  (key → Set of callbacks)
// ---------------------------------------------------------------------------------------------------------------------

const _listeners = {};

function _notify(property, value) {
    // Targeted listeners
    if (_listeners[property]) {
        for (const fn of _listeners[property]) {
            try { fn(value); } catch (e) { console.error('State listener error:', e); }
        }
    }
    // Wildcard listeners onChange('*', (key, val) => …)
    if (_listeners['*']) {
        for (const fn of _listeners['*']) {
            try { fn(property, value); } catch (e) { console.error('State listener error:', e); }
        }
    }

    // Also emit a DOM event so legacy controller code can listen via window
    if (typeof window !== 'undefined') {
        _emitStateChanged({ property, value });
    }
}

// Safe CustomEvent emitter with graceful fallback (avoids deprecated initCustomEvent)
function _emitStateChanged(detail) {
    if (typeof window === 'undefined') return;
    try {
        const ev = new CustomEvent('stateChanged', { detail });
        window.dispatchEvent(ev);
    } catch (e) {
        try {
            const ev = document.createEvent('Event');
            ev.initEvent('stateChanged', false, false);
            ev.detail = detail; // attach detail for consumers
            window.dispatchEvent(ev);
        } catch (err) {
            // As a last resort, call wildcard listeners directly
            if (_listeners['*']) {
                for (const fn of _listeners['*']) {
                    try { fn(detail.property, detail.value); } catch (_) {}
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// onChange — subscribe to state changes
// Usage:  const unsub = onChange('currentView', view => …); // unsub();
// ---------------------------------------------------------------------------------------------------------------------

export function onChange(key, fn) {
    if (typeof fn !== 'function') return () => {};
    if (!_listeners[key]) _listeners[key] = new Set();
    _listeners[key].add(fn);
    return () => _listeners[key]?.delete(fn);
}

// ---------------------------------------------------------------------------------------------------------------------
// i18n helpers attached to _state so store.loadI18n() / store.t() work
// ---------------------------------------------------------------------------------------------------------------------

_state.loadI18n = async function (lang = 'no') {
    try {
        let requested = lang;
        if (lang === 'auto') {
            if (typeof navigator !== 'undefined') {
                requested = (navigator.language || navigator.userLanguage || 'no').split('-')[0];
            } else {
                requested = 'no';
            }
        }

        // Map common variants to our available files
        const langMap = { nb: 'no', 'nb_NO': 'no' };
        if (langMap[requested]) requested = langMap[requested];

        // Fallback chain: requested → no → en
        const attempts = [...new Set([requested, 'no', 'en'])];
        console.log('[singleton.i18n] attempts:', attempts);

        for (const code of attempts) {
            try {
                const res = await universalFetch(`./translations/${code}.json`);
                if (res && Object.keys(res).length > 0) {
                    res._lang = code;
                    this.i18n = res;
                    _notify('i18n', res);
                    console.log('[singleton.i18n] loaded', code);
                    return res;
                }
            } catch (e) {
                console.debug('[singleton.i18n] failed to load', code, e && e.message ? e.message : e);
            }
        }

        // Nothing loaded — keep existing translations
        _notify('i18n', this.i18n);
        return this.i18n;
    } catch (err) {
        console.error('loadI18n error:', err);
        _notify('i18n', this.i18n);
        return this.i18n;
    }
};

_state.t = function (key) {
    return (this.i18n && this.i18n[key]) ? this.i18n[key] : key;
};

/**
 * Apply loaded translations to a Document or Element subtree.
 * @param {Document|Element} [root=document] - root to search for data-i18n attributes
 */
_state.applyTranslations = function (root = document) {
    try {
        const scope = (root && typeof root.querySelectorAll === 'function') ? root : document;

        scope.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t ? this.t(key) : key;
            const attr = el.getAttribute('data-i18n-attr');
            if (attr) {
                el.setAttribute(attr, text);
            } else {
                el.textContent = text;
            }
        });

        scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.setAttribute('placeholder', this.t(el.getAttribute('data-i18n-placeholder')));
        });
    } catch (e) {
        console.error('applyTranslations error:', e);
    }
};

_state.setLanguage = async function (lang) {
    await this.loadI18n(lang);
    const appRoot = document.getElementById('app-root');
    if (appRoot) this.applyTranslations(appRoot);
    this.applyTranslations(document);

    // Sync <html lang="…">
    const langMap = { nb: 'nb', no: 'nb', sv: 'sv', en: 'en', es: 'es', da: 'da' };
    if (typeof document !== 'undefined') {
        document.documentElement.lang = langMap[lang] ?? 'nb';
    }
};

// ---------------------------------------------------------------------------------------------------------------------
// store — the reactive Proxy exported to the rest of the app
// ---------------------------------------------------------------------------------------------------------------------

export const store = new Proxy(_state, {
    set(target, property, value) {
        target[property] = value;
        _notify(property, value);
        try { console.log('[singleton.store] set', property, value); } catch (e) { /* ignore */ }
        return true;
    }
});

// Allow store.onChange(key, cb) as a convenience alias
Object.defineProperty(store, 'onChange', { value: onChange, writable: false, configurable: false });

// Expose on window so universalFetch can grab the token before the first import cycle resolves
if (typeof window !== 'undefined') window.__STORE__ = store;

console.log('[singleton] module loaded, initial state:', { currentView: _state.currentView, token: !!_state.token, i18nLoaded: !!_state.i18n && Object.keys(_state.i18n).length>0 });

// ---------------------------------------------------------------------------------------------------------------------
// Session restore — rehydrate token + user from localStorage on page load
// ---------------------------------------------------------------------------------------------------------------------

if (typeof window !== 'undefined') {
    try {
        const saved = localStorage.getItem('moodmate_session');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.token) {
                store.token = parsed.token;
                store.currentUser = parsed.user ?? null;
                const profiles = parsed.user?.profiles ?? [];
                if (profiles.length > 0) store.currentChild = profiles[0];
                console.log('[singleton] restored session from localStorage, user:', parsed.user ? parsed.user.email || parsed.user.id : null);
            }
        }
    } catch (e) {
        console.warn('Failed to restore saved session:', e);
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// Global unhandled-rejection logger (log-only, does not change app behaviour)
// ---------------------------------------------------------------------------------------------------------------------

if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', event => {
        try {
            console.warn('Unhandled promise rejection:', event.reason);
            if (event.reason?.stack) console.warn(event.reason.stack);
        } catch (_) { /* never crash the handler */ }
    });
}