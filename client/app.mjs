import { store } from './modules/singleton.mjs';
import { authController } from './modules/controllers/auth_controller.mjs';
import { initParentApp } from './modules/controllers/parent_controller.mjs';
import { initChildApp } from './modules/controllers/child_controller.mjs';
import { userUIController } from './modules/controllers/user_ui_controller.mjs';

import { createUserModel } from './modules/models/user_client_model.mjs';

// ---------------------------------------------------------------------------------------------------------------------

// Configuration
const root = document.getElementById('app-root');

// Setup model (Dependency Injection)
const userModel = createUserModel([{ id: 1, nick: "Mamma" }]);

// ---------------------------------------------------------------------------------------------------------------------

// ROUTER
// Responsible for switching between views based on the application state.
// This implements the "Single Page Application" behavior.

async function router()
{
    const view = store.currentView; // Get current view from Proxy state

    // Clear container before loading new content
    root.innerHTML = '';

    switch (view) {
        case 'login':
            await authController.init(root);
            break;
        case 'parentMenu':
            await initParentApp(root);
            break;
        case 'childMenu':
            await initChildApp(root, store); // Dependency injection of store
            break;
        case 'userManager':
            await userUIController.init(root);
            break;
        default:
            await authController.init(root); // Fallback to login
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// Event Listeners for State Changes
// We listen for changes in our Singleton Proxy to trigger the router

window.addEventListener('stateChanged', (e) => {
    if (e.detail.property === 'currentView') {
        router();
    }
});

// ---------------------------------------------------------------------------------------------------------------------
// Legal Modal Logic
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
    document.addEventListener('click', (e) =>
    {
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
// Initialization

document.addEventListener('DOMContentLoaded', () => {
    setupLegalListeners();

    // If we have no user, show login. Else show menu.
    store.currentView = store.currentUser ? 'parentMenu' : 'login';
});