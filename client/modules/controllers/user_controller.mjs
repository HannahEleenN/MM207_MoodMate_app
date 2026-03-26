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
        const noticeElement = document.getElementById('global-notice');
        if (!noticeElement) return;
        noticeElement.textContent = store.t(messageKey);
        noticeElement.classList.remove('hidden');
        setTimeout(() => noticeElement.classList.add('hidden'), 3000);
    },

    showErrorMessage(errorMessage)
    {
        const noticeElement = document.getElementById('global-notice');
        if (noticeElement)
        {
            noticeElement.textContent = errorMessage;
            noticeElement.classList.remove('hidden');
            noticeElement.setAttribute('role', 'alert');
            setTimeout(() => noticeElement.classList.add('hidden'), 4000);
        } else {
            alert(errorMessage);
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

            if (!email || !secret)
            {
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

        this.container.innerHTML = await ApiService.loadView('user_manager');

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

            // Add real-time password validation listeners
            const passwordInput = this.container.querySelector('#reg-password');
            if (passwordInput) {
                passwordInput.addEventListener('input', (e) => this.updatePasswordRequirements(e.target.value));
                passwordInput.addEventListener('focus', () => this.showPasswordRequirements());
                passwordInput.addEventListener('blur', () => this.hidePasswordRequirements());
            }

            // Add email validation listener
            const emailInput = this.container.querySelector('#reg-email');
            if (emailInput) {
                emailInput.addEventListener('blur', () => this.validateEmail());
            }

            // Add consent checkbox listener for real-time error clearing
            const consentCheckbox = this.container.querySelector('#consent-check');
            if (consentCheckbox) {
                consentCheckbox.addEventListener('change', () => {
                    const consentError = this.container.querySelector('#consent-error');
                    if (consentError && consentCheckbox.checked) {
                        consentError.textContent = '';
                        consentError.classList.remove('show');
                    }
                });
            }
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
        const form = this.container.querySelector("#regForm");
        const btn = this.container.querySelector(".btn-reg");
        const spinner = this.container.querySelector("#reg-spinner");
        
        try
        {
            this.clearFormErrors();

            const validationErrors = this.validateRegistrationForm(formData);
            if (Object.keys(validationErrors).length > 0) {
                this.displayFormErrors(validationErrors);
                return;
            }

            const consentCheckbox = this.container.querySelector('#consent-check');
            if (!(consentCheckbox && consentCheckbox.checked)) {
                this.displayFormError('consent-error', 'register.requireConsent');
                return;
            }

            if (form) form.classList.add('loading');
            if (btn) btn.disabled = true;
            if (spinner) spinner.setAttribute('aria-hidden', 'false');

            const payload = {
                nick: formData.nick || null,
                email: formData.email.trim().toLowerCase(),
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

                // Reset form
                if (form) form.reset();
                this.clearFormErrors();

                this.showNotice('register.success');
            }
        } catch (error) {
            console.error("Registration failed:", error);

            if (error && error.body && error.body.errorKey) {
                this.showNotice(error.body.errorKey);
            } else if (error && error.body && error.body.error) {
                const el = document.getElementById('global-notice');
                if (el) {
                    el.textContent = error.body.error;
                    el.classList.remove('hidden');
                    setTimeout(() => el.classList.add('hidden'), 4000);
                }
            } else {
                this.showNotice('register.failed');
            }
        } finally {
            if (form) form.classList.remove('loading');
            if (btn) btn.disabled = false;
            if (spinner) spinner.setAttribute('aria-hidden', 'true');
        }
    },

    validateRegistrationForm(formData)
    {
        const errors = {};

        if (!formData.email || !formData.email.trim()) {
            errors.email = 'login.emailPlaceholder';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                errors.email = 'login.invalidEmail';
            }
        }

        if (!formData.secret || !formData.secret.trim()) {
            errors.password = 'login.passwordPlaceholder';
        } else {
            const pwd = formData.secret;
            if (pwd.length < 6) {
                errors.password = 'register.passwordTooShort';
            }
        }

        return errors;
    },

    displayFormErrors(errors)
    {
        Object.keys(errors).forEach(field =>
        {
            this.displayFormError(`${field}-error`, errors[field]);
            const inputGroup = this.container.querySelector(`#reg-${field}`);
            if (inputGroup)
            {
                const group = inputGroup.closest('.input-group');
                if (group) group.classList.add('error');
            }
        });
    },

    displayFormError(errorElementId, messageKey)
    {
        const errorEl = this.container.querySelector(`#${errorElementId}`);
        if (errorEl)
        {
            errorEl.textContent = store.t ? store.t(messageKey) : messageKey;
            errorEl.classList.add('show');
        }
    },

    clearFormErrors()
    {
        const errorEls = this.container.querySelectorAll('.field-error');
        errorEls.forEach(el =>
        {
            el.textContent = '';
            el.classList.remove('show');
        });

        const errorInputs = this.container.querySelectorAll('.input-group.error');
        errorInputs.forEach(el => el.classList.remove('error'));
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
    },

    updatePasswordRequirements(password)
    {
        const reqLength = this.container.querySelector('.req-length');
        const reqNumber = this.container.querySelector('.req-number');

        if (reqLength) {
            const hasLength = password && password.length >= 6;
            if (hasLength) {
                reqLength.classList.add('met');
            } else {
                reqLength.classList.remove('met');
            }
        }

        if (reqNumber) {
            const hasNumber = password && /\d/.test(password);
            if (hasNumber) {
                reqNumber.classList.add('met');
            } else {
                reqNumber.classList.remove('met');
            }
        }
    },

    showPasswordRequirements()
    {
        const reqContainer = this.container.querySelector('.password-requirements');
        if (reqContainer) {
            reqContainer.classList.add('show');
        }
    },

    hidePasswordRequirements()
    {
        const reqContainer = this.container.querySelector('.password-requirements');
        if (reqContainer) {
            reqContainer.classList.remove('show');
        }
    },

    validateEmail()
    {
        const emailInput = this.container.querySelector('#reg-email');
        const emailError = this.container.querySelector('#email-error');
        
        if (!emailInput || !emailError) return;

        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const inputGroup = emailInput.closest('.input-group');

        if (!email) {
            emailError.textContent = store.t ? store.t('login.emailPlaceholder') : 'Email is required';
            emailError.classList.add('show');
            if (inputGroup) inputGroup.classList.add('error');
            return false;
        } else if (!emailRegex.test(email)) {
            emailError.textContent = store.t ? store.t('login.invalidEmail') : 'Please enter a valid email';
            emailError.classList.add('show');
            if (inputGroup) inputGroup.classList.add('error');
            return false;
        } else {
            emailError.textContent = '';
            emailError.classList.remove('show');
            if (inputGroup) inputGroup.classList.remove('error');
            return true;
        }
    }
};