"use strict";

async function apiRequest(endpoint, method = 'GET', data = null)
{
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(endpoint, options);

        // Checks if the status code is 200-299
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server returnerte ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error.message);
        throw error;
    }
}

export const ApiService =
{
    register: (userData) => apiRequest('/api/users', 'POST', userData),
    deleteUser: (id) => apiRequest(`/api/users/${id}`, 'DELETE'),
    // Add more later as needed:
    // getMoods: () => apiRequest('/api/moods', 'GET')
};