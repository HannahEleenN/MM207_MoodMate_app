import { universalFetch, store } from './singleton.mjs';

// ---------------------------------------------------------------------------------------------------------------------

const DEFAULT_BASE = '/api';

// ---------------------------------------------------------------------------------------------------------------------

function resolveApiBase()
{
    let base = (typeof window !== 'undefined' && window.__API_BASE__) ? window.__API_BASE__ : DEFAULT_BASE;
    try {
        base = String(base).replace(/\/+$|\/$/, '');
        if (!base.endsWith('/api')) base = base.replace(/\/+$/, '') + '/api';
    } catch (e) {
        if (!String(base).endsWith('/api')) base = String(base).replace(/\/+$/, '') + '/api';
    }
    return base;
}

const BASE = resolveApiBase();

// ---------------------------------------------------------------------------------------------------------------------
function withAuthHeaders(options = {})
{
    const headers = Object.assign({}, options.headers || {});
    try {
        const token = (typeof window !== 'undefined' && window.__STORE__) ? window.__STORE__.token : (store ? store.token : null);
        if (token) headers['Authorization'] = headers['Authorization'] || `Bearer ${token}`;
    } catch (e) {}
    return Object.assign({}, options, { headers, credentials: 'same-origin' });
}

// ---------------------------------------------------------------------------------------------------------------------

export const ApiService =
{
    async loadView(viewName)
    {
        let url = `./modules/views/${viewName}.html`;
        try {
            if (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
                url += `?cb=${Date.now()}`;
            }
        } catch (e) {}
        return await universalFetch(url);
    },

    async loadTranslations(lang = 'nb') {
        return await universalFetch(`./translations/${lang}.json`);
    },

    async register(userData) {
        return await universalFetch(`${BASE}/users`, { method: 'POST', body: JSON.stringify(userData) });
    },

    async login(credentials) {
        return await universalFetch(`${BASE}/users/login`, { method: 'POST', body: JSON.stringify(credentials) });
    },

    async logout()
    {
        try { await universalFetch(`${BASE}/users/sessions`, withAuthHeaders({ method: 'DELETE' })); } catch (e) { console.debug('logout request failed', e); }
        try { window.localStorage.removeItem('moodmate_session'); } catch (_) {}
        if (store)
        {
            store.token = null;
            store.currentUser = null;
            store.currentChild = null;
        }
    },

    async listUsers() {
        return await universalFetch(`${BASE}/users`, withAuthHeaders({ method: 'GET' }));
    },

    async updateUser(id, userData) {
        return await universalFetch(`${BASE}/users/${id}`, withAuthHeaders({ method: 'PUT', body: JSON.stringify(userData) }));
    },

    async deleteUser(id) {
        return await universalFetch(`${BASE}/users/${id}`, withAuthHeaders({ method: 'DELETE' }));
    },

    async getChildren() {
        return await universalFetch(`${BASE}/children`, withAuthHeaders({ method: 'GET' }));
    },

    async createChild(payload) {
        return await universalFetch(`${BASE}/children`, withAuthHeaders({ method: 'POST', body: JSON.stringify(payload) }));
    },

    async updateChild(childId, payload) {
        return await universalFetch(`${BASE}/children/${childId}`, withAuthHeaders({ method: 'PUT', body: JSON.stringify(payload) }));
    },

    async deleteChild(childId) {
        return await universalFetch(`${BASE}/children/${childId}`, withAuthHeaders({ method: 'DELETE' }));
    },

    async childLogin(payload) {
        return await universalFetch(`${BASE}/children/login`, { method: 'POST', body: JSON.stringify(payload) });
    },

    async saveMood(moodData) {
        return await universalFetch(`${BASE}/moods`, withAuthHeaders({ method: 'POST', body: JSON.stringify(moodData) }));
    },

    async getAllMoods() {
        return await universalFetch(`${BASE}/moods`, withAuthHeaders({ method: 'GET' }));
    },

    async saveDraft(draftData, profileId)
    {
        try {
            const endpoint = profileId ? `${BASE}/moods/drafts/${encodeURIComponent(profileId)}` : `${BASE}/moods/drafts`;
            return await universalFetch(endpoint, withAuthHeaders({ method: 'POST', body: JSON.stringify(draftData), suppressErrorLogging: true }));
        } catch (e) {
            console.debug('saveDraft failed (server may not support drafts):', e);
            return null;
        }
    },

    async getDraft(profileId)
    {
        try {
            const endpoint = profileId ? `${BASE}/moods/drafts/${encodeURIComponent(profileId)}` : `${BASE}/moods/drafts`;
            return await universalFetch(endpoint, withAuthHeaders({ method: 'GET', suppressErrorLogging: true }));
        } catch (e) {
            console.debug('getDraft failed (server may not support drafts):', e);
            return null;
        }
    },

    async deleteDraft(profileId)
    {
        try {
            const endpoint = profileId ? `${BASE}/moods/drafts/${encodeURIComponent(profileId)}` : `${BASE}/moods/drafts`;
            return await universalFetch(endpoint, withAuthHeaders({ method: 'DELETE', suppressErrorLogging: true }));
        } catch (e) {
            console.debug('deleteDraft failed (server may not support drafts):', e);
            return null;
        }
    },

    async exportData(format = 'csv') {
        return await universalFetch(`${BASE}/exports/${encodeURIComponent(format)}`, withAuthHeaders({ method: 'GET' }));
    }
};

// ---------------------------------------------------------------------------------------------------------------------

if (typeof ApiService !== 'undefined')
{
    void ApiService.loadTranslations;
    void ApiService.logout;
    void ApiService.listUsers;
    void ApiService.getChildren;
    void ApiService.createChild;
    void ApiService.exportData;
}
