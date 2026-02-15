import { ApiService } from "../api.mjs";
import { store } from "../singleton.mjs";

// Controller for Authentication (Login).

export const authController =
{
    async init(container)
    {
        try {
            // Fetch and inject the HTML view
            const html = await ApiService.loadView('login');
            container.innerHTML = html;

            // Setup event listeners
            const form = container.querySelector('#login-form');
            const registerLink = container.querySelector('#go-to-register');

            form.onsubmit = async (e) =>
            {
                e.preventDefault();
                const formData = Object.fromEntries(new FormData(form));
                await this.handleLogin(formData);
            };

            registerLink.onclick = (e) => {
                e.preventDefault();
                // Change view to userManager for registration
                store.currentView = 'userManager';
            };

        } catch (error) {
            console.error("Failed to load login view:", error);
            container.innerHTML = "<p>Feil ved lasting av innlogging.</p>";
        }
    },

    async handleLogin(credentials)
    {
        const loginBtn = document.querySelector('#login-btn');

        try {
            if (loginBtn) loginBtn.disabled = true;

            const result = await ApiService.login(credentials);

            if (result && result.user) {
                // Update Model (Singleton Proxy)
                store.currentUser = result.user;

                // Route to Parent Menu after successful login
                store.currentView = 'parentMenu';
                console.log("Login successful for:", result.user.nick);
            } else {
                alert("Feil kallenavn eller kode.");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Kunne ikke logge inn. Prøv igjen.");
        } finally {
            if (loginBtn) loginBtn.disabled = false;
        }
    }

}; // End of authController