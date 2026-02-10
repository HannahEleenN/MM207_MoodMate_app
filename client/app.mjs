import { privacyPolicy, termsOfService } from './modules/legal_content.js';
import { initParentApp } from './modules/controllers/parent_main.js';
import { initChildApp } from './modules/controllers/child_controller.mjs';
import { store } from "./modules/singleton.mjs";

// --- Configuration ---
const mainContainer = document.getElementById('app-root');

/**
 * ROUTER
 * Responsible for switching between views based on the application state.
 * This implements the "Single Page Application" behavior.
 */
async function router()
{
    const view = store.currentView; // Get current view from Proxy state

    // Clear container before loading new content
    mainContainer.innerHTML = '';

    switch (view) {
        case 'parent':
            await initParentApp(mainContainer, store);
            break;
        case 'child':
            await initChildApp(mainContainer, store);
            break;
        case 'login':
        default:
            console.log("Showing login/landing page");
            // You can call a login controller here if needed
            break;
    }
}

// --- Event Listeners for State Changes ---
// We listen for changes in our Singleton Proxy to trigger the router
window.addEventListener('stateChanged', (e) => {
    if (e.detail.property === 'currentView') {
        router();
    }
});

// --- Legal Modal Logic ---
// Handles the Privacy Policy and Terms of Service popups
const setupLegalListeners = () =>
{
    const modal = document.getElementById('legal-modal');
    const modalText = document.getElementById('legal-text');
    const consentBox = document.getElementById('consent-checkbox');
    const registerBtn = document.getElementById('register-btn');

    // Toggle register button based on consent checkbox
    if (consentBox && registerBtn) {
        consentBox.onchange = () => {
            registerBtn.disabled = !consentBox.checked;
        };
    }

    // Link triggers for showing legal text
    document.addEventListener('click', (e) => {
        if (e.target.id === 'view-tos') {
            e.preventDefault();
            modalText.innerHTML = termsOfService;
            modal.style.display = 'block';
        }
        if (e.target.id === 'view-privacy') {
            e.preventDefault();
            modalText.innerHTML = privacyPolicy;
            modal.style.display = 'block';
        }
        if (e.target.id === 'close-modal-btn') {
            modal.style.display = 'none';
        }
    });
};

// ---------------------------------------------------------------------------------------------------------------------

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    setupLegalListeners();

    // Set initial view (e.g., if user is already logged in or starting fresh)
    // Changing this property triggers the Proxy, which triggers the Router.
    store.currentView = 'child';
});