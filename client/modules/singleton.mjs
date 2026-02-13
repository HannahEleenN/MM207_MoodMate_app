/**
 * Singleton & State Management
 * This file acts as the single source of truth (Model) and
 * provides a unified fetch function for the entire app.
 */

export async function universalFetch(url, options = {}) {
    try {
        // Automatically set Content-Type for POST/PUT requests with a body
        if (options.body && !options.headers) {
            options.headers = { 'Content-Type': 'application/json' };
        }

        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`Fetch error: ${response.status}`);

        // Decide whether to return plain text (HTML views) or parsed JSON (API data)
        const isHtml = url.endsWith('.html');
        return isHtml ? await response.text() : await response.json();

    } catch (err) {
        console.error("UniversalFetch error:", err);
        throw err;
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// State Management with Proxy (Observer Pattern)

const state = {
    users: [],
    moods: [],
    currentUser: null,
    currentView: 'login' // Initial view for the router
};

// ---------------------------------------------------------------------------------------------------------------------
// Proxy Wrapper (Observer Pattern)

export const store = new Proxy(state,
{
    set(target, property, value)
    {
        target[property] = value;

        // Notify the application (e.g., the Router) that the state has changed
        window.dispatchEvent(new CustomEvent('stateChanged', {
            detail: { property, value }
        }));

        return true;
    }
});