import { universalFetch, store } from '../singleton.mjs';

export const userUIController =
{
    async handleRegister(formData)
    {
        // TODO: Show a "loading"-spinner on the button (UI feedback)

        // Send data to the server via universalFetch
        const result = await universalFetch('/api/users/register', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        // Update the Proxy-state
        if (result) {
            store.currentUser = result.user;
        }
    }
};