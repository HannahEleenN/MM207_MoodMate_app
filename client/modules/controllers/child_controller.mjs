import { store } from '../singleton.mjs';
import { ApiService } from '../api.mjs';
import { moodUIController } from './mood_ui_controller.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export const childController =
{
    async init(container, model = store)
    {
        this.container = container;
        this.model = model;
        this.container.innerHTML = await ApiService.loadView('moodCheckin');
        this.resetFlow();
        this.setupEventListeners();
    },

    async initLogin(container)
    {
        this.container = container;
        this.container.innerHTML = await ApiService.loadView('childLogin');

        const form = this.container.querySelector('#childLoginForm');
        const backBtn = this.container.querySelector('#back-to-parent');

        if (form)
        {
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
                        store.currentChild = { id: String(res.child.id), name: res.child.name };
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

        if (backBtn)
        {
            backBtn.onclick = (e) =>
            {
                e.preventDefault();
                store.currentView = 'login';
            };
        }
    },

    moodMap:
    {
        happy:
        {
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
        scared:
        {
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
        angry:
        {
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
        sad:
        {
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
        calm:
        {
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
        surprised:
        {
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

    moodTextual:
    {
        happy: [
            'text.glad.0','text.glad.1','text.glad.2','text.glad.3','text.glad.4','text.glad.5','text.glad.6','text.glad.7'
        ],
        sad: [
            'text.lei.0','text.lei.1','text.lei.2','text.lei.3','text.lei.4','text.lei.5','text.lei.6'
        ],
        angry: [
            'text.sint.0','text.sint.1','text.sint.2','text.sint.3','text.sint.4'
        ],
        surprised: [
            'text.overrasket.0','text.overrasket.1','text.overrasket.2','text.overrasket.3','text.overrasket.4','text.overrasket.5'
        ],
        scared: [
            'text.redd.0','text.redd.1','text.redd.2','text.redd.3','text.redd.4','text.redd.5','text.redd.6'
        ]
    },

    setupEventListeners()
    {
        const c = this.container;

        c.querySelectorAll('.mood-btn').forEach(btn => {
            btn.onclick = () => this.handleMoodSelection(btn.dataset.mood);
        });

        const reasonGrid = c.querySelector('#step-2 .mood-grid');
        if (reasonGrid)
        {
            reasonGrid.addEventListener('click', (e) =>
            {
                const btn = e.target.closest('button');
                if (!btn) return;
                const ctx = btn.dataset.context;
                if (ctx) this.handleContextSelection(ctx);
            });
        }

        const solutionGrid = c.querySelector('#step-3 .mood-grid');
        if (solutionGrid)
        {
            solutionGrid.addEventListener('click', (e) =>
            {
                const btn = e.target.closest('button');
                if (!btn) return;
                const solution = btn.dataset.sol;
                if (solution)
                {
                    solutionGrid.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    this.handleSolutionSelection(solution);
                }
            });
        }

        const nextBtn = c.querySelector('#btn-next-step');
        if (nextBtn) nextBtn.onclick = () => this.goToStep(3);
        const finishBtn = c.querySelector('#btn-finish');
        if (finishBtn) finishBtn.onclick = () => this.saveFinalMood();

        c.querySelectorAll('.back-btn').forEach(btn =>
        {
            btn.onclick = () =>
            {
                const prevStep = Number(btn.dataset.toStep);
                this.goToStep(prevStep);
            };
        });
    },

    handleMoodSelection(mood)
    {
        if (!mood) return;
        this.model.temporaryMoodSelection = mood;

        const display = this.container.querySelector('#selected-mood-text');
        if (display) display.textContent = mood;

        const reasonsContainer = this.container.querySelector('#reasons-text');
        const map = this.moodMap[mood] || { reasons: [], solutions: [] };
        if (reasonsContainer)
        {
            reasonsContainer.innerHTML = '';

            const intro = document.createElement('p');
            intro.className = 'reasons-intro';

            const strong = document.createElement('strong');
            strong.textContent = (store && store.t) ? store.t('checkin.instructions') : 'Use words';
            intro.appendChild(strong);
            reasonsContainer.appendChild(intro);

            const ul = document.createElement('ul');
            ul.className = 'reasons-list';

            const textual = (this.moodTextual && this.moodTextual[mood]) ? this.moodTextual[mood] : null;

            if (textual && Array.isArray(textual) && textual.length > 0)
            {
                textual.forEach((text, idx) =>
                {
                    const li = document.createElement('li');
                    li.tabIndex = 0;
                    li.className = 'reason-item';
                    li.dataset.context = `text-${mood}-${idx}`;
                    li.textContent = text;
                    ul.appendChild(li);
                });
            } else
            {
                map.reasons.forEach(r =>
                {
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

        const solutionsGrid = this.container.querySelector('#step-3 .mood-grid');
        if (solutionsGrid)
        {
            solutionsGrid.innerHTML = '';
            map.solutions.forEach(s =>
            {
                const b = document.createElement('button');
                b.className = 'sol-btn';
                b.dataset.sol = s.id;
                b.textContent = s.label;
                solutionsGrid.appendChild(b);
            });
        }

        const reasonsList = this.container.querySelector('.reasons-list');
        if (reasonsList)
        {
            reasonsList.addEventListener('click', (e) =>
            {
                const li = e.target.closest('.reason-item');
                if (!li) return;
                this.model.temporaryContext = li.textContent;
                reasonsList.querySelectorAll('.reason-item').forEach(n => n.classList.remove('selected'));
                li.classList.add('selected');
            });

            reasonsList.addEventListener('keydown', (e) =>
            {
                if (e.key === 'Enter')
                {
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
        this.model.temporaryContext = context;

        const mood = this.model.temporaryMoodSelection;
        const map = this.moodMap[mood] || { solutions: [] };

        if (map.solutions && map.solutions.length === 1) {
            this.model.temporarySolutionSelection = map.solutions[0].id;
        }
        this.goToStep(3);
    },

    handleSolutionSelection(solution)
    {
        if (!solution) return;
        this.model.temporarySolutionSelection = solution;
    },

    goToStep(stepNumber)
    {
        this.container.querySelectorAll('.step-container').forEach(el => {
            el.classList.remove('active');
        });

        const currentStepEl = this.container.querySelector(`#step-${stepNumber}`);
        if (currentStepEl) {
            currentStepEl.classList.add('active');
        }

        const bar = this.container.querySelector('#mood-progress');
        if (bar)
        {
            const progressClassMap = { 1: 'progress-33', 2: 'progress-66', 3: 'progress-100' };
            bar.classList.remove('progress-33','progress-66','progress-100');
            const cls = progressClassMap[stepNumber];
            if (cls) bar.classList.add(cls);
        }
    },

    resetFlow()
    {
        this.model.temporaryMoodSelection = null;
        this.model.temporaryContext = null;
        this.goToStep(1);
    },

    async saveFinalMood()
    {
        const commentEl = this.container.querySelector('#mood-context-text');

        const data =
        {
            mood: this.model.temporaryMoodSelection,
            context: this.model.temporaryContext,
            solution: this.model.temporarySolutionSelection || null,
            solutionLabel: null,
            note: commentEl ? commentEl.value : "",
            timestamp: new Date().toISOString(),
            profileId: store.currentChild ? store.currentChild.id : null
        };

        try
        {
            const mood = this.model.temporaryMoodSelection;
            const map = this.moodMap[mood] || { solutions: [] };
            const found = map.solutions.find(s => s.id === this.model.temporarySolutionSelection);
            if (found) data.solutionLabel = found.label;
        } catch (e) {
            console.error('Error finding solution label:', e);
        }

        if (!data.profileId)
        {
            this.showNotice('child.selectPrompt');
            store.currentView = 'parentMenu';
            return;
        }

        try
        {
            await moodUIController.saveMood(data);

            if (data.solutionLabel)
            {
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

            store.currentView = 'parentMenu';
        } catch (error) {
            console.error('Save failed:', error);
            this.showNotice('mood.saveFailed');
        }
    },

    showNotice(key)
    {
        const el = document.getElementById('global-notice');
        if (!el) return;
        el.textContent = store.t(key);
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 3000);
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export async function initChildApp(container, model) {
    return childController.init(container, model);
}