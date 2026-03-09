import { store } from './modules/singleton.mjs';
import { ApiService } from './modules/api.mjs';
import { authController } from './modules/controllers/userController.mjs';
import { initParentApp } from './modules/controllers/parent_controller.mjs';
import { initChildApp } from './modules/controllers/child_controller.mjs';
import { moodUIController } from './modules/controllers/mood_ui_controller.mjs';

console.log('[app] module loaded');

// ---------------------------------------------------------------------------------------------------------------------
// Global function to show legal documents in the modal. Exported so controllers can call it.

let previouslyFocusedElement = null;

export async function showLegal(viewName)
{
    console.log('[app] showLegal called for', viewName);

    const modal = document.getElementById('legal-modal');
    const modalText = document.getElementById('legal-text');
    const titleEl = document.getElementById('modal-title');

    if (!modal || !modalText) return;

    // Set a friendly title when possible
    if (titleEl) {
        try {
            // Try to use translations (if available) otherwise fall back to a readable label
            const tKey = `legal.${viewName}.title`;
            titleEl.textContent = (store.t ? store.t(tKey) : null) || (viewName === 'termsOfService' ? 'Vilkår' : (viewName === 'privacyPolicy' ? 'Personvern' : 'Vilkår og personvern'));
        } catch (e) {
            titleEl.textContent = 'Vilkår og personvern';
        }
    }

    try {
        // Inline the loaded content to avoid a redundant local variable
        modalText.innerHTML = await ApiService.loadView(viewName);
        // Store focus and open modal with ARIA updates
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

// ---------------------------------------------------------------------------------------------------------------------
// ROUTER - Switches views based on the application state (store.currentView).

async function router()
{
    const root = document.getElementById('app-root');
    const view = store.currentView;

    console.log('[app.router] start - currentView=', view, 'root?', !!root);

    if (!root) return;

    // Clear root before loading new view to avoid ghost elements
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
            // Create and append the custom element instead of injecting HTML string
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
            // Use a custom element to load the child profile manager controller
            const childProfilesEl = document.createElement('child-profiles');
            root.appendChild(childProfilesEl);
            break;
        case 'childLogin':
            // Use child login controller (merged into childController)
            try {
                console.log('[app.router] rendering childLogin');
                const { childController } = await import('./modules/controllers/child_controller.mjs');
                // childController exposes an init(root) method; call it to initialize child login
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
                    // Graceful fallback: show notFound view to indicate missing controller
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
            // Use the moodUIController to initialize the insights view
            try {
                await moodUIController.initInsights(root);
            } catch (e) {
                console.error('insights init failed', e);
                root.innerHTML = await ApiService.loadView('notFound');
            }
            break;
        default:
            // Load the 404 view from views/notFound.html to keep UI in HTML files
            root.innerHTML = await ApiService.loadView('notFound');
    }

    // After the view is rendered, apply translations to the new DOM
    try {
        if (store && typeof store.applyTranslations === 'function') {
            console.log('[app.router] applying translations for view', view);
            store.applyTranslations(root);
        }
    } catch (e) {
        console.warn('applyTranslations after router failed', e);
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// Setup global listeners for the Modal and Store changes

const setupEventListeners = () =>
{
    console.log('[app] setupEventListeners start');
    const modal = document.getElementById('legal-modal');

    // Dynamically build language switcher from a simple JSON file to keep languages in one place
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

                    // Determine currently selected language to mark active button
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

                    // Wire the generated buttons with the existing language logic
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

    // Close modal logic
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

    // Handle global footer links (if they exist in index.html)
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
        // NotFound navigation helpers
        if (e.target && e.target.id === 'back-to-child-checkin') {
            e.preventDefault();
            // show the child mood check-in flow
            store.currentView = 'childMenu';
        }
        if (e.target && e.target.id === 'back-to-parent-menu') {
            e.preventDefault();
            store.currentView = 'parentMenu';
        }
    });

    // Watch for view changes in the Store
    store.onChange('currentView', () => router());

    console.log('[app] setupEventListeners end');
};

// ---------------------------------------------------------------------------------------------------------------------
// Custom Element for User Management (MVC encapsulation)

if (!customElements.get('user-manager'))
{
    customElements.define('user-manager', class extends HTMLElement
    {
        constructor() {
            super();
            // Initialize asynchronously when element is created.
            (async () => {
                const { userUIController } = await import('./modules/controllers/userController.mjs');
                await userUIController.init(this);
            })();
        }
    });
}

// Custom Element for Child Profiles
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

// ---------------------------------------------------------------------------------------------------------------------
// Initialization helpers

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

// ---------------------------------------------------------------------------------------------------------------------
// Move small runtime helpers from index.html into this module so HTML contains only markup.
// Language flags are managed from `client/assets/flags/flags.json` and generated at runtime.

// Auto-set API base for local development when served from localhost.
if (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    // Point to the Express server origin (no '/api' suffix) used by the /server app
    window.__API_BASE__ = `${location.protocol}//${location.hostname}:3000`;
}


// ---------------------------------------------------------------------------------------------------------------------
// Initialization

document.addEventListener('DOMContentLoaded', async () =>
{
    console.log('[app] DOMContentLoaded start');
    setupEventListeners();

    // Load translations early so controllers can use store.t immediately
    await ensureI18n();
    console.log('[app] ensureI18n complete, i18n._lang=', store.i18n && store.i18n._lang);

    // Mark active language button if one exists (ensure lang buttons reflect loaded locale)
    try {
        const activeLang = (store && store.i18n && store.i18n._lang) ? store.i18n._lang : (navigator && (navigator.language || navigator.userLanguage) ? navigator.language.split('-')[0] : null);
        if (activeLang) {
            const btns = document.querySelectorAll('#lang-switcher .lang-btn');
            btns.forEach(b => {
                const isActive = b.getAttribute('data-lang') === activeLang;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        }
    } catch (e) {
        // Non-fatal
    }

    // Apply translations to static parts (index.html) and current root (if any)
    try {
        try { store.applyTranslations(document); } catch(_){}
        const root = document.getElementById('app-root');
        if (root) try { store.applyTranslations(root); } catch(_){}
    } catch (e) { console.warn('applyTranslations initial failed', e); }

    // Try to initialize service worker setup (best-effort). Importing executes the setup file.
    try {
        await import('./serviceWorkerSetup.mjs');
    } catch (err) {
        // Non-fatal in many dev environments (e.g., IDE preview); keep it quiet.
        console.debug('Service worker setup import failed (dev environment?)', err);
    }

    // Decide and set the initial view in a single, explicit place.
    // Always determine the most appropriate initial view after any session restoration
    try {
        const intended = determineInitialView();
        console.log('[app] determineInitialView ->', intended, 'store.currentView=', store.currentView);
        if (intended !== store.currentView) store.currentView = intended;
    } catch (e) {
        // Fallback: if determineInitialView fails, ensure router runs once with currentView
        console.warn('determineInitialView failed, rendering current view', e);
    }
    // Render the initial view
    await router();

    console.debug('[app] initial view set to', store.currentView);
});

