import { ApiService } from "../api.mjs";
import { store } from "../singleton.mjs";
import { showLegal } from "../../app.mjs";

// ---------------------------------------------------------------------------------------------------------------------
// Controller for Authentication.
// Manages the login flow and links to registration/legal views.

export const authController =
{
    async init(container)
    {
        try {
            this.container = container;

            // Load the view from the server/API
            const html = await ApiService.loadView('login');
            this.container.innerHTML = html;

            // Bind UI elements
            const form = this.container.querySelector('#loginForm');
            const registerBtn = this.container.querySelector('#go-to-reg');
            const tosLink = this.container.querySelector('#link-tos');
            const privacyLink = this.container.querySelector('#link-privacy');

            // Setup Legal Links
            if (tosLink) tosLink.onclick = () => showLegal('termsOfService');
            if (privacyLink) privacyLink.onclick = () => showLegal('privacyPolicy');

            // Setup Form Submission
            if (form) {
                form.onsubmit = async (e) =>
                {
                    e.preventDefault();
                    const pinInput = this.container.querySelector('#pin-input');
                    // We send the secret (PIN) to the login handler
                    await this.handleLogin({ secret: pinInput.value });
                };
            }

            // Navigation to Registration
            if (registerBtn) {
                registerBtn.onclick = (e) => {
                    e.preventDefault();
                    store.currentView = 'userManager';
                };
            }

        } catch (error) {
            console.error("Initialization failed:", error);
            this.container.innerHTML = "<p>Error loading login view.</p>";
        }

    }, // End of init()

    /**
     * Handles the login logic.
     * @param {Object} credentials - Contains the user secret/PIN.
     */
    async handleLogin(credentials)
    {
        const loginBtn = this.container.querySelector('.primary-btn');

        try {
            if (loginBtn) loginBtn.disabled = true;

            const result = await ApiService.login(credentials);

            if (result && result.user) {
                // Update Global Model
                store.currentUser = result.user;
                // Trigger View Change
                store.currentView = 'parentMenu';
                console.log("Welcome:", result.user.nick);
            } else {
                alert("Incorrect PIN code.");
            }
        } catch (error) {
            console.error("Login request failed:", error);
            alert("Unable to connect to login service.");
        } finally {
            if (loginBtn) loginBtn.disabled = false;
        }

    } // End of handleLogin()

}; // End of authController