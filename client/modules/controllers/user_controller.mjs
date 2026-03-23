import { ApiService } from "../api.mjs";
import { store } from "../singleton.mjs";

// ---------------------------------------------------------------------------------------------------------------------

export const authController =
{
    async init(container)
    {
        console.log('[authController] init called');
        try
        {
            this.container = container;

            if (!store.i18n || Object.keys(store.i18n).length === 0) {
                await store.loadI18n('nb');
            }

            this.container.innerHTML = await ApiService.loadView('login');

            const form = this.container.querySelector('#loginForm');
            const registerBtn = this.container.querySelector('#go-to-reg');

            if (store.prefillSecret)
            {
                const passwordInput = this.container.querySelector('#password-input');
                if (passwordInput) passwordInput.value = store.prefillSecret;
                delete store.prefillSecret;
            }

            const emailInput = this.container.querySelector('#email-input');
            if (emailInput) try { emailInput.focus(); } catch (_) {}

            if (form)
            {
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

    },

    showNotice(messageKey)
    {
        const el = document.getElementById('global-notice');
        if (!el) return;
        el.textContent = store.t(messageKey);
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 3000);
    },

    showErrorMessage(message)
    {
        const el = document.getElementById('global-notice');
        if (el)
        {
            el.textContent = message;
            el.classList.remove('hidden');
            el.setAttribute('role', 'alert');
            setTimeout(() => el.classList.add('hidden'), 4000);
        } else {
            alert(message);
        }
    },

    async handleLogin(credentials)
    {
        const form = this.container ? this.container.querySelector('#loginForm') : null;
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

        try
        {
            if (submitBtn) submitBtn.disabled = true;

            const email = (credentials && (credentials.email || credentials.username || credentials.user)) ? (credentials.email || credentials.username || credentials.user) : '';
            const secret = (credentials && (credentials.secret || credentials.password || credentials.pin)) ? (credentials.secret || credentials.password || credentials.pin) : '';

            const emailIsValid = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!emailIsValid)
            {
                const el = document.getElementById('global-notice');
                if (el) { el.textContent = store.t ? (store.t('login.invalidEmail') || 'Please enter a valid email address.') : 'Please enter a valid email address.'; el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 3500); }
                return false;
            }

            if (!email || !secret) {
                this.showNotice('login.incorrectPin');
                return false;
            }

            console.log('[authController] handleLogin for', email);

            const payload = { email, secret, password: secret };

            let result;
            try {
                result = await ApiService.login(payload);
            } catch (err)
            {
                try
                {
                    if (err && err.body && typeof err.body === 'object') {
                        console.error('[authController] login request error', err.status, JSON.stringify(err.body));
                    } else {
                        console.error('[authController] login request error', err && err.status, err && err.body ? err.body : err.message || err);
                    }
                } catch (logErr) {
                    console.error('[authController] login request error (failed to stringify)', err, logErr);
                }
                 if (err && err.status === 401)
                 {
                    const serverMsg = err && err.body && (err.body.error || err.body.message) ? (err.body.error || err.body.message) : null;

                    let serverErrorKey = null;
                    if (err && err.body && typeof err.body === 'object')
                    {
                        serverErrorKey = err.body.errorKey || err.body.code || null;

                        if (!serverErrorKey && Object.prototype.hasOwnProperty.call(err.body, 'error_key')) {
                            serverErrorKey = err.body['error_key'];
                        }
                    }
                     if (serverMsg)
                     {
                         const displayMsg = serverErrorKey && store.t ? (store.t(serverErrorKey) || serverMsg) : serverMsg;
                         this.showErrorMessage(displayMsg);
                     } else {
                         this.showNotice('login.incorrectPin');
                     }
                      return false;
                 }
                 this.showNotice('login.networkError');
                 return false;
             }

            console.log('[authController] login result', result && (result.user || result.token) ? (result.user?.email || result.user?.id || '[user]') : result);

            if (result && (result.user || result.token))
            {
                const token = result.token || (result.user && result.user.token) || null;
                const user = result.user || (result && !result.user && token ? null : result) || null;

                if (user) store.currentUser = user;
                if (token)
                {
                    store.token = token;
                    try { window.__STORE__ = window.__STORE__ || {}; window.__STORE__.token = token; } catch (_) {}
                    try
                    {
                        const session = { token, user: store.currentUser };
                        window.localStorage.setItem('moodmate_session', JSON.stringify(session));
                    } catch (e) { console.warn('Failed to persist session:', e); }
                    console.log('[authController] stored token (len)', token ? String(token).length : 0);
                }

                const profiles = (store.currentUser && store.currentUser.profiles) ? store.currentUser.profiles : [];
                if (profiles && profiles.length === 1) {
                    store.currentChild = profiles[0];
                    store.currentView = 'childMenu';
                } else {
                    store.currentView = 'parentMenu';
                }

                return true;
            } else {
                this.showNotice('login.incorrectPin');
                return false;
            }

        } catch (error)
        {
            console.error('Unexpected login failure:', error);
            this.showNotice('login.networkError');
            return false;
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }

    },
};

