import { store } from '../singleton.mjs';
import { ApiService } from '../api.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// Controller for the Child Menu (mood logging flow for children).

export const childController =
{
    async init(container, model = store)
    {
        this.container = container;
        this.model = model;

        // Load view (HTML) into the container
        // Use the moodCheckin view which contains the step-1/step-2/step-3 flow
        this.container.innerHTML = await ApiService.loadView('moodCheckin');

        // Initialize state
        this.resetFlow();
        this.setupEventListeners();
    },

    // New: initialize the Child PIN login view (moved from child_login_controller.mjs)
    async initLogin(container)
    {
        this.container = container;
        this.container.innerHTML = await ApiService.loadView('childLogin');

        const form = this.container.querySelector('#childLoginForm');
        const backBtn = this.container.querySelector('#back-to-parent');

        if (form) {
            form.onsubmit = async (e) =>
            {
                e.preventDefault();
                const pinInput = this.container.querySelector('#child-pin-input');
                const pin = pinInput ? pinInput.value : '';
                try
                {
                    const res = await ApiService.childLogin({ pin });
                    if (res && res.child)
                    {
                        // Set currentChild in store and go to childMenu
                        store.currentChild = { id: String(res.child.id), name: res.child.name };
                        // Token handling removed per simplification - we do not store tokens client-side now
                        store.currentView = 'childMenu';
                    } else {
                        alert((store && store.t) ? store.t('login.incorrectPin') : 'Login failed');
                    }
                } catch (err) {
                    console.error('Child login failed', err);
                    alert((store && store.t) ? store.t('login.networkError') : 'Login failed');
                }
            };
        }

        if (backBtn) {
            backBtn.onclick = (e) =>
            {
                e.preventDefault();
                store.currentView = 'login';
            };
        }
    },

    // Map moods to context reasons and to suggested solutions
    moodMap: {
        glad: {
            reasons: [
                { id: 'venner', labelKey: 'reason.venner' },
                { id: 'familie', labelKey: 'reason.familie' },
                { id: 'sola', labelKey: 'reason.sola' }
            ],
            solutions: [
                { id: 'danse', labelKey: 'solution.danse' },
                { id: 'synge', labelKey: 'solution.synge' },
                { id: 'tegne', labelKey: 'solution.tegne' },
                { id: 'leke', labelKey: 'solution.leke' }
            ]
        },
        redd: {
            reasons: [
                { id: 'morket', labelKey: 'reason.morket' },
                { id: 'tannlegen', labelKey: 'reason.tannlegen' },
                { id: 'skummel', labelKey: 'reason.skummel' }
            ],
            solutions: [
                { id: 'snakke', labelKey: 'solution.snakke' },
                { id: 'fanget', labelKey: 'solution.fanget' },
                { id: 'fin-tanke', labelKey: 'solution.fin-tanke' }
            ]
        },
        sint: {
            reasons: [
                { id: 'urett', labelKey: 'reason.urett' },
                { id: 'tapt', labelKey: 'reason.tapt' },
                { id: 'krangel', labelKey: 'reason.krangel' }
            ],
            solutions: [
                { id: 'pute', labelKey: 'solution.pute' },
                { id: 'tegne', labelKey: 'solution.tegne' }
            ]
        },
        lei: {
            reasons: [
                { id: 'savnet', labelKey: 'reason.savnet' },
                { id: 'skole', labelKey: 'reason.skole' },
                { id: 'venner', labelKey: 'reason.venner' }
            ],
            solutions: [
                { id: 'snakke', labelKey: 'solution.snakke' },
                { id: 'klem', labelKey: 'solution.klem' },
                { id: 'tegne', labelKey: 'solution.tegne' }
            ]
        },
        rolig: {
            reasons: [
                { id: 'lese', labelKey: 'reason.lese' },
                { id: 'natur', labelKey: 'reason.natur' },
                { id: 'familie', labelKey: 'reason.familie' }
            ],
            solutions: [
                { id: 'musikk', labelKey: 'solution.musikk' },
                { id: 'puste', labelKey: 'solution.puste' },
                { id: 'tegne', labelKey: 'solution.tegne' }
            ]
        },
        overrasket: {
            reasons: [
                { id: 'gave', labelKey: 'reason.gave' },
                { id: 'nyhet', labelKey: 'reason.nyhet' },
                { id: 'skole', labelKey: 'reason.skole' }
            ],
            solutions: [
                { id: 'dele', labelKey: 'solution.dele' },
                { id: 'feire', labelKey: 'solution.feire' }
            ]
        }
    },

    // Human-readable full-sentence reasons used for the textual UI in step-2
    moodTextual: {
        glad: [
            'text.glad.0','text.glad.1','text.glad.2','text.glad.3','text.glad.4','text.glad.5','text.glad.6','text.glad.7'
        ],
        lei: [
            'text.lei.0','text.lei.1','text.lei.2','text.lei.3','text.lei.4','text.lei.5','text.lei.6'
        ],
        sint: [
            'text.sint.0','text.sint.1','text.sint.2','text.sint.3','text.sint.4'
        ],
        overrasket: [
            'text.overrasket.0','text.overrasket.1','text.overrasket.2','text.overrasket.3','text.overrasket.4','text.overrasket.5'
        ],
        redd: [
            'text.redd.0','text.redd.1','text.redd.2','text.redd.3','text.redd.4','text.redd.5','text.redd.6'
        ]
    },

    setupEventListeners()
    {
        const c = this.container;

        // Step 1: Mood buttons (static in HTML) – when clicked, render appropriate reasons
        c.querySelectorAll('.mood-btn').forEach(btn => {
            btn.onclick = () => this.handleMoodSelection(btn.dataset.mood);
        });

        // Use delegation for dynamic reason buttons inside step-2
        const reasonGrid = c.querySelector('#step-2 .mood-grid');
        if (reasonGrid) {
            reasonGrid.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const ctx = btn.dataset.context;
                if (ctx) this.handleContextSelection(ctx);
            });
        }

        // Use delegation for dynamic solution buttons inside step-3
        const solGrid = c.querySelector('#step-3 .mood-grid');
        if (solGrid) {
            solGrid.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const sol = btn.dataset.sol;
                if (sol) {
                    // mark selection visually
                    solGrid.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    this.handleSolutionSelection(sol);
                }
            });
        }

        // Step navigation buttons
        const nextBtn = c.querySelector('#btn-next-step');
        if (nextBtn) nextBtn.onclick = () => this.goToStep(3);
        const finishBtn = c.querySelector('#btn-finish');
        if (finishBtn) finishBtn.onclick = () => this.saveFinalMood();

        // Optional "Back" button logic (if present in the template)
        c.querySelectorAll('.back-btn').forEach(btn => {
            btn.onclick = () => {
                const prevStep = Number(btn.dataset.toStep);
                this.goToStep(prevStep);
            };
        });
    },

    handleMoodSelection(mood)
    {
        if (!mood) return;
        this.model.tempMood = mood;

        // Update text in the view (avoid HTML strings in JS)
        const display = this.container.querySelector('#selected-mood-text');
        if (display) display.textContent = mood;

        // Render textual reasons into #reasons-text
        const reasonsContainer = this.container.querySelector('#reasons-text');
        const map = this.moodMap[mood] || { reasons: [], solutions: [] };
        if (reasonsContainer) {
            reasonsContainer.innerHTML = '';

            // Headline & instruction
            const intro = document.createElement('p');
            intro.className = 'reasons-intro';
            // Use translation key for the instruction and avoid innerHTML
            const strong = document.createElement('strong');
            strong.textContent = (store && store.t) ? store.t('checkin.instructions') : 'Use words';
            intro.appendChild(strong);
            reasonsContainer.appendChild(intro);

            // Create an unordered list of reasons, each clickable
            const ul = document.createElement('ul');
            ul.className = 'reasons-list';

            // If the mood map has textual sentences, use them; otherwise fall back to map.reasons labels
            const textual = (this.moodTextual && this.moodTextual[mood]) ? this.moodTextual[mood] : null;

            if (textual && Array.isArray(textual) && textual.length > 0) {
                textual.forEach((text, idx) => {
                    const li = document.createElement('li');
                    li.tabIndex = 0;
                    li.className = 'reason-item';
                    li.dataset.context = `text-${mood}-${idx}`;
                    li.textContent = text;
                    ul.appendChild(li);
                });
            } else {
                // Fallback to short labels
                map.reasons.forEach(r => {
                    const li = document.createElement('li');
                    li.tabIndex = 0;
                    li.className = 'reason-item';
                    li.dataset.context = r.id || r.label || r;
                    li.textContent = r.label || r;
                    ul.appendChild(li);
                });
            }

            reasonsContainer.appendChild(ul);
        }

        // Pre-render solutions for step-3 (will be shown when user advances)
        const solGrid = this.container.querySelector('#step-3 .mood-grid');
        if (solGrid) {
            solGrid.innerHTML = '';
            map.solutions.forEach(s => {
                const b = document.createElement('button');
                b.className = 'sol-btn';
                b.dataset.sol = s.id;
                b.textContent = s.label;
                solGrid.appendChild(b);
            });
        }

        // Attach click listener for reasons (delegation)
        const reasonsList = this.container.querySelector('.reasons-list');
        if (reasonsList) {
            reasonsList.addEventListener('click', (e) => {
                const li = e.target.closest('.reason-item');
                if (!li) return;
                // Save the chosen context text
                this.model.tempContext = li.textContent;
                // Visual feedback
                reasonsList.querySelectorAll('.reason-item').forEach(n => n.classList.remove('selected'));
                li.classList.add('selected');
            });

            // Also handle keyboard selection (Enter)
            reasonsList.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const li = e.target.closest('.reason-item');
                    if (!li) return;
                    li.click();
                }
            });
        }

        this.goToStep(2);
    },

    handleContextSelection(context)
    {
        if (!context) return;
        this.model.tempContext = context;
        // If there is only one solution option, auto-select it (optional UX)
        const mood = this.model.tempMood;
        const map = this.moodMap[mood] || { solutions: [] };
        if (map.solutions && map.solutions.length === 1) {
            this.model.tempSolution = map.solutions[0].id;
        }
        this.goToStep(3);
    },

    // New: handle solution selection (e.g., 'klem' or 'snakke')
    handleSolutionSelection(solution)
    {
        if (!solution) return;
        this.model.tempSolution = solution;
        // Keep the user on step 3 so they can press 'Ferdig!'
    },

    goToStep(stepNumber)
    {
        // 1. Hide all steps (uses the .step-container class from your HTML)
        this.container.querySelectorAll('.step-container').forEach(el => {
            el.classList.remove('active');
        });

        // 2. Show the current step
        const currentStepEl = this.container.querySelector(`#step-${stepNumber}`);
        if (currentStepEl) {
            currentStepEl.classList.add('active');
        }

        // 3. Update the progress bar
        const bar = this.container.querySelector('#mood-progress');
        if (bar) {
            const progressClassMap = { 1: 'progress-33', 2: 'progress-66', 3: 'progress-100' };
            // Remove any existing progress classes then add the new one
            bar.classList.remove('progress-33','progress-66','progress-100');
            const cls = progressClassMap[stepNumber];
            if (cls) bar.classList.add(cls);
        }
    },

    resetFlow()
    {
        this.model.tempMood = null;
        this.model.tempContext = null;
        this.goToStep(1);
    },

    async saveFinalMood()
    {
        // Retrieve any text from the textarea if present
        const commentEl = this.container.querySelector('#mood-context-text');

        const data = {
            mood: this.model.tempMood,
            context: this.model.tempContext,
            solution: this.model.tempSolution || null,
            solutionLabel: null, // will set below if available
            note: commentEl ? commentEl.value : "",
            timestamp: new Date().toISOString(),
            profileId: store.currentChild ? store.currentChild.id : null
        };

        // Attach human-readable solution label if available (helps analysis/insights)
        try {
            const mood = this.model.tempMood;
            const map = this.moodMap[mood] || { solutions: [] };
            const found = map.solutions.find(s => s.id === this.model.tempSolution);
            if (found) data.solutionLabel = found.label;
        } catch (e) {
            // ignore
        }

        // Ensure a child profile is selected when saving
        if (!data.profileId) {
            this.showNotice('child.selectPrompt');
            store.currentView = 'parentMenu';
            return;
        }

        try {
            await ApiService.saveMood(data);
            // If there was a chosen solution label, show it in the notice (friendly confirmation)
            if (data.solutionLabel) {
                const el = document.getElementById('global-notice');
                if (el) {
                    el.textContent = `${store.t('mood.saved')} — ${data.solutionLabel}`;
                    el.classList.remove('hidden');
                    setTimeout(() => el.classList.add('hidden'), 4000);
                } else {
                    this.showNotice('mood.saved');
                }
            } else {
                this.showNotice('mood.saved');
            }

            this.resetFlow();
            // Navigate to parent menu or show confirmation via the router
            store.currentView = 'parentMenu';
        } catch (error) {
            console.error('Save failed:', error);
            this.showNotice('mood.saveFailed');
        }
    },

    // Localized notice helper
    showNotice(key)
    {
        const el = document.getElementById('global-notice');
        if (!el) return;
        el.textContent = store.t(key);
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 3000);
    }
}; // End of childController

