/**
 * singleton.mjs — Single source of truth (Model + State Management)
 *
 * Exports:
 *   store          — Reactive Proxy over app state. Set properties to trigger listeners.
 *   universalFetch — Normalised fetch wrapper (handles API base URL, auth token, HTML vs JSON).
 *   onChange       — Subscribe to a specific state key: onChange('currentView', cb).
 */

// ─────────────────────────────────────────────────────────────────────────────
// API base-URL helpers
// ─────────────────────────────────────────────────────────────────────────────

function inferApiBase()
{
    if (typeof window === 'undefined') return null;
    if (window.__API_BASE__) return window.__API_BASE__;

    const host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
        // Dev preview server → point API calls at :3000
        return `${location.protocol}//${host}:3000`;
    }
    return null;
}

function withApiBase(path)
{
    const base = inferApiBase();
    if (!base) return path;
    if (/^https?:\/\//i.test(path)) return path;          // already absolute
    return `${base}/${path.replace(/^\//, '')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// universalFetch
// ─────────────────────────────────────────────────────────────────────────────

export async function universalFetch(url, options = {}) {
    try {
        // Resolve API-relative paths (e.g. "api/users") to absolute URL
        const isApiPath  = typeof url === 'string' && /^(\/)?api\//.test(url);
        const isHtmlPath = typeof url === 'string' && /\.html$/i.test(url.split('?')[0]);

        const finalUrl = isApiPath ? withApiBase(url) : url;

        // Attach JSON Content-Type when a body is present and no header is set
        if (options.body && !options.headers?.['Content-Type']) {
            options.headers = { 'Content-Type': 'application/json', ...options.headers };
        }

        // Attach Bearer token from store if available
        try {
            const token = (typeof window !== 'undefined' && window.__STORE__)
                ? window.__STORE__.token
                : null;
            if (token && !options.headers?.Authorization) {
                options.headers = { Authorization: `Bearer ${token}`, ...options.headers };
            }
        } catch (_) { /* store not yet initialised — safe to ignore */ }

        const response = await fetch(finalUrl, { credentials: 'same-origin', ...options });

        if (!response.ok) {
            let body = null;
            try { body = isHtmlPath ? await response.text() : await response.json(); }
            catch (_) { try { body = await response.text(); } catch (__) { /* ignore */ } }

            const err   = new Error(`Fetch error: ${response.status}`);
            err.status  = response.status;
            err.body    = body;
            throw err;
        }

        return isHtmlPath ? await response.text() : await response.json();

    } catch (err) {
        console.error('universalFetch error:', err);
        throw err;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

const _state =
{
    currentView:  'login',   // drives the SPA router
    currentUser:  null,      // logged-in parent user object
    currentChild: null,      // selected child profile
    users:        [],
    profiles:     [],
    moods:        [],
    token:        null,      // JWT from server
    i18n:         {}         // loaded translation strings
};

// ─────────────────────────────────────────────────────────────────────────────
// Listener registry  (key → Set of callbacks)
// ─────────────────────────────────────────────────────────────────────────────

const _listeners = {};

function _notify(property, value) {
    // Targeted listeners
    if (_listeners[property]) {
        for (const fn of _listeners[property]) {
            try { fn(value); } catch (e) { console.error('State listener error:', e); }
        }
    }
    // Wildcard listeners  onChange('*', (key, val) => …)
    if (_listeners['*']) {
        for (const fn of _listeners['*']) {
            try { fn(property, value); } catch (e) { console.error('State listener error:', e); }
        }
    }

    // Also emit a DOM CustomEvent so legacy controller code can listen via window
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('stateChanged', { detail: { property, value } }));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// onChange — subscribe to state changes
// Usage:  const unsub = onChange('currentView', view => …);
//         unsub();   // unsubscribe
// ─────────────────────────────────────────────────────────────────────────────

export function onChange(key, fn) {
    if (typeof fn !== 'function') return () => {};
    if (!_listeners[key]) _listeners[key] = new Set();
    _listeners[key].add(fn);
    return () => _listeners[key]?.delete(fn);
}

// ─────────────────────────────────────────────────────────────────────────────
// i18n helpers attached to _state so store.loadI18n() / store.t() work
// ─────────────────────────────────────────────────────────────────────────────

_state.loadI18n = async function (lang = 'no') {
    let requested = lang;
    if (lang === 'auto' && typeof navigator !== 'undefined') {
        requested = (navigator.language || 'no').split('-')[0];
    }

    // Fallback chain: requested → nb → no → en
    const attempts = [...new Set([requested, 'nb', 'no', 'en'])];

    for (const code of attempts) {
        try {
            const res = await universalFetch(`./translations/${code}.json`);
            if (res && Object.keys(res).length > 0) {
                res._lang = code;
                this.i18n  = res;
                _notify('i18n', res);
                return res;
            }
        } catch (_) { /* try next */ }
    }

    // Nothing loaded — keep existing translations
    _notify('i18n', this.i18n);
    return this.i18n;
};

_state.t = function (key) {
    return (this.i18n && this.i18n[key]) ? this.i18n[key] : key;
};

/**
 * Apply loaded translations to a DOM subtree.
 * Elements with data-i18n get their textContent replaced.
 * Elements with data-i18n-placeholder get their placeholder attribute set.
 * Elements with data-i18n-attr="aria-label" (etc.) get that attribute set.
 */
_state.applyTranslations = function (root = document) {
    try {
        root.querySelectorAll('[data-i18n]').forEach(el => {
            const key  = el.getAttribute('data-i18n');
            const text = this.t(key);
            const attr = el.getAttribute('data-i18n-attr');
            if (attr) {
                el.setAttribute(attr, text);
            } else {
                el.textContent = text;
            }
        });

        root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
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

// ─────────────────────────────────────────────────────────────────────────────
// store — the reactive Proxy exported to the rest of the app
// ─────────────────────────────────────────────────────────────────────────────

export const store = new Proxy(_state, {
    set(target, property, value) {
        target[property] = value;
        _notify(property, value);
        return true;
    }
});

// Allow store.onChange(key, cb) as a convenience alias
Object.defineProperty(store, 'onChange', { value: onChange, writable: false, configurable: false });

// Expose on window so universalFetch can grab the token before the first import cycle resolves
if (typeof window !== 'undefined') window.__STORE__ = store;

// ─────────────────────────────────────────────────────────────────────────────
// Session restore — rehydrate token + user from localStorage on page load
// ─────────────────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
    try {
        const saved = localStorage.getItem('moodmate_session');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.token) {
                store.token       = parsed.token;
                store.currentUser = parsed.user ?? null;
                const profiles    = parsed.user?.profiles ?? [];
                if (profiles.length > 0) store.currentChild = profiles[0];
            }
        }
    } catch (e) {
        console.warn('Failed to restore saved session:', e);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Global unhandled-rejection logger (log-only, does not change app behaviour)
// ─────────────────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', event => {
        try {
            console.warn('Unhandled promise rejection:', event.reason);
            if (event.reason?.stack) console.warn(event.reason.stack);
        } catch (_) { /* never crash the handler */ }
    });
}