import { store } from '../singleton.mjs';
import { ApiService } from '../api.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// Controller for User Management (CRUD operations for parent users).

export const userUIController =
{
    async init(container)
    {
        // Store the reference to the container
        this.container = container;

        // Ensure translations are loaded (fallbacks handled by store.loadI18n)
        if (!store.i18n || Object.keys(store.i18n).length === 0) {
            await store.loadI18n('no');
        }

        this.container.innerHTML = await ApiService.loadView('userManager');

        const form = this.container.querySelector("#regForm");
        const list = this.container.querySelector("#user-list");
        const goToLoginBtn = this.container.querySelector('#go-to-login');

        form.onsubmit = async (e) =>
        {
            e.preventDefault();
            const rawData = Object.fromEntries(new FormData(form));

            const payload =
            {
                ...rawData,
                hasConsented: rawData.hasConsented === "true"
            };

            await this.handleRegister(payload);
        };

        if (goToLoginBtn) {
            goToLoginBtn.onclick = (e) => {
                e.preventDefault();
                store.currentView = 'login';
            };
        }

        this.loadUserList(list);
    },

    // Small helper to show a Norwegian UI notice using #global-notice
    showNotice(messageKey)
    {
        const el = document.getElementById('global-notice');
        if (!el) return;
        el.textContent = store.t(messageKey);
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 3500);
    },

    async handleRegister(formData)
    {
        let btn = this.container.querySelector(".btn-reg");
        try
        {
            if (btn) btn.disabled = true;

            // Call the API to register the user (use the single universalFetch in ApiService)
            // Ensure consent is included if the checkbox exists
            const consentCheckbox = this.container.querySelector('#consent-check');

            // Enforce that the checkbox must be checked before attempting to register
            if (!(consentCheckbox && consentCheckbox.checked)) {
                this.showNotice('register.requireConsent');
                return;
            }

            const payload = { ...formData, hasConsented: !!(consentCheckbox && consentCheckbox.checked) };

            const result = await ApiService.register(payload);

            if (result && result.user)
            {
                // Use server-provided user object to avoid duplicating object structure
                store.users = [...store.users, result.user];
                 // Look for the list specifically inside this controller's container
                 this.loadUserList(this.container.querySelector("#user-list"));
                 // Reveal the "Go to login" button and show a localized success message
                 const goBtn = this.container.querySelector('#go-to-login');
                 if (goBtn) goBtn.classList.remove('hidden');

                 // Prefill the login PIN when navigating to login for convenience
                 // NOTE: the server won't return the plain secret; we keep the secret from the formData locally for immediate login convenience.
                 if (formData && formData.secret) {
                     store.prefillSecret = formData.secret;
                 }

                 this.showNotice('register.success');
             }
        } catch (error) {
            console.error("Registration failed:", error);
            this.showNotice('register.failed');
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    async handleEdit(id, oldNick)
    {
        // Use inline edit template instead of prompt()
        const list = this.container.querySelector('#user-list');
        const item = Array.from(list.children).find(li => li.dataset.id === String(id));
        if (!item) return;

        const editTemplate = this.container.querySelector('#user-edit-template');
        if (!editTemplate) return;

        // If an edit form already exists, don't create another
        if (item.querySelector('.edit-inline')) return;

        const clone = editTemplate.content.cloneNode(true);
        const editDiv = clone.querySelector('.edit-inline');
        const input = editDiv.querySelector('.edit-input');
        input.value = oldNick || '';

        // Wire save/cancel buttons
        editDiv.querySelector('.save-edit').onclick = async () => {
            const newNick = input.value.trim();
            if (!newNick || newNick === oldNick) { editDiv.remove(); return; }
            try {
                const result = await ApiService.updateUser(id, { nick: newNick });
                if (result) {
                    store.users = store.users.map(user =>
                        user.id === id ? { ...user, nick: newNick } : user
                    );
                    this.loadUserList(this.container.querySelector("#user-list"));
                    this.showNotice('edit.success');
                }
            } catch (error) {
                console.error("Update failed:", error);
                this.showNotice('edit.failed');
            }
        };

        editDiv.querySelector('.cancel-edit').onclick = () => { editDiv.remove(); };

        item.appendChild(clone);
    },

    async handleDelete(id)
    {
        // Use translated confirm message
        const confirmMsg = store.t('delete.confirm');
        if (!confirm(confirmMsg)) return;
        try {
            await ApiService.deleteUser(id);
            store.users = store.users.filter(user => user.id !== id);
            this.loadUserList(this.container.querySelector("#user-list"));
            this.showNotice('delete.success');
        } catch (error) {
            console.error("Delete failed:", error);
            this.showNotice('delete.failed');
        }
    },

    loadUserList(listElement)
    {
        if (!listElement) return;

        const template = this.container.querySelector('#user-item-template');
        if (!template) return;

        listElement.innerHTML = ''; // Clear existing list items

        store.users.forEach(user =>
        {
            // Clone the template for each user (Separation of concerns: Structure vs Logic)
            const clone = template.content.cloneNode(true);
            const li = clone.querySelector('li');

            // Attach data-id for easier lookup when editing
            li.dataset.id = user.id;

            // Set user data in the cloned node (Data Binding)
            li.querySelector('.user-nick-display').textContent = user.nick;

            // Attach event listeners for edit and delete (Event Delegation)
            li.querySelector('.btn-edit').onclick = () => this.handleEdit(user.id, user.nick);
            li.querySelector('.btn-del').onclick = () => this.handleDelete(user.id);

            // Append the cloned node to the list (DOM Manipulation)
            listElement.appendChild(clone);
        });
    }

}; // End of userUIController