// ---------------------------------------------------------------------------------------------------------------------

// Legacy wrapper
export async function initChildApp(container, model) {
    return childController.init(container, model);
}

// TODO: Place this code the right place.
/*
if (form)
{
    form.onsubmit = async (e) =>
    {
        e.preventDefault();
        const pinInput = this.container.querySelector('#child-pin-input');
        const pin = pinInput ? pinInput.value : '';
        try
        {
            // TODO: Review and improve child PIN authentication flow.
            // Current behavior: sends plain PIN to ApiService.childLogin({ pin }) and trusts response.
            // FIXME: Replace with a secure flow (e.g., short-lived tokens, rate-limiting, server-side checks,
            // and do NOT store plain PINs on client or server). Also add client-side validation and
            // helpful error messages. See issue: #TODO-FIX-CHILD-PIN for follow-up.
            const res = await ApiService.childLogin({ pin });
            if (res && res.child)
            {
                // Set currentChild in store and go to childMenu
                store.currentChild = { id: String(res.child.id), name: res.child.name };
                // Token handling removed per simplification - we do not store tokens client-side now
                store.currentView = 'childMenu';
            } else {
                alert('Innlogging feilet');
            }
        } catch (err) {
            console.error('Child login failed', err);
            alert('Innlogging feilet');
        }
    };
}
*/