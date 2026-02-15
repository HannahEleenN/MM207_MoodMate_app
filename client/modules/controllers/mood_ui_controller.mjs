import { store } from '../singleton.mjs';
import { ApiService } from '../api.mjs';

export const moodUIController =
{
    async saveMood(moodData)
    {
        const response = await ApiService.saveMood(moodData);

        if (response) {
            // If API returns the created mood in response.data or response.mood, handle both
            const newMood = response.data || response.mood || response;
            // Updates the Proxy-state
            store.moods = [...store.moods, newMood];
            console.log("UI oppdatert via Proxy!");
        }
    }
};