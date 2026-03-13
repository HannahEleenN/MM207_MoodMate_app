function inferApiBase()
{
    if (typeof window === 'undefined') return null;
    if (window.__API_BASE__) return window.__API_BASE__;

    const host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
        return `${location.protocol}//${host}:3000`;
    }
    return null;
}

// ---------------------------------------------------------------------------------------------------------------------

function withApiBase(path)
{
    const base = inferApiBase();
    if (!base) return path;
    if (/^https?:\/\//i.test(path)) return path;
    return `${base}/${path.replace(/^\//, '')}`;
}

// ---------------------------------------------------------------------------------------------------------------------

async function _universalFetchImpl(url, options = {})
{
    try
    {
        const isApiPath = typeof url === 'string' && /^(\/?api\/)/.test(url);
        const pathOnly = typeof url === 'string' ? url.split('?')[0] : url;
        const isHtmlPath = typeof pathOnly === 'string' && /\.html$/i.test(pathOnly);

        const finalUrl = isApiPath ? withApiBase(url) : url;

        if (options.body && !options.headers?.['Content-Type']) {
            options.headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        }

        try
        {
            const token = (typeof window !== 'undefined' && window.__STORE__) ? window.__STORE__.token : null;
            if (token && !options.headers?.Authorization && !options.headers?.authorization) {
                options.headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
            }
        } catch (_) {}

        const response = await fetch(finalUrl, { credentials: 'same-origin', ...options });

        if (!response.ok)
        {
            let body = null;
            try { body = isHtmlPath ? await response.text() : await response.json(); }
            catch (_) { try { body = await response.text(); } catch (__) { } }

            try { console.error('[universalFetch] non-ok response', { url: finalUrl, status: response.status, body }); } catch (e) { }

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

let universalFetchImpl = (typeof window !== 'undefined' && window.__UNIVERSAL_FETCH__) ? window.__UNIVERSAL_FETCH__ : _universalFetchImpl;

export const universalFetch = universalFetchImpl;

if (typeof window !== 'undefined')
{
    try {
        if (!window.__UNIVERSAL_FETCH__) window.__UNIVERSAL_FETCH__ = universalFetchImpl;
    } catch (e) {
    }
}

// ---------------------------------------------------------------------------------------------------------------------

const _state =
{
    currentView: 'login',
    currentUser: null,
    currentChild: null,
    users: [],
    profiles: [],
    moods: [],
    token: null,
    i18n: {}
};

// ---------------------------------------------------------------------------------------------------------------------

const _listeners = {};

function _notify(property, value)
{
    if (_listeners[property])
    {
        for (const fn of _listeners[property]) {
            try { fn(value); } catch (e) { console.error('State listener error:', e); }
        }
    }
    if (_listeners['*'])
    {
        for (const fn of _listeners['*']) {
            try { fn(property, value); } catch (e) { console.error('State listener error:', e); }
        }
    }

    if (typeof window !== 'undefined') {
        _emitStateChanged({ property, value });
    }
}

// ---------------------------------------------------------------------------------------------------------------------

function _emitStateChanged(detail)
{
    if (typeof window === 'undefined') return;
    try
    {
        const ev = new CustomEvent('stateChanged', { detail });
        window.dispatchEvent(ev);
    } catch (e)
    {
        if (_listeners['*'])
        {
            for (const fn of _listeners['*']) {
                try { fn(detail.property, detail.value); } catch (_) {}
            }
        }
    }
}

// ---------------------------------------------------------------------------------------------------------------------

export function onChange(key, fn)
{
    if (typeof fn !== 'function') return () => {};
    if (!_listeners[key]) _listeners[key] = new Set();
    _listeners[key].add(fn);
    return () => _listeners[key]?.delete(fn);
}

// ---------------------------------------------------------------------------------------------------------------------

_state.loadI18n = async function (lang = 'no')
{
    try
    {
        let requested = lang;
        if (lang === 'auto')
        {
            if (typeof navigator !== 'undefined')
            {
                requested = (navigator.language || (navigator.languages && navigator.languages[0]) || 'no').split('-')[0];
            } else {
                requested = 'no';
            }
        }

        const langMap = { nb: 'no', 'nb_NO': 'no' };
        if (langMap[requested]) requested = langMap[requested];

        const attempts = [...new Set([requested, 'no', 'en'])];
        console.log('[singleton.i18n] attempts:', attempts);

        for (const code of attempts)
        {
            try
            {
                const res = await universalFetch(`./translations/${code}.json`);
                if (res && Object.keys(res).length > 0)
                {
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

        _notify('i18n', this.i18n);
        return this.i18n;
    } catch (err)
    {
        console.error('loadI18n error:', err);
        _notify('i18n', this.i18n);
        return this.i18n;
    }
};

// ---------------------------------------------------------------------------------------------------------------------

_state.t = function (key) {
    return (this.i18n && this.i18n[key]) ? this.i18n[key] : key;
};

// ---------------------------------------------------------------------------------------------------------------------

_state.applyTranslations = function (root = null)
{
    try
    {
        const scope = (root && typeof root.querySelectorAll === 'function') ? root : document;

        scope.querySelectorAll('[data-i18n]').forEach(el =>
        {
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

// ---------------------------------------------------------------------------------------------------------------------

_state.setLanguage = async function (lang)
{
    await this.loadI18n(lang);
    const appRoot = document.getElementById('app-root');
    if (appRoot) this.applyTranslations(appRoot);
    this.applyTranslations(document);

    const langMap = { nb: 'nb', no: 'nb', sv: 'sv', en: 'en', es: 'es', da: 'da' };
    if (typeof document !== 'undefined') {
        document.documentElement.lang = langMap[lang] ?? 'nb';
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export const store = new Proxy(_state,
{
    set(target, property, value)
    {
        target[property] = value;
        _notify(property, value);
        try { console.log('[singleton.store] set', property, value); } catch (e) { }
        return true;
    }
});

// ---------------------------------------------------------------------------------------------------------------------

Object.defineProperty(store, 'onChange', { value: onChange, writable: false, configurable: false });

if (typeof window !== 'undefined') window.__STORE__ = store;

console.log('[singleton] module loaded, initial state:', { currentView: _state.currentView, token: !!_state.token, i18nLoaded: !!_state.i18n && Object.keys(_state.i18n).length>0 });

// ---------------------------------------------------------------------------------------------------------------------

if (typeof window !== 'undefined')
{
    try
    {
        const saved = localStorage.getItem('moodmate_session');
        if (saved)
        {
            const parsed = JSON.parse(saved);
            if (parsed?.token)
            {
                store.token = parsed.token;
                store.currentUser = parsed.user ?? null;
                const profiles = parsed.user?.profiles ?? [];
                if (profiles.length > 0) {
                    store.profiles = profiles;
                    store.currentChild = profiles[0];
                }
                console.log('[singleton] loaded session from localStorage for user', parsed.user?.email ?? 'unknown');
            }
        }
    } catch (e) {
        console.warn('Failed to load session from localStorage:', e);
    }
}