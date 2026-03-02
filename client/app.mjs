import { store } from './modules/singleton.mjs';
import { ApiService } from './modules/api.mjs';
// authController is exported from userController.mjs (combined controllers file)
import { authController } from './modules/controllers/userController.mjs';
import { initParentApp } from './modules/controllers/parent_controller.mjs';
import { initChildApp } from './modules/controllers/child_controller.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// Global function to show legal documents in the modal. Exported so controllers can call it.

export async function showLegal(viewName)
{
    const modal = document.getElementById('legal-modal');
    const modalText = document.getElementById('legal-text');
    const titleEl = document.getElementById('modal-title');

    if (!modal || !modalText) return;

    // Set a friendly title when possible
    if (titleEl) {
        try {
            // Try to use translations (if available) otherwise fall back to a readable label
            const tKey = `legal.${viewName}.title`;
            titleEl.textContent = (store.t ? store.t(tKey) : null) || (viewName === 'termsOfService' ? 'Vilkår' : (viewName === 'privacyPolicy' ? 'Personvern' : 'Vilkår og personvern'));
        } catch (e) {
            titleEl.textContent = 'Vilkår og personvern';
        }
    }

    try {
        modalText.innerHTML = await ApiService.loadView(viewName);
        modal.style.display = 'block';
    } catch (error) {
        console.error("Could not load legal view:", error);
        modalText.textContent = 'Kunne ikke laste innholdet.';
        modal.style.display = 'block';
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// ROUTER - Switches views based on the application state (store.currentView).

async function router()
{
    const root = document.getElementById('app-root');
    const view = store.currentView;

    if (!root) return;

    // Clear root before loading new view to avoid ghost elements
    root.innerHTML = '';

    switch (view) {
        case 'login':
            await authController.init(root);
            break;
        case 'userManager':
            // Using the custom element defined below
            root.innerHTML = '<user-manager></user-manager>';
            break;
        case 'parentMenu':
            await initParentApp(root, store);
            break;
        case 'childMenu':
            await initChildApp(root, store);
            break;
        case 'childProfiles':
            // Use a custom element to load the child profile manager controller
            root.innerHTML = '<child-profiles></child-profiles>';
            break;
        default:
            // Load the 404 view from views/notFound.html to keep UI in HTML files
            root.innerHTML = await ApiService.loadView('notFound');
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// Setup global listeners for the Modal and Store changes

const setupEventListeners = () =>
{
    const modal = document.getElementById('legal-modal');

    // Close modal logic
    document.addEventListener('click', (e) => {
        if (e.target.id === 'close-x' || e.target.id === 'close-modal-btn' || e.target === modal) {
            if (modal) modal.style.display = 'none';
        }
    });

    // Handle global footer links (if they exist in index.html)
    document.addEventListener('click', async (e) =>
    {
        if (e.target.id === 'view-tos') {
            e.preventDefault();
            await showLegal('termsOfService');
        }
        if (e.target.id === 'view-privacy') {
            e.preventDefault();
            await showLegal('privacyPolicy');
        }
    });

    // Watch for view changes in the Store
    store.onChange('currentView', () => router());
};

// ---------------------------------------------------------------------------------------------------------------------
// Custom Element for User Management (MVC encapsulation)

if (!customElements.get('user-manager'))
{
    customElements.define('user-manager', class extends HTMLElement
    {
        async connectedCallback()
        {
            // Import dynamically to avoid circular dependencies if needed
            // The userUIController is exported from userController.mjs (combined controllers file)
            const { userUIController } = await import('./modules/controllers/userController.mjs');
            userUIController.init(this);
        }
    });
}

// Custom Element for Child Profiles
if (!customElements.get('child-profiles'))
{
    customElements.define('child-profiles', class extends HTMLElement
    {
        async connectedCallback()
        {
            const { profileController } = await import('./modules/controllers/profile_controller.mjs');
            profileController.init(this);
        }
    });
}

// ---------------------------------------------------------------------------------------------------------------------
// Initialization helpers

function determineInitialView()
{
    if (store.currentUser && store.currentChild) return 'childMenu';
    if (store.currentUser) return 'parentMenu';
    return 'login';
}

async function ensureI18n()
{
    if (!store.i18n || Object.keys(store.i18n).length === 0) {
        await store.loadI18n('no');
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// Initialization

document.addEventListener('DOMContentLoaded', async () =>
{
    setupEventListeners();

    // Load translations early so controllers can use store.t immediately
    await ensureI18n();

    // Try to initialize service worker setup (best-effort). Importing executes the setup file.
    try {
        await import('./serviceWorkerSetup.mjs');
    } catch (err) {
        // Non-fatal in many dev environments (e.g., IDE preview); keep it quiet.
        console.debug('Service worker setup import failed (dev environment?)', err);
    }

    // Decide and set the initial view in a single, explicit place.
    if (!store.currentView) {
        store.currentView = determineInitialView();
    } else {
        // If the app state already had a view (e.g., restored state), render it now.
        router();
    }
});
