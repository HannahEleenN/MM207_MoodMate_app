// The only fetch function that should be used across the entire application
export async function universalFetch(url, options = {})
{
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error("API-feil");
        return await response.json();
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

// State Management with Proxy (Observer Pattern)
const state =
{
    users: [],
    moods: [],
    currentUser: null
};

export const store = new Proxy(state,
{
    set(target, property, value)
    {
        target[property] = value;
        window.dispatchEvent(new CustomEvent('stateChanged', { detail: { property, value } }));
        return true;
    }
});