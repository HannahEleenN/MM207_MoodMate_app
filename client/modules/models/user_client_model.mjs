// The Model: Only holds data and notify listeners when data changes
export function createUserModel(initialUsers = [])
{
    const state = {
        users: initialUsers
    };

    return new Proxy(state,
    {
        set(target, property, value)
        {
            target[property] = value;
            // Notify the UI to re-render (Observer pattern)
            window.dispatchEvent(new CustomEvent('userModelChanged'));
            return true;
        }
    });
}