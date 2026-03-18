import { store } from './modules/singleton.mjs';
import { ApiService } from './modules/api.mjs';
import { authController } from './modules/controllers/userController.mjs';
import { initParentApp } from './modules/controllers/parent_controller.mjs';
import { initChildApp } from './modules/controllers/child_controller.mjs';
import { moodUIController } from './modules/controllers/mood_ui_controller.mjs';
import { createUserModel } from './modules/models/user_client_model.mjs';

// ---------------------------------------------------------------------------------------------------------------------

console.log('[app] module loaded');

let previouslyFocusedElement = null;
let currentLegalView = null;

// ---------------------------------------------------------------------------------------------------------------------

async function applyTranslations()
{
    try {
        if (store && typeof store.applyTranslations === 'function') {
            await store.applyTranslations(document);
        }
    } catch (e) {
        console.warn('applyTranslations failed', e);
    }
}

// ---------------------------------------------------------------------------------------------------------------------

function buildLegalHtmlFromI18n(viewName)
{
    try
    {
        if (!store || !store.i18n) return null;
        const t = (k) => (store.t ? store.t(k) : (store.i18n && store.i18n[k]) || '');

        if (viewName === 'privacyPolicy')
        {
            const parts = [];
            parts.push('<section class="legal-document">');
            parts.push(`<h2>${t('privacy.title') || 'Privacy Policy'}</h2>`);
            if (t('privacy.intro')) parts.push(`<p>${t('privacy.intro')}</p>`);

            if (t('privacy.section1.title')) parts.push(`<h3>${t('privacy.section1.title')}</h3>`);
            if (t('privacy.section1.body')) parts.push(`<p>${t('privacy.section1.body')}</p>`);

            if (t('privacy.fields'))
            {
                parts.push(`<h4>${t('privacy.fields')}</h4>`);
                parts.push('<ul>');
                const fieldKeys = ['privacy.fields.id','privacy.fields.nickname','privacy.fields.scrambledSecret','privacy.fields.consentFlag','privacy.fields.childrenProfiles'];
                for (const fk of fieldKeys)
                {
                    const val = t(fk);
                    if (val) parts.push(`<li>${val}</li>`);
                }
                parts.push('</ul>');
            }

            for (let i = 2; i <= 5; i++) {
                const titleK = `privacy.section${i}.title`;
                const bodyK = `privacy.section${i}.body`;
                if (t(titleK)) parts.push(`<h3>${t(titleK)}</h3>`);
                if (t(bodyK)) parts.push(`<p>${t(bodyK)}</p>`);
            }

            if (t('privacy.contact') || t('privacy.section5.body')) {
            }

            parts.push('</section>');
            return parts.join('\n');
        }

        if (viewName === 'termsOfService')
        {
            const parts = [];
            parts.push('<section class="legal-document">');
            parts.push(`<h2>${t('terms.title') || 'Terms of Service'}</h2>`);
            if (t('terms.intro')) parts.push(`<p>${t('terms.intro')}</p>`);

            for (let i = 1; i <= 6; i++)
            {
                const titleK = `terms.section${i}.title`;
                const bodyK = `terms.section${i}.body`;
                if (t(titleK)) parts.push(`<h3>${t(titleK)}</h3>`);
                if (t(bodyK)) parts.push(`<p>${t(bodyK)}</p>`);
            }

            parts.push('</section>');
            return parts.join('\n');
        }

        return null;
    } catch (e) {
        console.warn('buildLegalHtmlFromI18n failed', e);
        return null;
    }
}

// ---------------------------------------------------------------------------------------------------------------------

async function updateOpenLegal()
{
    try
    {
        const modal = document.getElementById('legal-modal');
        const modalText = document.getElementById('legal-text');
        const titleEl = document.getElementById('modal-title');
        if (!modal || !modalText || !titleEl) return;
        if (!currentLegalView) return;
        const html = buildLegalHtmlFromI18n(currentLegalView);
        if (html)
        {
            modalText.innerHTML = html;
            try { titleEl.textContent = store?.t ? store.t(`legal.${currentLegalView}.title`) : titleEl.textContent; } catch(_){ }
            try { await store.applyTranslations(modalText); } catch(_){ }
        }
    } catch (e) {
        console.warn('updateOpenLegal failed', e);
    }
}

// ---------------------------------------------------------------------------------------------------------------------

