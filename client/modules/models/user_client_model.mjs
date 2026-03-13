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
            window.dispatchEvent(new CustomEvent('userModelChanged'));
            return true;
        }
    });
}