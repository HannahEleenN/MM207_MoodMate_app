import { ApiService } from "../api.mjs";
import { store } from "../singleton.mjs";

// ---------------------------------------------------------------------------------------------------------------------
// Controller for Authentication (login flow for parents).

export const authController =
{
    async init(container)
    {
        try {
            this.container = container;
            const html = await ApiService.loadView('login');
            this.container.innerHTML = html;

            const form = this.container.querySelector('#loginForm');
            const registerBtn = this.container.querySelector('#go-to-reg');

            if (form) {
                form.onsubmit = async (e) => {
                    e.preventDefault();

                    const pinInput = this.container.querySelector('#pin-input');
                    await this.handleLogin({ secret: pinInput.value });
                };
            }

            if (registerBtn) {
                registerBtn.onclick = (e) => {
                    e.preventDefault();
                    store.currentView = 'userManager';
                };
            }

        } catch (error) {
            console.error("Failed to load login view:", error);
            this.container.innerHTML = "<p>Feil ved lasting av innlogging.</p>";
        }
    },

    async handleLogin(credentials)
    {
        const loginBtn = this.container.querySelector('.primary-btn');

        try {
            if (loginBtn) loginBtn.disabled = true;

            const result = await ApiService.login(credentials);

            if (result && result.user)
            {
                store.currentUser = result.user;
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