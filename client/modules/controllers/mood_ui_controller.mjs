import { ApiService } from '../api.mjs';
import {store} from "../singleton.mjs";

// ---------------------------------------------------------------------------------------------------------------------

function translateValue(value, fallback = '—')
{
    if (!value) return fallback;
    if (typeof value === 'string' && value.includes('.')) {
        return (store && store.t ? store.t(value) || value : value) || fallback;
    }
    return value || fallback;
}

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

                    const { child: childProp, childName, profileName, mood: moodProp, feeling, feelingLabel, context: contextProp, reason, customContext, customSolution, solution } = e || {};

                    const childDisplayName = childProp || childName || profileName || '—';

                    const moodValue = moodProp || feeling || feelingLabel || '—';
                    const translatedMood = translateValue(`mood.${moodValue}`, moodValue);

                    const reasonDisplay = customContext && customContext.trim() 
                        ? customContext 
                        : translateValue(contextProp || reason, '—');

                    const solutionDisplay = customSolution && customSolution.trim() 
                        ? customSolution 
                        : translateValue(solution, '—');

                    const tdDate = document.createElement('td');
                    tdDate.textContent = dateStr;
                    tr.appendChild(tdDate);

                    const tdChild = document.createElement('td');
                    tdChild.textContent = childDisplayName;
                    tr.appendChild(tdChild);

                    const tdMood = document.createElement('td');
                    tdMood.textContent = translatedMood;
                    tr.appendChild(tdMood);

                    const tdReason = document.createElement('td');
                    tdReason.textContent = reasonDisplay;
                    tr.appendChild(tdReason);

                    const tdSolution = document.createElement('td');
                    tdSolution.textContent = solutionDisplay;
                    tr.appendChild(tdSolution);

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