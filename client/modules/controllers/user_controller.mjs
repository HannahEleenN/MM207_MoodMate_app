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

            const loginForm = this.container.querySelector('#loginForm');
            const registerBtn = this.container.querySelector('#go-to-reg');

            if (store.prefillSecret)
            {
                const passwordInput = this.container.querySelector('#password-input');
                if (passwordInput) passwordInput.value = store.prefillSecret;
                delete store.prefillSecret;
            }

            const emailInput = this.container.querySelector('#email-input');
            if (emailInput) try { emailInput.focus(); } catch (_) {}

            if (loginForm)
            {
                loginForm.onsubmit = async (e) =>
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
        const loginForm = this.container ? this.container.querySelector('#loginForm') : null;
        const submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;

        try
        {
            if (submitButton) submitButton.disabled = true;

            const email = (credentials && (credentials.email || credentials.username || credentials.user)) ? (credentials.email || credentials.username || credentials.user) : '';
            const secret = (credentials && (credentials.secret || credentials.password || credentials.pin)) ? (credentials.secret || credentials.password || credentials.pin) : '';

            const emailIsValid = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!emailIsValid)
            {
                const noticeElement = document.getElementById('global-notice');
                if (noticeElement) { noticeElement.textContent = store.t ? (store.t('login.invalidEmail') || 'Please enter a valid email address.') : 'Please enter a valid email address.'; noticeElement.classList.remove('hidden'); setTimeout(() => noticeElement.classList.add('hidden'), 3500); }
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
            if (submitButton) submitButton.disabled = false;
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

        const registrationForm = this.container.querySelector("#regForm");
        const userListElement = this.container.querySelector("#user-list");
        const goToLoginBtn = this.container.querySelector('#go-to-login');

        if (registrationForm)
        {
            registrationForm.onsubmit = async (e) =>
            {
                e.preventDefault();
                const formData = Object.fromEntries(new FormData(registrationForm));
                await this.handleRegister(formData);
            };
            
            const passwordInput = this.container.querySelector('#reg-password');
            if (passwordInput) 
            {
                passwordInput.addEventListener('input', (e) => this.updatePasswordRequirements(e.target.value));
                passwordInput.addEventListener('focus', () => this.showPasswordRequirements());
                passwordInput.addEventListener('blur', () => this.hidePasswordRequirements());
            }
            
            const emailInput = this.container.querySelector('#reg-email');
            if (emailInput) {
                emailInput.addEventListener('blur', () => this.validateEmail());
            }
            
            const consentCheckbox = this.container.querySelector('#consent-check');
            if (consentCheckbox) 
            {
                consentCheckbox.addEventListener('change', () => 
                {
                    const consentError = this.container.querySelector('#consent-error');
                    if (consentError && consentCheckbox.checked) 
                    {
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

        const goToLoginBtnInSuccess = this.container.querySelector('#success-registration-section #go-to-login');
        if (goToLoginBtnInSuccess)
        {
            goToLoginBtnInSuccess.onclick = (e) =>
            {
                e.preventDefault();
                store.currentView = 'login';
            };
        }

        this.loadUserList(userListElement);
    },

    showNotice(messageKey)
    {
        const noticeElement = document.getElementById('global-notice');
        if (!noticeElement) return;
        noticeElement.textContent = store.t(messageKey);
        noticeElement.classList.remove('hidden');
        setTimeout(() => noticeElement.classList.add('hidden'), 3500);
    },

    async handleRegister(formData)
    {
        const registrationForm = this.container.querySelector("#regForm");
        const registerButton = this.container.querySelector(".btn-reg");
        const spinner = this.container.querySelector("#reg-spinner");
        
        try
        {
            this.clearFormErrors();

            const validationErrors = this.validateRegistrationForm(formData);
            if (Object.keys(validationErrors).length > 0) 
            {
                this.displayFormErrors(validationErrors);
                return;
            }

            const consentCheckbox = this.container.querySelector('#consent-check');
            if (!(consentCheckbox && consentCheckbox.checked)) 
            {
                this.displayFormError('consent-error', 'register.requireConsent');
                return;
            }

            if (registrationForm) registrationForm.classList.add('loading');
            if (registerButton) registerButton.disabled = true;
            if (spinner) spinner.setAttribute('aria-hidden', 'false');

            const payload = 
            {
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
                
                const successSection = this.container.querySelector('#success-registration-section');
                if (successSection) successSection.classList.remove('hidden');

                if (formData && formData.secret) {
                    store.prefillSecret = formData.secret;
                }
                
                if (registrationForm) registrationForm.reset();
                this.clearFormErrors();

                this.showNotice('register.success');
            }
        } catch (error) 
        {
            console.error("Registration failed:", error);

            if (error && error.body && error.body.errorKey) 
            {
                this.showNotice(error.body.errorKey);
            } else if (error && error.body && error.body.error) 
            {
                const noticeElement = document.getElementById('global-notice');
                if (noticeElement) 
                {
                    noticeElement.textContent = error.body.error;
                    noticeElement.classList.remove('hidden');
                    setTimeout(() => noticeElement.classList.add('hidden'), 4000);
                }
            } else {
                this.showNotice('register.failed');
            }
        } finally 
        {
            if (registrationForm) registrationForm.classList.remove('loading');
            if (registerButton) registerButton.disabled = false;
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
            const password = formData.secret;
            if (password.length < 6) {
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
                const inputFieldGroup = inputGroup.closest('.input-group');
                if (inputFieldGroup) inputFieldGroup.classList.add('error');
            }
        });
    },

    displayFormError(errorElementId, messageKey)
    {
        const errorElement = this.container.querySelector(`#${errorElementId}`);
        if (errorElement)
        {
            errorElement.textContent = store.t ? store.t(messageKey) : messageKey;
            errorElement.classList.add('show');
        }
    },

    clearFormErrors()
    {
        const errorElements = this.container.querySelectorAll('.field-error');
        errorElements.forEach(errorElement =>
        {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        });

        const errorInputs = this.container.querySelectorAll('.input-group.error');
        errorInputs.forEach(errorInput => errorInput.classList.remove('error'));
    },

    async handleEdit(id, oldEmail)
    {
        const userListElement = this.container.querySelector('#user-list');
        const userItem = Array.from(userListElement.children).find(li => li.dataset.id === String(id));
        if (!userItem) return;

        const editTemplate = this.container.querySelector('#user-edit-template');
        if (!editTemplate) return;

        if (userItem.querySelector('.edit-inline'))
        {
            const existingInput = userItem.querySelector('.edit-input');
            if (existingInput) existingInput.focus();
            return;
        }

        const editFormClone = editTemplate.content.cloneNode(true);
        const editFormSection = editFormClone.querySelector('.edit-inline');
        const emailInputField = editFormSection.querySelector('.edit-input');
        emailInputField.value = oldEmail || '';
        emailInputField.setAttribute('aria-label', store.t ? store.t('edit.emailLabel') : 'Edit email');

        editFormSection.querySelector('.save-edit').onclick = async () =>
        {
            const newEmail = emailInputField.value.trim();
            if (!newEmail || newEmail === oldEmail) { editFormSection.remove(); return; }
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

        editFormSection.querySelector('.cancel-edit').onclick = () => { editFormSection.remove(); };

        userItem.appendChild(editFormClone);

        const addedInput = userItem.querySelector('.edit-input');
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
            const userItemElement = template.content.cloneNode(true);
            const userItem = userItemElement.querySelector('li');

            userItem.dataset.id = user.id;

            const emailEl = userItem.querySelector('.user-email-display') || userItem.querySelector('.user-nick-display');
            if (emailEl) emailEl.textContent = user.nick ? `${user.nick} (${user.email || ''})` : (user.email || '');

            const editBtn = userItem.querySelector('.btn-edit');
            if (editBtn) editBtn.onclick = () => this.handleEdit(user.id, user.email || user.nick);
            const delBtn = userItem.querySelector('.btn-del');
            if (delBtn) delBtn.onclick = () => this.handleDelete(user.id);

            listElement.appendChild(userItemElement);
        });
    },

    updatePasswordRequirements(password)
    {
        const passwordLengthRequirement = this.container.querySelector('.req-length');
        const passwordNumberRequirement = this.container.querySelector('.req-number');

        if (passwordLengthRequirement) 
        {
            const hasLength = password && password.length >= 6;
            if (hasLength) {
                passwordLengthRequirement.classList.add('met');
            } else {
                passwordLengthRequirement.classList.remove('met');
            }
        }

        if (passwordNumberRequirement) 
        {
            const hasNumber = password && /\d/.test(password);
            if (hasNumber) {
                passwordNumberRequirement.classList.add('met');
            } else {
                passwordNumberRequirement.classList.remove('met');
            }
        }
    },

    showPasswordRequirements()
    {
        const passwordRequirementsContainer = this.container.querySelector('.password-requirements');
        if (passwordRequirementsContainer) {
            passwordRequirementsContainer.classList.add('show');
        }
    },

    hidePasswordRequirements()
    {
        const passwordRequirementsContainer = this.container.querySelector('.password-requirements');
        if (passwordRequirementsContainer) {
            passwordRequirementsContainer.classList.remove('show');
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

        if (!email)
        {
            emailError.textContent = store.t ? store.t('login.emailPlaceholder') : 'Email is required';
            emailError.classList.add('show');
            if (inputGroup) inputGroup.classList.add('error');
            return false;
        } else if (!emailRegex.test(email))
        {
            emailError.textContent = store.t ? store.t('login.invalidEmail') : 'Please enter a valid email';
            emailError.classList.add('show');
            if (inputGroup) inputGroup.classList.add('error');
            return false;
        } else
        {
            emailError.textContent = '';
            emailError.classList.remove('show');
            if (inputGroup) inputGroup.classList.remove('error');
            return true;
        }
    }
};
