import { ApiService } from '../api.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// Controller for the Mood Insights view, which shows a history of mood entries and allows saving new moods.

export const moodUIController =
{
    async initInsights(container)
    {
        try {
            // Load insights HTML view into container
            container.innerHTML = await ApiService.loadView('insights');

            // Fetch mood history
            const resp = await ApiService.getAllMoods();
            const entries = (resp && resp.moods) ? resp.moods : (Array.isArray(resp) ? resp : []);

            // Render history table rows
            const historyList = container.querySelector('#history-list');
            if (historyList) {
                historyList.innerHTML = '';
                for (const e of entries) {
                    const tr = document.createElement('tr');
                    const dateStr = new Date(e.date || e.createdAt || e.timestamp || Date.now()).toLocaleDateString();
                    // Be tolerant with different API shapes: prefer e.child or e.childName
                    const child = e.child || e.childName || e.profileName || '—';
                    // Normalize mood property: e.mood preferred, fall back to e.feeling
                    const mood = e.mood || e.feeling || e.feelingLabel || '—';
                    const context = e.context || e.reason || '—';

                    const tdDate = document.createElement('td'); tdDate.textContent = dateStr; tr.appendChild(tdDate);
                    const tdChild = document.createElement('td'); tdChild.textContent = child; tr.appendChild(tdChild);
                    const tdMood = document.createElement('td'); tdMood.textContent = mood; tr.appendChild(tdMood);
                    const tdContext = document.createElement('td'); tdContext.textContent = context; tr.appendChild(tdContext);

                    historyList.appendChild(tr);
                }
            }

        } catch (err) {
            console.error('Kunne ikke laste innsiktsvisningen:', err);
            // Replace container content with an error message element
            const p = document.createElement('p');
            p.textContent = 'Kunne ikke laste innsikter.';
            while (container.firstChild) container.removeChild(container.firstChild);
            container.appendChild(p);
        }
    },

    async saveMood(moodData)
    {
        const response = await ApiService.saveMood(moodData);
        if (response)
        {
            const newMood = response.data || response.mood || response;
            store.moods = [...store.moods, newMood];
            console.log('[moodUI] saved mood and updated store');
        }
    }
};