export async function showLegal(viewName)
{
    console.log('[app] showLegal called for', viewName);

    const modal = document.getElementById('legal-modal');
    const modalText = document.getElementById('legal-text');
    const titleEl = document.getElementById('modal-title');

    if (!modal || !modalText) return;

    if (titleEl)
    {
        try {
            const tKey = `legal.${viewName}.title`;
            titleEl.textContent = (store?.t ? store.t(tKey) : null) || (viewName === 'termsOfService' ? 'Vilkår' : (viewName === 'privacyPolicy' ? 'Personvern' : 'Vilkår og personvern'));
        } catch (e) {
            titleEl.textContent = 'Vilkår og personvern';
        }
    }

    currentLegalView = viewName;

    try
    {
        try {
            modalText.innerHTML = await ApiService.loadView(viewName);
            try { await store.applyTranslations(modalText); } catch (_) {}
        } catch (loadErr)
        {
            const i18nHtml = buildLegalHtmlFromI18n(viewName);
            if (i18nHtml) {
                modalText.innerHTML = i18nHtml;
            } else {
                modalText.innerHTML = await ApiService.loadView(viewName);
            }
        }

        previouslyFocusedElement = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        const closeBtn = document.getElementById('close-modal-btn');
        if (closeBtn) closeBtn.focus();
    } catch (error)
    {
        console.error("Could not load legal view:", error);
        modalText.textContent = store?.t ? store.t('auth.loadError') : 'Kunne ikke laste innholdet.';
        previouslyFocusedElement = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        const closeBtn = document.getElementById('close-modal-btn');
        if (closeBtn) closeBtn.focus();
    }
}

// ---------------------------------------------------------------------------------------------------------------------

async function router()
{
    const root = document.getElementById('app-root');
    const view = store?.currentView;

    console.log('[app.router] start - currentView=', view, 'root?', !!root);

    if (!root) return;

    root.innerHTML = '';

    switch (view)
    {
        case 'login':
            try
            {
                console.log('[app.router] rendering login view');
                await authController.init(root);
                console.log('[app.router] rendered login view');
            } catch (e) {
                console.error('[router] authController.init failed:', e);
                root.textContent = store?.t ? store.t('auth.loadError') : 'Kunne ikke laste innloggingsvinduet.';
            }
            break;
        case 'userManager':
        {
            const userManagerEl = document.createElement('user-manager');
            root.appendChild(userManagerEl);
        }
            break;
        case 'parentMenu':
            console.log('[app.router] rendering parentMenu');
            await initParentApp(root, store);
            break;
        case 'childMenu':
            console.log('[app.router] rendering childMenu');
            await initChildApp(root, store);
            break;
        case 'childProfiles':
        {
            const childProfilesEl = document.createElement('child-profiles');
            root.appendChild(childProfilesEl);
        }
            break;
        case 'childLogin':
            try
            {
                console.log('[app.router] rendering childLogin');
                const { childController } = await import('./modules/controllers/child_controller.mjs');
                if (typeof childController.init === 'function')
                {
                    console.log('[app.router] calling childController.init');
                    await childController.init(root);
                    console.log('[app.router] childController.init finished');
                } else if (typeof childController['initLogin'] === 'function')
                {
                    console.log('[app.router] calling childController.initLogin fallback');
                    await childController['initLogin'](root);
                    console.log('[app.router] childController.initLogin finished');
                } else {
                    console.error('childController has no init method; rendering fallback view');
                    try {
                        root.innerHTML = await ApiService.loadView('notFound');
                    } catch (err) {
                        root.textContent = 'Requested view is not available.';
                    }
                }
            } catch (e) {
                console.error('child login init failed', e);
            }
            break;
        case 'insights':
            try {
                await moodUIController.initInsights(root);
            } catch (e) {
                console.error('insights init failed', e);
                root.innerHTML = await ApiService.loadView('notFound');
            }
            break;
        default:
            root.innerHTML = await ApiService.loadView('notFound');
    }

    try {
        await applyTranslations();
    } catch (e) {
        console.warn('applyTranslations after router failed', e);
    }
}

// ---------------------------------------------------------------------------------------------------------------------

