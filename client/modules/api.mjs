/**
 * API Service
 * Acts as a bridge between the controllers and the universalFetch in the singleton.
 * It abstracts the URLs and methods so controllers don't need to know the endpoints.
 */

import { universalFetch } from './singleton.mjs';

export const ApiService =
{

    // VIEW / HTML LOADING

    /**
     * Fetches an HTML template from the views folder.
     * @param {string} viewName - The name of the file (without extension).
     */
    loadView: async (viewName) => {
        return await universalFetch(`./modules/views/${viewName}.html`);
    },

    // USER MANAGEMENT (CRUD)
    // Registers a new parent user account.

    register: async (userData) => {
        return await universalFetch('/api/users/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    // Deletes a user account and all associated data (GDPR).

    deleteUser: async (id) => {
        return await universalFetch(`/api/users/${id}`, {
            method: 'DELETE'
        });
    },

    // Updates user information.

    updateUser: async (id, userData) => {
        return await universalFetch(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    // MOOD LOGGING & INSIGHTS
    // Saves a new mood entry from the child or parent.

    saveMood: async (moodData) => {
        return await universalFetch('/api/moods', {
            method: 'POST',
            body: JSON.stringify(moodData)
        });
    },

    // Fetches all mood logs for the current authenticated user.

    getAllMoods: async () => {
        return await universalFetch('/api/moods', {
            method: 'GET'
        });
    }

}; // End of ApiService