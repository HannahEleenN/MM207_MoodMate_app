/**
 * API Service
 * Acts as a bridge between the controllers and the universalFetch in the singleton.
 * It abstracts the URLs and methods so controllers don't need to know the endpoints.
 */

import { universalFetch } from './singleton.mjs';
import { store } from './singleton.mjs';

// --- CONFIGURATION & ENVIRONMENT DETECTION ---

// Determine a sensible API base automatically for development vs production:
// - If running on localhost, point to the backend at :3000 by default (express dev server)
// - Otherwise use a relative '/api' path for same-origin hosting (production)

const DEFAULT_BASE = (typeof window !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
    ? `${location.protocol}//${location.hostname}:3000/api`
    : '/api';

// Normalize configured base so callers can always append endpoints like '/users'.
function resolveApiBase()
{
    let base = (typeof window !== 'undefined' && window.__API_BASE__) ? window.__API_BASE__ : DEFAULT_BASE;
    try {
        // Ensure no trailing slash and append '/api' if missing
        base = String(base).replace(/\/+$|\/$/, '');
        if (!base.endsWith('/api')) base = base.replace(/\/+$/, '') + '/api';
    } catch (e) {
        if (!String(base).endsWith('/api')) base = String(base).replace(/\/+$/, '') + '/api';
    }
    return base;
}

const BASE = resolveApiBase();

// --- API SERVICE OBJECT ---

export const ApiService =
    {
        // VIEW / HTML LOADING

        /**
         * Fetches an HTML template from the "views" folder.
         * @param {string} viewName - The name of the file (without extension).
         */
        loadView: async (viewName) =>
        {
            console.log('[ApiService] loadView', viewName);
            let url = `./modules/views/${viewName}.html`;

            // In development, append a cache-busting query so local service workers / caches don't return stale HTML
            try {
                if (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
                    url += `?cb=${Date.now()}`;
                }
            } catch (e) {
                // Ignore if location isn't available
            }
            return await universalFetch(url);
        },

        // TRANSLATIONS / I18N LOADER

        /**
         * Loads UI strings for the specified language.
         * @param {string} lang - Language code (default 'no').
         */
        loadTranslations: async (lang = 'no') => {
            return await universalFetch(`./translations/${lang}.json`);
        },

        // USER MANAGEMENT (CRUD)
        // Registers a new parent user account.

        register: async (userData) => {
            return await universalFetch(`${BASE}/users`, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        // Authenticates a user.

        login: async (credentials) =>
        {
            console.log('[ApiService] login attempt for', credentials.email);
            return await universalFetch(`${BASE}/users/login`, {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
        },

        // Fetches a list of all users (admin/manager view).

        listUsers: async () => {
            console.log('[ApiService] listUsers called');
            return await universalFetch(`${BASE}/users`, {
                method: 'GET'
            });
        },

        // Updates an existing user's information.

        updateUser: async (id, userData) =>
        {
            return await universalFetch(`${BASE}/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        },

        // Deletes a user account and all associated data (GDPR compliance).

        deleteUser: async (id) => {
            return await universalFetch(`${BASE}/users/${id}`, {
                method: 'DELETE'
            });
        },

        // CHILD PROFILE MANAGEMENT
        // Fetches children profiles associated with the logged-in user.

        getChildren: async () =>
        {
            console.log('[ApiService] getChildren called');
            return await universalFetch(`${BASE}/children`, {
                method: 'GET'
            });
        },

        // Creates a new child profile.

        createChild: async (payload) =>
        {
            console.log('[ApiService] createChild', payload);
            return await universalFetch(`${BASE}/children`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        },

        // MOOD LOGGING & INSIGHTS
        // Saves a new mood entry from a child or parent.

        saveMood: async (moodData) =>
        {
            return await universalFetch(`${BASE}/moods`, {
                method: 'POST',
                body: JSON.stringify(moodData)
            });
        },

        // Fetches all mood logs for the currently authenticated user.

        getAllMoods: async () =>
        {
            return await universalFetch(`${BASE}/moods`, {
                method: 'GET'
            });
        },

        // SESSION ACTIONS
        // Clears local session data.

        logout: async () => {
            console.log('[ApiService] logout');
            try {
                await universalFetch(`${BASE}/users/logout`, { method: 'POST' });
            } catch (e) { console.debug('logout request failed', e); }
            // Clear persisted session
            try { window.localStorage.removeItem('moodmate_session'); } catch (_) {}
            store.token = null;
            store.currentUser = null;
            store.currentChild = null;
        }

    }; // End of ApiService

import { apiPath, universalFetch } from '../utils/api';

export default
{
    async login(credentials)
    {
        console.log('[ApiService] login attempt for', credentials && credentials.email ? credentials.email : credentials);
        try {
            return await universalFetch(apiPath('api/users/login'), { method: 'POST', body: JSON.stringify(credentials) });
        } catch (err) {
            // Provide richer debug info for failed auth calls
            try {
                console.error('[ApiService] login failed:', err.status, err.body || err.message || err);
            } catch (e) { console.error('[ApiService] login failed (no body)', err); }
            throw err;
        }
    },

    async updateUser(id, data)
    {
        try {
            return await universalFetch(apiPath(`api/users/${id}`), { method: 'PUT', body: JSON.stringify(data) });
        } catch (err) {
            console.error('[ApiService] updateUser failed', err.status, err.body || err.message || err);
            throw err;
        }
    },

    async deleteUser(id)
    {
        try {
            return await universalFetch(apiPath(`api/users/${id}`), { method: 'DELETE' });
        } catch (err) {
            console.error('[ApiService] deleteUser failed', err.status, err.body || err.message || err);
            throw err;
        }
    },

    async getChildren()
    {
        console.log('[ApiService] getChildren');
        try {
            return await universalFetch(apiPath('api/children'));
        } catch (err) {
            console.error('[ApiService] getChildren failed', err.status, err.body || err.message || err);
            throw err;
        }
    },

    async createChild(payload)
    {
        console.log('[ApiService] createChild', payload);
        try {
            return await universalFetch(apiPath('api/children'), { method: 'POST', body: JSON.stringify(payload) });
        } catch (err) {
            console.error('[ApiService] createChild failed', err.status, err.body || err.message || err);
            throw err;
        }
    },
};

import { universalFetch } from './singleton.mjs';

function resolveApiBase() {
    try {
        const configured = (typeof window !== 'undefined' && window.__API_BASE__) ? window.__API_BASE__ : null;
        if (configured) return String(configured).replace(/\/+$/,'');
        if (typeof location !== 'undefined') {
            const host = location.hostname;
            if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
                return `${location.protocol}//${host}:3000`;
            }
        }
    } catch (e) {}
    return '';
}
const API_BASE = resolveApiBase();
function apiPath(p) {
    if (!p) return p;
    if (/^https?:\/\//i.test(p)) return p;
    if (/^\/?api\//.test(p)) return API_BASE ? `${API_BASE}/${String(p).replace(/^\/?/,'')}` : `/${String(p).replace(/^\/?/,'')}`;
    return p;
}

function withAuthHeaders(options = {}) {
    const headers = Object.assign({}, options.headers || {});
    try {
        const token = (typeof window !== 'undefined' && window.__STORE__) ? window.__STORE__.token : null;
        if (token) {
            headers['Authorization'] = headers['Authorization'] || `Bearer ${token}`;
        }
    } catch (e) {
        // ignore
    }
    return Object.assign({}, options, { headers, credentials: 'same-origin' });
}

export const ApiService = {
    async loadView(name) {
        console.log('[ApiService] loadView', name);
        const url = `./modules/views/${name}.html`;
        return await universalFetch(url);
    },

    async loadTranslations(lang = 'no') {
        console.log('[ApiService] loadTranslations', lang);
        return await universalFetch(`./translations/${lang}.json`);
    },

    // Auth
    async register(userData) {
        return await universalFetch(apiPath('api/users'), withAuthHeaders({ method: 'POST', body: JSON.stringify(userData) }));
    },

    async login(credentials) {
        console.log('[ApiService] login attempt for', credentials && credentials.email);
        return await universalFetch(apiPath('api/users/login'), { method: 'POST', body: JSON.stringify(credentials), credentials: 'same-origin' });
    },

    async logout() {
        return await universalFetch(apiPath('api/users/logout'), withAuthHeaders({ method: 'POST' }));
    },

    async listUsers() {
        return await universalFetch(apiPath('api/users'), withAuthHeaders({ method: 'GET' }));
    },

    async updateUser(id, data) {
        return await universalFetch(apiPath(`api/users/${id}`), withAuthHeaders({ method: 'PUT', body: JSON.stringify(data) }));
    },

    async deleteUser(id) {
        return await universalFetch(apiPath(`api/users/${id}`), withAuthHeaders({ method: 'DELETE' }));
    },

    // Children
    async getChildren() {
        return await universalFetch(apiPath('api/children'), withAuthHeaders({ method: 'GET' }));
    },

    async createChild(payload) {
        return await universalFetch(apiPath('api/children'), withAuthHeaders({ method: 'POST', body: JSON.stringify(payload) }));
    },

    // Moods
    async saveMood(data) {
        return await universalFetch(apiPath('api/moods'), withAuthHeaders({ method: 'POST', body: JSON.stringify(data) }));
    },

    async getAllMoods() {
        return await universalFetch(apiPath('api/moods'), withAuthHeaders({ method: 'GET' }));
    },

    async exportData(format = 'csv') {
        return await universalFetch(apiPath(`api/export?format=${encodeURIComponent(format)}`), withAuthHeaders({ method: 'GET' }));
    }
};