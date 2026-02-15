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
        title.textContent = viewName === 'termsOfService' ? 'Brukervilkår' : 'Personvernerklæring';
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
        default:
            root.innerHTML = '<h2>404 - Siden finnes ikke</h2>';
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

// ---------------------------------------------------------------------------------------------------------------------
// Initialization
document.addEventListener('DOMContentLoaded', () =>
{
    setupEventListeners();

    // Set initial view
    if (!store.currentView) {
        store.currentView = store.currentUser ? 'parentMenu' : 'login';
    } else {
        router(); // Initial manual call
    }
});
