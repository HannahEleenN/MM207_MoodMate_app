import { ApiService } from "../api.mjs";
import { store } from "../singleton.mjs";

// Controller for the Parent Dashboard.

export async function initParentApp(container)
{
    try {
        // Fetch the view from the HTML file
        const html = await ApiService.loadView('parentMenu');
        container.innerHTML = html;

        // Navigation Logic: Use the store to change views
        // This triggers the Proxy/Observer in app.mjs
        container.querySelector('#view-insights').onclick = () => {
            store.currentView = 'insights';
        };

        container.querySelector('#manage-profiles').onclick = () => {
            store.currentView = 'userManager';
        };

        // Data Logic: Delete account (GDPR)
        const deleteBtn = container.querySelector('#delete-account-btn');
        deleteBtn.onclick = async () =>
        {
            if (confirm("Er du sikker? Dette sletter alle dine data permanent (GDPR).")) {
                try {
                    // Assuming store.currentUser contains the ID
                    await ApiService.deleteUser(store.currentUser.id);
                    alert("Kontoen din er nå slettet.");
                    store.currentUser = null;
                    store.currentView = 'login';
                } catch (error) {
                    console.error("Deletion failed:", error);
                    alert("Kunne ikke slette konto. Prøv igjen senere.");
                }
            }
        };

    } catch (error) {
        console.error("Failed to load parent menu:", error);
        container.innerHTML = "<p>Feil ved lasting av foreldremeny.</p>";
    }
}