// ---------------------------------------------------------------------------------------------------------------------

export const userUIController =
{
    async init(container)
    {
        this.container = container;

        if (!store.i18n || Object.keys(store.i18n).length === 0) {
            await store.loadI18n('nb');
        }

        this.container.innerHTML = await ApiService.loadView('userManager');

        const form = this.container.querySelector("#regForm");
        const list = this.container.querySelector("#user-list");
        const goToLoginBtn = this.container.querySelector('#go-to-login');

        if (form)
        {
            form.onsubmit = async (e) =>
            {
                e.preventDefault();
                const formData = Object.fromEntries(new FormData(form));
                await this.handleRegister(formData);
            };
        }

        if (goToLoginBtn)
        {
            goToLoginBtn.onclick = (e) =>
            {
                e.preventDefault();
                store.currentView = 'login';
            };
        }

        this.loadUserList(list);
    },

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

            const consentCheckbox = this.container.querySelector('#consent-check');

            if (!(consentCheckbox && consentCheckbox.checked)) {
                this.showNotice('register.requireConsent');
                return;
            }

            const payload =
            {
                nick: formData.nick || null,
                email: formData.email,
                secret: formData.secret,
                has_consented: !!(consentCheckbox && consentCheckbox.checked)
            };

            const result = await ApiService.register(payload);

            if (result && result.user)
            {
                store.users = [...store.users, result.user];
                this.loadUserList(this.container.querySelector("#user-list"));

                const goBtn = this.container.querySelector('#go-to-login');
                if (goBtn) goBtn.classList.remove('hidden');

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
        const list = this.container.querySelector('#user-list');
        const item = Array.from(list.children).find(li => li.dataset.id === String(id));
        if (!item) return;

        const editTemplate = this.container.querySelector('#user-edit-template');
        if (!editTemplate) return;

        if (item.querySelector('.edit-inline'))
        {
            const existingInput = item.querySelector('.edit-input');
            if (existingInput) existingInput.focus();
            return;
        }

        const clone = editTemplate.content.cloneNode(true);
        const editDiv = clone.querySelector('.edit-inline');
        const input = editDiv.querySelector('.edit-input');
        input.value = oldEmail || '';
        input.setAttribute('aria-label', store.t ? store.t('edit.emailLabel') : 'Edit email');

        editDiv.querySelector('.save-edit').onclick = async () =>
        {
            const newEmail = input.value.trim();
            if (!newEmail || newEmail === oldEmail) { editDiv.remove(); return; }
            try
            {
                const result = await ApiService.updateUser(id, { email: newEmail });
                if (result)
                {
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

        const addedInput = item.querySelector('.edit-input');
        if (addedInput) addedInput.focus();
    },

    async handleDelete(id)
    {
        const confirmMsg = store.t('delete.confirm');
        if (!confirm(confirmMsg)) return;
        try
        {
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

        listElement.innerHTML = '';

        store.users.forEach(user =>
        {
            const clone = template.content.cloneNode(true);
            const li = clone.querySelector('li');

            li.dataset.id = user.id;

            const emailEl = li.querySelector('.user-email-display') || li.querySelector('.user-nick-display');
            if (emailEl) emailEl.textContent = user.nick ? `${user.nick} (${user.email || ''})` : (user.email || '');

            const editBtn = li.querySelector('.btn-edit');
            if (editBtn) editBtn.onclick = () => this.handleEdit(user.id, user.email || user.nick);
            const delBtn = li.querySelector('.btn-del');
            if (delBtn) delBtn.onclick = () => this.handleDelete(user.id);

            listElement.appendChild(clone);
        });
    }
};