import { ApiService } from "../api.mjs";
import { store } from "../singleton.mjs";

// ---------------------------------------------------------------------------------------------------------------------

export async function initParentApp(container)
{
    try
    {
        container.innerHTML = await ApiService.loadView('parent_menu');

        try {
            const updateUserIndicators = window.updateUserIndicators || (() => {});
            updateUserIndicators();
        } catch (error) {
            console.debug('updateUserIndicators not available', error);
        }

        const childSelectorElement = container.querySelector('#child-selector-dropdown');
        if (childSelectorElement && store.currentUser && store.currentUser.profiles)
        {
            const childProfiles = store.currentUser.profiles;

            while (childSelectorElement.options.length > 1) {
                childSelectorElement.remove(1);
            }

            childProfiles.forEach(profile =>
            {
                const optionElement = document.createElement('option');
                optionElement.value = profile.id;
                optionElement.textContent = profile.name;
                childSelectorElement.appendChild(optionElement);
            });

            if (store.currentChild && store.currentChild.id) {
                childSelectorElement.value = store.currentChild.id;
            }

            childSelectorElement.addEventListener('change', (event) =>
            {
                const selectedChildId = event.target.value;
                if (selectedChildId)
                {
                    const selectedProfile = childProfiles.find(p => p.id == selectedChildId);
                    if (selectedProfile) {
                        store.currentChild = selectedProfile;
                    }
                }
            });
        }

        container.querySelector('#view-insights').onclick = () => {
            store.currentView = 'insights';
        };

        container.querySelector('#manage-profiles').onclick = () => {
            store.currentView = 'childProfiles';
        };

        const manageAccountsButton = container.querySelector('#manage-accounts');
        if (manageAccountsButton)
        {
            manageAccountsButton.onclick = () => {
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

        const deleteAccountButton = container.querySelector('#delete-account-btn');
        if (deleteAccountButton)
        {
            deleteAccountButton.onclick = async () =>
            {
                const confirmMessage = store.t('delete.confirm');
                if (confirm(confirmMessage))
                {
                    try
                    {
                        await ApiService.deleteUser(store.currentUser.id);
                        const successMessage = store.t('delete.success');
                        showNoticeInline(successMessage);
                        store.currentUser = null;
                        store.currentView = 'login';
                    } catch (error)
                    {
                        console.error("Deletion failed:", error);
                        const failureMessage = store.t('delete.failed');
                        showNoticeInline(failureMessage);
                    }
                }
            };
        }

    } catch (error)
    {
        console.error("Failed to load parent menu:", error);
        const errorMessage = store.t('parent.loadError');

        const errorElement = document.createElement('p');
        errorElement.textContent = errorMessage;

        while (container.firstChild) container.removeChild(container.firstChild);
        container.appendChild(errorElement);
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
