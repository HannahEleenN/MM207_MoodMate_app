import { ApiService } from "../api.mjs";
import { store } from "../singleton.mjs";

// Controller for the Parent Dashboard.

export async function initParentApp(container)
{
    try {
        // Fetch the view from the HTML file
        container.innerHTML = await ApiService.loadView('parentMenu');

        // Navigation Logic: Use the store to change views
        // This triggers the Proxy/Observer in app.mjs
        container.querySelector('#view-insights').onclick = () => {
            store.currentView = 'insights';
        };

        container.querySelector('#manage-profiles').onclick = () => {
            // Open the child profile manager so the parent can create/select profiles
            store.currentView = 'childProfiles';
        };

        // New: allow parents to manage accounts (create other parent accounts / profile-like accounts)
        const manageAccountsBtn = container.querySelector('#manage-accounts');
        if (manageAccountsBtn) {
            manageAccountsBtn.onclick = () => {
                store.currentView = 'userManager';
            };
        }

        // Update current child display if present
        const childNameEl = container.querySelector('#child-name');
        if (childNameEl) {
            const noneText = store.t('child.none');
            childNameEl.textContent = store.currentChild ? store.currentChild.name : noneText;
        }

        // Data Logic: Delete account (GDPR)
        const deleteBtn = container.querySelector('#delete-account-btn');
        deleteBtn.onclick = async () =>
        {
            const confirmMsg = store.t('delete.confirm');
            if (confirm(confirmMsg)) {
                try {
                    // Assuming store.currentUser contains the ID
                    await ApiService.deleteUser(store.currentUser.id);
                    const successMsg = store.t('delete.success');
                    showNoticeInline(successMsg);
                    store.currentUser = null;
                    store.currentView = 'login';
                } catch (error) {
                    console.error("Deletion failed:", error);
                    const failMsg = store.t('delete.failed');
                    showNoticeInline(failMsg);
                }
            }
        };

        // Logout handler: clear client-side session state
        const logoutBtn = container.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                // Remove auth token from store and clear current user/child
                if (window.__STORE__) {
                    window.__STORE__.authToken = null;
                }
                // Clear persisted session
                try { window.localStorage.removeItem('moodmate_session'); } catch (_) {}
                store.currentUser = null;
                store.currentChild = null;
                store.currentView = 'login';
            };
        }

    } catch (error) {
        console.error("Failed to load parent menu:", error);
        const errMsg = store.t('parent.loadError');
        // Create a paragraph element and append it instead of using innerHTML with HTML content
        const p = document.createElement('p');
        p.textContent = errMsg;
        // Clear container and append
        while (container.firstChild) container.removeChild(container.firstChild);
        container.appendChild(p);
    }
}

// Inline notice helper (keeps UI text in Norwegian via store.t)
function showNoticeInline(message)
{
    const el = document.getElementById('global-notice');
    if (!el) {
        // Fallback: log the message rather than showing a blocking alert dialog
        console.warn('NOTICE:', message);
        return;
    }
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

// Expose helper to this module scope so callers above can use it via global function name
Object.defineProperty(globalThis, 'showNoticeInline', { value: showNoticeInline, writable: false, configurable: true });