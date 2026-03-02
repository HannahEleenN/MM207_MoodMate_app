import { ApiService } from "../api.mjs";
import { store } from "../singleton.mjs";

// ---------------------------------------------------------------------------------------------------------------------
// Combined User Controller
// Exports two named controller objects to preserve existing usage:
// - authController: handles login view and authentication
// - userUIController: handles user registration / management (userManager view)

// Authentication controller (login)
export const authController =
{
    async init(container)
    {
        try
        {
            this.container = container;

            // Ensure translations are loaded
            if (!store.i18n || Object.keys(store.i18n).length === 0) {
                await store.loadI18n('no');
            }

            // Load the view from the server/API
            this.container.innerHTML = await ApiService.loadView('login');

            // Bind UI elements
            const form = this.container.querySelector('#loginForm');
            const registerBtn = this.container.querySelector('#go-to-reg');

            // Ensure there is an explicit login button so other views can reuse it
            this.loginButton = this.container.querySelector('.login-btn');

            // If a prefill secret exists (set after successful registration), prefill the password
            if (store.prefillSecret) {
                const passwordInput = this.container.querySelector('#password-input');
                if (passwordInput) passwordInput.value = store.prefillSecret;
                // Clear prefill after inserting it once
                delete store.prefillSecret;
            }

            // Setup Form Submission
            if (form) {
                form.onsubmit = async (e) =>
                {
                    e.preventDefault();

                    const emailInput = this.container.querySelector('#email-input');
                    const passwordInput = this.container.querySelector('#password-input');

                    await this.handleLogin(
                        {
                            email: emailInput ? (emailInput.value || '').trim() : '',
                            secret: passwordInput ? (passwordInput.value || '').trim() : ''
                        });
                };
            }

            // Navigation to Registration
            if (registerBtn)
            {
                registerBtn.onclick = (e) =>
                {
                    e.preventDefault();
                    store.currentView = 'userManager';
                };
            }

        } catch (error)
        {
            console.error("Initialization failed:", error);
            const errMsg = store.t ? store.t('auth.loadError') : "Error loading login view.";
            if (this.container) this.container.textContent = errMsg;
        }

    }, // End of init()

    // Small helper to show a Norwegian UI notice using #global-notice
    showNotice(messageKey)
    {
        const el = document.getElementById('global-notice');
        if (!el) return;
        el.textContent = store.t(messageKey);
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 3000);
    },

    /**
     * Handles the login logic.
     * @param {Object} credentials - Contains email and password.
     */
    async handleLogin(credentials)
    {
        const loginBtn = this.container ? this.container.querySelector('.login-btn') : null;

        try {
            if (loginBtn) loginBtn.disabled = true;

            const result = await ApiService.login(credentials);

            if (result && result.user)
            {
                // Update Global Model
                store.currentUser = result.user;
                // If the user returned child profiles, and there is exactly one profile,
                // auto-select that child and go directly to the childMenu. Otherwise let the parent choose.
                const profiles = result.user.profiles || [];
                if (profiles.length === 1) {
                    store.currentChild = profiles[0];
                    store.currentView = 'childMenu';
                } else {
                    store.currentView = 'parentMenu';
                }
                console.log("Welcome:", result.user.email || result.user.nick || result.user.id);
            } else {
                this.showNotice('login.incorrectPin');
            }
        } catch (error) {
            console.error("Login request failed:", error);
            this.showNotice('login.networkError');
        } finally {
            if (loginBtn) loginBtn.disabled = false;
        }

    } // End of handleLogin()

}; // End of authController

// ---------------------------------------------------------------------------------------------------------------------
// User UI Controller (registration and account management)
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

        if (form) {
            form.onsubmit = async (e) =>
            {
                e.preventDefault();
                const formData = Object.fromEntries(new FormData(form));
                await this.handleRegister(formData);
            };
        }

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
        try {
            if (btn) btn.disabled = true;

            // Call the API to register the user (use the single universalFetch in ApiService)
            // Ensure consent is included if the checkbox exists
            const consentCheckbox = this.container.querySelector('#consent-check');

            // Enforce that the checkbox must be checked before attempting to register
            if (!(consentCheckbox && consentCheckbox.checked)) {
                this.showNotice('register.requireConsent');
                return;
            }

            // Build payload with email + secret only
            const payload = { email: formData.email, secret: formData.secret, hasConsented: !!(consentCheckbox && consentCheckbox.checked) };

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

                // Prefill the login password when navigating to login for convenience
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

    async handleEdit(id, oldEmail)
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
        input.value = oldEmail || '';

        // Wire save/cancel buttons
        editDiv.querySelector('.save-edit').onclick = async () => {
            const newEmail = input.value.trim();
            if (!newEmail || newEmail === oldEmail) { editDiv.remove(); return; }
            try {
                const result = await ApiService.updateUser(id, { email: newEmail });
                if (result) {
                    store.users = store.users.map(user =>
                        user.id === id ? { ...user, email: newEmail } : user
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

            // Display email instead of nick (keep backward compatibility if nick exists)
            const emailEl = li.querySelector('.user-email-display') || li.querySelector('.user-nick-display');
            if (emailEl) emailEl.textContent = user.email || user.nick || '';

            // Attach event listeners for edit and delete (Event Delegation)
            const editBtn = li.querySelector('.btn-edit');
            if (editBtn) editBtn.onclick = () => this.handleEdit(user.id, user.email || user.nick);
            const delBtn = li.querySelector('.btn-del');
            if (delBtn) delBtn.onclick = () => this.handleDelete(user.id);

            // Append the cloned node to the list (DOM Manipulation)
            listElement.appendChild(clone);
        });
    }

}; // End of userUIController