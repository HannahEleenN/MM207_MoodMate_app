// The single source of fetch for the entire application.
// Handles both JSON API calls and HTML view fetching.

async function apiRequest(endpoint, method = 'GET', data = null)
{
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(endpoint, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error: ${response.status}`);
        }

        // Check content type to decide if we return text (HTML) or object (JSON)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            return await response.text(); // Returns the HTML file as a string
        }

        return await response.json(); // Returns API data as an object
    } catch (error) {
        console.error("Fetch Error:", error.message);
        throw error;
    }
}

// Named exports for easy access in controllers
export const ApiService =
{
    // Methods for UI/Views
    loadView: (viewName) => apiRequest(`./modules/views/${viewName}.html`),

    // Methods for Data/API
    register: (userData) => apiRequest('/api/users', 'POST', userData),
    deleteUser: (id) => apiRequest(`/api/users/${id}`, 'DELETE'),
    updateUser: (id, userData) => apiRequest(`/api/users/${id}`, 'PUT', userData),
    saveMood: (moodData) => apiRequest('/api/moods', 'POST', moodData)
};