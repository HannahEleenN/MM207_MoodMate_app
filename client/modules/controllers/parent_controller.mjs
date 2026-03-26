import { ApiService } from "../api.mjs";
import { store } from "../singleton.mjs";

// ---------------------------------------------------------------------------------------------------------------------

export async function initParentApp(container)
{
    try
    {
        container.innerHTML = await ApiService.loadView('parent_menu');

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

        const childNameDisplay = container.querySelector('#child-name');
        if (childNameDisplay)
        {
            const noneLabel = store.t('child.none');
            if (store.currentChild) {
                childNameDisplay.textContent = store.currentChild.name;
            } else if (store.currentUser && store.currentUser.email) {
                childNameDisplay.textContent = store.currentUser.email;
            } else {
                childNameDisplay.textContent = noneLabel;
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

        const logoutBtn = container.querySelector('#logout-btn');
        if (logoutBtn)
        {
            logoutBtn.onclick = async () =>
            {
                try
                {
                    await ApiService.logout();
                    const successMsg = store.t('logout.success') || 'Logged out successfully';
                    showNoticeInline(successMsg);
                    store.currentView = 'login';
                } catch (error)
                {
                    console.error("Logout failed:", error);
                    const failMsg = store.t('logout.failed') || 'Logout failed';
                    showNoticeInline(failMsg);
                }
            };
        }

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

function showNoticeInline(noticeMessage)
{
    const noticeElement = document.getElementById('global-notice');
    if (!noticeElement)
    {
        console.warn('NOTICE:', noticeMessage);
        return;
    }
    noticeElement.textContent = noticeMessage;
    noticeElement.classList.remove('hidden');
    setTimeout(() => noticeElement.classList.add('hidden'), 3000);
}

// ---------------------------------------------------------------------------------------------------------------------

Object.defineProperty(globalThis, 'showNoticeInline', { value: showNoticeInline, writable: false, configurable: true });
