import { ApiService } from "../api.mjs";

/**
 * Controller for the child mood selection view.
 * @param {HTMLElement} container - Where to render the view.
 * @param {Object} model - The application state (Proxy).
 */

export async function initChildApp(container, model)
{
    try {
        // 1. Fetch the HTML view from the external file (use the actual filename)
        const html = await ApiService.loadView('childMenu');

        // 2. Inject the HTML into the index.html container
        container.innerHTML = html;

        // 3. Attach logic to the newly injected elements
        const buttons = container.querySelectorAll('.mood-btn');

        buttons.forEach(btn => {
            btn.onclick = async () => {
                const mood = btn.getAttribute('data-mood');

                // Update local state/model
                model.currentMood = mood;

                // Example: Send to server using the same ApiService
                await ApiService.saveMood({ mood, timestamp: new Date() });

                alert(`Du valgte: ${mood}. Dette er nå lagret!`);
            };
        });

    } catch (error) {
        console.error("Failed to initialize child view:", error);
        container.innerHTML = "<p>Beklager, kunne ikke laste menyen.</p>";
    }
}