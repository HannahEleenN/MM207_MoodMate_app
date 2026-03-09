import { store } from './modules/singleton.mjs';
import { ApiService } from './modules/api.mjs';
import { authController } from './modules/controllers/userController.mjs';
import { initParentApp } from './modules/controllers/parent_controller.mjs';
import { initChildApp } from './modules/controllers/child_controller.mjs';
import { moodUIController } from './modules/controllers/mood_ui_controller.mjs';

console.log('[app] module loaded');

let previouslyFocusedElement = null;

export async function showLegal(viewName)
{
    console.log('[app] showLegal called for', viewName);

    const modal = document.getElementById('legal-modal');
    const modalText = document.getElementById('legal-text');
    const titleEl = document.getElementById('modal-title');

    if (!modal || !modalText) return;

    if (titleEl) {
        try {
            const tKey = `legal.${viewName}.title`;
            titleEl.textContent = (store.t ? store.t(tKey) : null) || (viewName === 'termsOfService' ? 'Vilkår' : (viewName === 'privacyPolicy' ? 'Personvern' : 'Vilkår og personvern'));
        } catch (e) {
            titleEl.textContent = 'Vilkår og personvern';
        }
    }

    try {
        modalText.innerHTML = await ApiService.loadView(viewName);
        previouslyFocusedElement = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        const closeBtn = document.getElementById('close-modal-btn');
        if (closeBtn) closeBtn.focus();
    } catch (error) {
        console.error("Could not load legal view:", error);
        modalText.textContent = store.t ? store.t('auth.loadError') : 'Kunne ikke laste innholdet.';
        previouslyFocusedElement = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        const closeBtn = document.getElementById('close-modal-btn');
        if (closeBtn) closeBtn.focus();
    }
}

async function router()
{
    const root = document.getElementById('app-root');
    const view = store.currentView;

    console.log('[app.router] start - currentView=', view, 'root?', !!root);

    if (!root) return;

    root.innerHTML = '';

    switch (view) {
        case 'login':
            try {
                console.log('[app.router] rendering login view');
                await authController.init(root);
                console.log('[app.router] rendered login view');
            } catch (e) {
                console.error('[router] authController.init failed:', e);
                root.textContent = store.t ? store.t('auth.loadError') : 'Kunne ikke laste innloggingsvinduet.';
            }
            break;
        case 'userManager':
            const userManagerEl = document.createElement('user-manager');
            root.appendChild(userManagerEl);
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
            const childProfilesEl = document.createElement('child-profiles');
            root.appendChild(childProfilesEl);
            break;
        case 'childLogin':
            try {
                console.log('[app.router] rendering childLogin');
                const { childController } = await import('./modules/controllers/child_controller.mjs');
                if (typeof childController.init === 'function') {
                    console.log('[app.router] calling childController.init');
                    await childController.init(root);
                    console.log('[app.router] childController.init finished');
                } else if (typeof childController['initLogin'] === 'function') {
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
        if (store && typeof store.applyTranslations === 'function') {
            console.log('[app.router] applying translations for view', view);
            store.applyTranslations(root);
        }
    } catch (e) {
        console.warn('applyTranslations after router failed', e);
    }
}

const setupEventListeners = () =>
{
    console.log('[app] setupEventListeners start');
    const modal = document.getElementById('legal-modal');

    try {
        (async () => {
            try {
                console.log('[app.lang] fetching flags.json');
                const resp = await fetch('assets/flags/flags.json');
                const flags = await resp.json();
                console.log('[app.lang] flags.json loaded, count=', Array.isArray(flags) ? flags.length : 0);
                const container = document.getElementById('lang-switcher');
                if (container && Array.isArray(flags)) {
                    container.innerHTML = '';
                    for (const f of flags) {
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

                    const currentLang = (store && store.i18n && store.i18n._lang) || (navigator && (navigator.language || navigator.userLanguage) ? (navigator.language.split('-')[0]) : null);
                    console.log('[app.lang] currentLang detected=', currentLang);
                    const langBtns = container.querySelectorAll('.lang-btn');
                    function setActiveButton(code) {
                        langBtns.forEach(b => {
                            const isActive = b.getAttribute('data-lang') === code;
                            b.classList.toggle('active', isActive);
                            b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                        });
                    }

                    if (currentLang) setActiveButton(currentLang);

                    langBtns.forEach(btn => btn.addEventListener('click', async () => {
                        const lang = btn.getAttribute('data-lang');
                        console.log('[app.lang] button clicked for', lang);
                        try {
                            await store.setLanguage(lang);
                            setActiveButton(lang);
                            try { await store.applyTranslations(document); } catch(_){ }
                            try { const root = document.getElementById('app-root'); if (root) await store.applyTranslations(root); } catch(_){ }
                            await router();
                        } catch (err) {
                            console.debug('Language switch failed', err);
                        }
                    }));
                }
            } catch (err) {
                console.debug('Could not load flags.json, falling back to existing DOM buttons (if any)', err);
            }
        })();
    } catch (e) {
        console.debug('Language switcher build failed', e);
    }

    document.addEventListener('click', (e) => {
        if (e.target.id === 'close-x' || e.target.id === 'close-modal-btn' || e.target === modal) {
            if (modal) {
                modal.classList.remove('open');
                modal.setAttribute('aria-hidden', 'true');
                if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
                    previouslyFocusedElement.focus();
                }
            }
        }
    });

    document.addEventListener('click', async (e) =>
    {
        if (e.target.id === 'view-tos') {
            e.preventDefault();
            await showLegal('termsOfService');
        }
        if (e.target.id === 'view-privacy') {
            e.preventDefault();
            await showLegal('privacyPolicy');
        }
        if (e.target && e.target.id === 'back-to-child-checkin') {
            e.preventDefault();
            store.currentView = 'childMenu';
        }
        if (e.target && e.target.id === 'back-to-parent-menu') {
            e.preventDefault();
            store.currentView = 'parentMenu';
        }
    });

    store.onChange('currentView', () => router());

    console.log('[app] setupEventListeners end');
};

if (!customElements.get('user-manager'))
{
    customElements.define('user-manager', class extends HTMLElement
    {
        constructor() {
            super();
            (async () => {
                const { userUIController } = await import('./modules/controllers/userController.mjs');
                await userUIController.init(this);
            })();
        }
    });
}

if (!customElements.get('child-profiles'))
{
    customElements.define('child-profiles', class extends HTMLElement
    {
        constructor() {
            super();
            (async () => {
                const { profileController } = await import('./modules/controllers/profile_controller.mjs');
                await profileController.init(this);
            })();
        }
    });
}

function determineInitialView()
{
    if (store.currentUser && store.currentChild) return 'childMenu';
    if (store.currentUser) return 'parentMenu';
    return 'login';
}

async function ensureI18n()
{
    if (!store.i18n || Object.keys(store.i18n).length === 0) {
        await store.loadI18n('auto');
    }
}

async function initApp()
{
    await ensureI18n();
    store.currentView = determineInitialView();
    setupEventListeners();
    await router();
    await import('./serviceWorkerSetup.mjs');
}

initApp();

export { router as _router };
