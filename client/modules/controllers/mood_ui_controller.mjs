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
    },

    // Init insights view: load view, fetch moods, populate history and show states
    async initInsights(container)
    {
        try {
            container.innerHTML = await ApiService.loadView('insights');
        } catch (err) {
            console.error('Kunne ikke laste innsiktsvisningen:', err);
            container.innerHTML = '<p>Kunne ikke laste innsikter.</p>';
            return;
        }

        // Elements (guarded)
        const loadingEl = container.querySelector('#insights-loading');
        const errorEl = container.querySelector('#insights-error');
        const emptyEl = container.querySelector('#insights-empty');
        const chartPlaceholder = container.querySelector('#mood-chart-placeholder');
        const historyList = container.querySelector('#history-list');

        const safeHide = (el) => { if (el) el.classList.add('hidden'); };
        const safeShow = (el) => { if (el) el.classList.remove('hidden'); };

        safeShow(loadingEl);
        safeHide(errorEl);
        safeHide(emptyEl);
        if (chartPlaceholder) chartPlaceholder.innerHTML = '';

        try {
            const resp = await ApiService.getAllMoods();
            const data = Array.isArray(resp) ? resp : (resp && resp.data ? resp.data : []);

            if (!Array.isArray(data) || data.length === 0) {
                safeHide(loadingEl);
                safeShow(emptyEl);
                return;
            }

            // Populate history table
            if (historyList) historyList.innerHTML = '';

            for (const m of data) {
                const tr = document.createElement('tr');
                const dateObj = new Date(m.createdAt || m.date || m.timestamp || m.created || Date.now());
                const dateStr = isNaN(dateObj.getTime()) ? (m.date || '') : dateObj.toLocaleDateString();
                const child = m.childName || m.child || m.childId || m.userId || '';
                const mood = m.mood || m.emotion || m.value || '';
                const context = m.context || m.note || m.description || '';

                tr.innerHTML = `
                    <td>${dateStr}</td>
                    <td>${child}</td>
                    <td>${mood}</td>
                    <td>${context}</td>
                `;

                if (historyList) historyList.appendChild(tr);
            }

            safeHide(loadingEl);
            // Basic chart placeholder: show a simple summary
            if (chartPlaceholder) {
                const summary = document.createElement('div');
                summary.className = 'chart-summary';
                const count = data.length;
                summary.textContent = `${count} loggpost(er) funnet.`;
                chartPlaceholder.appendChild(summary);
            }

        } catch (err) {
            console.error('Feil ved henting av humørdata:', err);
            safeHide(loadingEl);
            safeShow(errorEl);
        }

        // Back and export handlers
        const backBtn = container.querySelector('#back-to-parent-menu');
        if (backBtn) backBtn.onclick = () => { store.currentView = 'parentMenu'; };

        const exportBtn = container.querySelector('#export-data-btn');
        if (exportBtn) exportBtn.onclick = () => {
            if (typeof showNoticeInline === 'function') showNoticeInline('Eksport foreløpig ikke implementert.');
            else alert('Eksport foreløpig ikke implementert.');
        };
    }
};