async function buildLanguageSwitcher()
{
    try
    {
        console.log('[app.lang] fetching flags.json');
        const resp = await fetch('assets/flags/flags.json');
        if (!resp.ok) {
            console.debug('[app.lang] flags.json HTTP error', resp.status);
            return;
        }

        const flags = await resp.json();
        console.log('[app.lang] flags.json loaded, count=', Array.isArray(flags) ? flags.length : 0);
        const container = document.getElementById('lang-switcher');
        if (!container || !Array.isArray(flags)) return;

        container.innerHTML = '';
        for (const f of flags)
        {
            const { code, title, file } = f || {};
            const btn = document.createElement('button');
            btn.className = 'lang-btn';
            btn.setAttribute('data-lang', code || '');
            btn.setAttribute('title', title || '');
            btn.setAttribute('aria-label', title || '');
            btn.setAttribute('aria-pressed', 'false');

            const img = document.createElement('img');
            img.src = file || '';
            img.alt = `${title || ''} flag`;
            img.width = 28;
            img.height = 18;
            img.style.objectFit = 'contain';
            img.style.display = 'block';

            btn.appendChild(img);
            container.appendChild(btn);
        }

        const detectedLang = (() =>
        {
            if (store?.i18n?._lang) return store.i18n._lang;
            if (typeof navigator === 'undefined') return null;
            const nav = navigator;
            const navLang = (nav.languages && nav.languages[0]) || nav.language || null;
            return navLang ? navLang.split('-')[0] : null;
        })();

        console.log('[app.lang] currentLang detected=', detectedLang);
        const languageButtons = container.querySelectorAll('.lang-btn');

        function setActiveButton(code)
        {
            languageButtons.forEach(b =>
            {
                const isActive = b.getAttribute('data-lang') === code;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        }

        if (detectedLang) setActiveButton(detectedLang);

        languageButtons.forEach(btn => btn.addEventListener('click', async () =>
        {
            const lang = btn.getAttribute('data-lang');
            console.log('[app.lang] button clicked for', lang);
            try
            {
                if (store && typeof store.setLanguage === 'function') {
                    await store.setLanguage(lang);
                    setActiveButton(lang);
                    try { await store.applyTranslations(document); } catch(_){ }
                    try { const root = document.getElementById('app-root'); if (root) await store.applyTranslations(document); } catch(_){ }
                    await router();
                }
            } catch (err) {
                console.debug('Language switch failed', err);
            }
        }));
    } catch (err) {
        console.debug('Could not load flags.json, falling back to existing DOM buttons (if any)', err);
    }
}

// ---------------------------------------------------------------------------------------------------------------------

const setupEventListeners = () =>
{
    console.log('[app] setupEventListeners start');
    const modal = document.getElementById('legal-modal');
    const globalLogoutBtn = document.getElementById('global-logout');

    function updateLogoutVisibility()
    {
        try
        {
            if (!globalLogoutBtn) return;
            const v = store.currentView;
            const hideOn = ['login', 'userManager', 'childLogin'];
            if (hideOn.includes(v)) {
                globalLogoutBtn.classList.add('hidden');
            } else {
                globalLogoutBtn.classList.remove('hidden');
            }
        } catch (e) { console.warn('updateLogoutVisibility failed', e); }
    }

    try { updateLogoutVisibility(); } catch (_) {}

    if (globalLogoutBtn)
    {
        try
        {
            const label = store?.t ? (store.t('global.logout') || 'Log out') : 'Log out';
            const lblEl = globalLogoutBtn.querySelector('.logout-label');
            if (lblEl) lblEl.textContent = label;
            globalLogoutBtn.setAttribute('aria-label', label);
        } catch (e) {  }

        globalLogoutBtn.onclick = async (e) =>
        {
            e.preventDefault();
            try
            {
                const hasTempSelections = !!(store && (store.temporaryMoodSelection || store.temporaryContext || store.temporarySolutionSelection));
                const hasDraft = !!(store && store.draftMood && (store.draftMood.mood || store.draftMood.context || store.draftMood.solution || store.draftMood.note));
                const hasUnsavedMood = hasTempSelections || hasDraft;

                const confirmKey = hasUnsavedMood ? 'global.logoutUnsavedWarning' : 'global.logoutConfirm';
                const defaultConfirm = hasUnsavedMood
                    ? 'You have an unfinished mood entry that will be lost if you log out. Log out anyway?'
                    : 'Are you sure you want to log out?';

                const message = (store && typeof store.t === 'function') ? (store.t(confirmKey) || defaultConfirm) : defaultConfirm;

                if (!confirm(message)) {
                    return;
                }

                try { await ApiService.logout(); } catch (err) { console.debug('Logout failed (client side)', err); }
                try { store.currentView = 'login'; } catch(_) {}
            } catch (outerErr) {
                console.error('Logout handler failed:', outerErr);
            }
        };
    }

    try
    {
        buildLanguageSwitcher().catch(err => console.debug('buildLanguageSwitcher failed', err));
    } catch (e) {
        console.debug('Language switcher build failed', e);
    }

    try
    {
        if (store && typeof store.onChange === 'function') {
            store.onChange('i18n', () => {

                try { updateOpenLegal(); } catch (_) {}

                try
                {
                    if (globalLogoutBtn && store && typeof store.t === 'function') {
                        const lbl = store.t('global.logout') || '';
                        const lblEl = globalLogoutBtn.querySelector('.logout-label');
                        if (lblEl) lblEl.textContent = lbl || lblEl.textContent;
                        globalLogoutBtn.setAttribute('aria-label', lbl || globalLogoutBtn.getAttribute('aria-label'));
                    }
                 } catch (_) {}
            });

            store.onChange('currentView', () =>
            {
                try { updateLogoutVisibility(); } catch (_) {}

                try {
                    const v = store.currentView;
                    if (v === 'login' || v === 'userManager') {
                        document.body.classList.add('auth-view');
                    } else {
                        document.body.classList.remove('auth-view');
                    }
                } catch (_) {}
            });

            store.onChange('currentUser', () => {
                try { updateLogoutVisibility(); } catch (_) {}
            });
        }
    } catch (e) {
        console.debug('Failed to attach i18n change listener', e);
    }

    document.addEventListener('click', async (e) =>
    {
        const target = e.target;

        if (target === modal || target?.id === 'close-x' || target?.id === 'close-modal-btn')
        {
            if (modal)
            {
                modal.classList.remove('open');
                modal.setAttribute('aria-hidden', 'true');
                currentLegalView = null;
                if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
                    previouslyFocusedElement.focus();
                }
            }
            return;
        }

        if (target?.id === 'view-tos')
        {
            e.preventDefault();
            if (!document.body.classList.contains('auth-view')) return;
            await showLegal('termsOfService');
            return;
        }
        if (target?.id === 'view-privacy')
        {
            e.preventDefault();
            if (!document.body.classList.contains('auth-view')) return;
            await showLegal('privacyPolicy');
            return;
        }

        if (target?.id === 'back-to-child-checkin')
        {
            e.preventDefault();
            store.currentView = 'childMenu';
            return;
        }
        if (target?.id === 'back-to-parent-menu')
        {
            e.preventDefault();
            store.currentView = 'parentMenu';
        }
    });

    try
    {
        store.onChange('currentView', () =>
        {
            const v = store.currentView;
            if (globalLogoutBtn)
            {
                const hideOn = ['login', 'userManager', 'childLogin'];
                if (hideOn.includes(v)) {
                    globalLogoutBtn.classList.add('hidden');
                } else {
                    globalLogoutBtn.classList.remove('hidden');
                }
            }
        });
    } catch (_) {}

    store.onChange('currentView', () => { router().catch(err => console.error('[app.router] failed in onChange', err)); });

    console.log('[app] setupEventListeners end');
};

// ---------------------------------------------------------------------------------------------------------------------

const userModel = createUserModel([]);

window.addEventListener('userModelChanged', () => {
    console.log('User model changed:', userModel.users);
});

function addUser(user)
{
    if (!user) return;
    userModel.users = [...(userModel.users || []), user];
    window.dispatchEvent(new Event('userModelChanged'));
}

export { userModel, addUser };

window.addUser = addUser;
window.userModel = userModel;

// ---------------------------------------------------------------------------------------------------------------------

if (!customElements.get('user-manager'))
{
    customElements.define('user-manager', class extends HTMLElement
    {
        constructor()
        {
            super();
            (async () =>
            {
                try {
                    const { userUIController } = await import('./modules/controllers/userController.mjs');
                    await userUIController.init(this);
                } catch (e) {
                    console.error('user-manager init failed', e);
                }
            })();
        }
    });
}

// ---------------------------------------------------------------------------------------------------------------------

if (!customElements.get('child-profiles'))
{
    customElements.define('child-profiles', class extends HTMLElement
    {
        constructor()
        {
            super();
            (async () =>
            {
                try {
                    const { childProfilesUI } = await import('./modules/controllers/profile_controller.mjs');
                    if (childProfilesUI && typeof childProfilesUI.init === 'function') await childProfilesUI.init(this);
                } catch (e) {
                    console.error('child-profiles init failed', e);
                }
            })();
        }
    });
}

// ---------------------------------------------------------------------------------------------------------------------

(async function initApp()
{
    try {
        await store.loadI18n('auto');
    } catch (e) {
        console.warn('i18n bootstrap failed', e);
    }

    try { setupEventListeners(); } catch (e) { console.warn('setupEventListeners failed', e); }

    try { await router(); } catch (e) { console.error('Initial router failed', e); }
})();