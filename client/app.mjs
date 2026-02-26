import { store } from './modules/singleton.mjs';
import { ApiService } from './modules/api.mjs';
import { authController } from './modules/controllers/auth_controller.mjs';
import { initParentApp } from './modules/controllers/parent_controller.mjs';
import { initChildApp } from './modules/controllers/child_controller.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// Global function to show legal documents in the modal. Exported so controllers can call it.

export async function showLegal(viewName)
{
    const modal = document.getElementById('legal-modal');
    const modalText = document.getElementById('legal-text');
    const title = document.getElementById('modal-title');

    if (!modal || !modalText) return;

    try {
        const content = await ApiService.loadView(viewName);
        modalText.innerHTML = content;
        modal.style.display = 'block';
    } catch (error) {
        console.error("Could not load legal view:", error);
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
            modal.style.display = 'none';
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
            const { userUIController } = await import('./modules/controllers/user_ui_controller.mjs');
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
// Initialization
document.addEventListener('DOMContentLoaded', async () =>
{
    setupEventListeners();

    // Load translations early so controllers can use store.t immediately
    if (!store.i18n || Object.keys(store.i18n).length === 0) {
        await store.loadI18n('no');
    }

    // Set initial view: if user and child selected -> childMenu; if user only -> parentMenu; otherwise login
    if (!store.currentView) {
        if (store.currentUser && store.currentChild) {
            store.currentView = 'childMenu';
        } else if (store.currentUser) {
            store.currentView = 'parentMenu';
        } else {
            store.currentView = 'login';
        }
    } else {
        router(); // Initial manual call
    }
});
