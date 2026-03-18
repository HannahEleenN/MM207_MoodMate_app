import { ApiService } from "../api.mjs";
import { store } from "../singleton.mjs";

// ---------------------------------------------------------------------------------------------------------------------

export async function initParentApp(container)
{
    try
    {
        container.innerHTML = await ApiService.loadView('parentMenu');

        container.querySelector('#view-insights').onclick = () => {
            store.currentView = 'insights';
        };

        container.querySelector('#manage-profiles').onclick = () => {
            store.currentView = 'childProfiles';
        };

        const manageAccountsBtn = container.querySelector('#manage-accounts');
        if (manageAccountsBtn)
        {
            manageAccountsBtn.onclick = () => {
                store.currentView = 'userManager';
            };
        }

        const childNameEl = container.querySelector('#child-name');
        if (childNameEl)
        {
            const noneText = store.t('child.none');
            if (store.currentChild) {
                childNameEl.textContent = store.currentChild.name;
            } else if (store.currentUser && store.currentUser.email) {
                childNameEl.textContent = store.currentUser.email;
            } else {
                childNameEl.textContent = noneText;
            }
        }

        const deleteBtn = container.querySelector('#delete-account-btn');
        deleteBtn.onclick = async () =>
        {
            const confirmMsg = store.t('delete.confirm');
            if (confirm(confirmMsg))
            {
                try
                {
                    await ApiService.deleteUser(store.currentUser.id);
                    const successMsg = store.t('delete.success');
                    showNoticeInline(successMsg);
                    store.currentUser = null;
                    store.currentView = 'login';
                } catch (error)
                {
                    console.error("Deletion failed:", error);
                    const failMsg = store.t('delete.failed');
                    showNoticeInline(failMsg);
                }
            }
        };

    } catch (error)
    {
        console.error("Failed to load parent menu:", error);
        const errMsg = store.t('parent.loadError');

        const p = document.createElement('p');
        p.textContent = errMsg;

        while (container.firstChild) container.removeChild(container.firstChild);
        container.appendChild(p);
    }
}

// ---------------------------------------------------------------------------------------------------------------------

function showNoticeInline(message)
{
    const el = document.getElementById('global-notice');
    if (!el) {
        console.warn('NOTICE:', message);
        return;
    }
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

// ---------------------------------------------------------------------------------------------------------------------

Object.defineProperty(globalThis, 'showNoticeInline', { value: showNoticeInline, writable: false, configurable: true });