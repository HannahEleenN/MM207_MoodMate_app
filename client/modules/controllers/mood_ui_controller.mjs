import { ApiService } from '../api.mjs';
import {store} from "../singleton.mjs";

// ---------------------------------------------------------------------------------------------------------------------

export const moodUIController =
{
    async initInsights(container)
    {
        try
        {
            container.innerHTML = await ApiService.loadView('insights');

            const resp = await ApiService.getAllMoods();
            const entries = (resp && (Array.isArray(resp.data) ? resp.data : (resp.moods || (Array.isArray(resp) ? resp : [])))) || [];

            const historyList = container.querySelector('#history-list');
            if (historyList)
            {
                historyList.innerHTML = '';
                for (const e of entries)
                {
                    const tr = document.createElement('tr');
                    const dateStr = new Date(e.date || e.createdAt || e.timestamp || Date.now()).toLocaleDateString();

                    const { child: childProp, childName, profileName, mood: moodProp, feeling, feelingLabel, context: contextProp, reason } = e || {};
                    const child = childProp || childName || profileName || '—';

                    const mood = moodProp || feeling || feelingLabel || '—';
                    const context = contextProp || reason || '—';

                    const tdDate = document.createElement('td'); tdDate.textContent = dateStr; tr.appendChild(tdDate);
                    const tdChild = document.createElement('td'); tdChild.textContent = child; tr.appendChild(tdChild);
                    const tdMood = document.createElement('td'); tdMood.textContent = mood; tr.appendChild(tdMood);
                    const tdContext = document.createElement('td'); tdContext.textContent = context; tr.appendChild(tdContext);

                    historyList.appendChild(tr);
                }
            }

        } catch (err)
        {
            console.error('[moodUI] failed to load insights view:', err);

            const isAuthError = err && (err.status === 401 || err.status === 403);
            const p = document.createElement('p');
            if (isAuthError)
            {
                p.textContent = (store && store.t) ? store.t('auth.sessionExpired') || store.t('insights.error') : 'Session expired or access denied. Please log in again.';
                try { store.currentView = 'login'; } catch (_) {}
            } else {
                p.textContent = (store && store.t) ? store.t('insights.error') : 'Could not load insights.';
            }

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