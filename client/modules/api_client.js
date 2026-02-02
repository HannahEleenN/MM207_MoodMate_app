"use strict";

async function apiRequest(endpoint, method = 'GET', data = null)
{
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(endpoint, options); // This is the only fetch call

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Feil: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error.message);
        throw error;
    }
}

export const ApiService = {
    register: (userData) => apiRequest('/api/users', 'POST', userData),
    deleteUser: (id) => apiRequest(`/api/users/${id}`, 'DELETE'),
    updateUser: (id, userData) => apiRequest(`/api/users/${id}`, 'PUT', userData)
};