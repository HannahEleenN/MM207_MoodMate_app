import { universalFetch, store } from '../singleton.mjs';

export const moodUIController =
{
    async saveMood(moodData)
    {
        const response = await universalFetch('/api/moods', {
            method: 'POST',
            body: JSON.stringify(moodData)
        });

        if (response) {
            // Updates the Proxy-state
            store.moods = [...store.moods, response.data];
            console.log("UI oppdatert via Proxy!");
        }
    }
};