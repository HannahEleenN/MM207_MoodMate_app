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

            // Ensure translations are loaded
            if (!store.i18n || Object.keys(store.i18n).length === 0) {
                await store.loadI18n('no');
            }

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
                    const consentCheck = this.container.querySelector('#login-consent-check');

                    // Require explicit consent before attempting login
                    if (!(consentCheck && consentCheck.checked)) {
                        this.showNotice('login.requireConsent');
                        return;
                    }
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
            const errMsg = store.t ? store.t('auth.loadError') : "Error loading login view.";
            // Set plain text to avoid HTML-in-JS; the actual HTML page should contain proper markup.
            if (this.container) this.container.textContent = errMsg;
        }

    }, // End of init()

    // Small helper to show a Norwegian UI notice using #global-notice
    showNotice(messageKey)
    {
        const el = document.getElementById('global-notice');
        if (!el) return;
        el.textContent = store.t(messageKey);
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 3000);
    },

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
                // If the user returned child profiles, and there is exactly one profile,
                // auto-select that child and go directly to the childMenu. Otherwise let the parent choose.
                const profiles = result.user.profiles || [];
                if (profiles.length === 1) {
                    store.currentChild = profiles[0];
                    store.currentView = 'childMenu';
                } else {
                    store.currentView = 'parentMenu';
                }
                console.log("Welcome:", result.user.nick);
            } else {
                this.showNotice('login.incorrectPin');
            }
        } catch (error) {
            console.error("Login request failed:", error);
            this.showNotice('login.networkError');
        } finally {
            if (loginBtn) loginBtn.disabled = false;
        }

    } // End of handleLogin()

}; // End of authController

