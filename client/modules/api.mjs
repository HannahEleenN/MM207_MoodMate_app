/**
 * API Service
 * Acts as a bridge between the controllers and the universalFetch in the singleton.
 * It abstracts the URLs and methods so controllers don't need to know the endpoints.
 */

import { universalFetch } from './singleton.mjs';

// --- CONFIGURATION & ENVIRONMENT DETECTION ---

// Determine a sensible API base automatically for development vs production:
// - If running on localhost, point to the backend at :3000 by default (express dev server)
// - Otherwise use a relative '/api' path for same-origin hosting (production)

const DEFAULT_BASE = (typeof window !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
    ? `${location.protocol}//${location.hostname}:3000/api`
    : '/api';

const BASE = (typeof window !== 'undefined' && window.__API_BASE__) ? window.__API_BASE__ : DEFAULT_BASE;

// --- API SERVICE OBJECT ---

export const ApiService =
    {
        // VIEW / HTML LOADING

        /**
         * Fetches an HTML template from the views folder.
         * @param {string} viewName - The name of the file (without extension).
         */
        loadView: async (viewName) =>
        {
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

        // LOCALES / I18N LOADER

        /**
         * Loads UI strings for the specified language.
         * @param {string} lang - Language code (default 'no').
         */
        loadLocale: async (lang = 'no') => {
            return await universalFetch(`./locales/${lang}.json`);
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
            return await universalFetch(`${BASE}/users/login`, {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
        },

        // Fetches a list of all users (admin/manager view).

        listUsers: async () => {
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
            return await universalFetch(`${BASE}/children`, {
                method: 'GET'
            });
        },

        // Creates a new child profile.

        createChild: async (payload) =>
        {
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

        logout: async () =>
        {
            // Token removal is usually handled in singleton/store;
            // this provides a hook for server-side logout if needed later.
            return { success: true };
        }

    }; // End of ApiService