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
        this.container.innerHTML = await ApiService.loadView('mood_checkin');
        this.resetFlow();
        try { await this._maybeRestoreDraft(); } catch (e) { console.debug('Draft restore check failed', e); }
        this.setupEventListeners();
    },

    async initLogin(container)
    {
        this.container = container;
        this.container.innerHTML = await ApiService.loadView('child_login');

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
                { id: 'friends', labelKey: 'reason.friends' },
                { id: 'family', labelKey: 'reason.family' },
                { id: 'sunny', labelKey: 'reason.sunny' },
                { id: 'play', labelKey: 'reason.play' },
                { id: 'achievement', labelKey: 'reason.achievement' },
                { id: 'gift', labelKey: 'reason.gift' }
            ],
            solutions: [
                { id: 'dance', labelKey: 'solution.dance' },
                { id: 'sing', labelKey: 'solution.sing' },
                { id: 'draw', labelKey: 'solution.draw' },
                { id: 'play', labelKey: 'solution.play' },
                { id: 'share', labelKey: 'solution.share' },
                { id: 'celebrate', labelKey: 'solution.celebrate' }
            ]
        },
        scared:
        {
            reasons: [
                { id: 'dark', labelKey: 'reason.dark' },
                { id: 'dentist', labelKey: 'reason.dentist' },
                { id: 'scary', labelKey: 'reason.scary' },
                { id: 'alone', labelKey: 'reason.alone' },
                { id: 'loud', labelKey: 'reason.loud' },
                { id: 'newplace', labelKey: 'reason.newplace' }
            ],
            solutions: [
                { id: 'talk', labelKey: 'solution.talk' },
                { id: 'lap', labelKey: 'solution.lap' },
                { id: 'thinkNice', labelKey: 'solution.thinkNice' },
                { id: 'light', labelKey: 'solution.light' },
                { id: 'music', labelKey: 'solution.music' },
                { id: 'breathe', labelKey: 'solution.breathe' }
            ]
        },
        angry:
        {
            reasons: [
                { id: 'unfair', labelKey: 'reason.unfair' },
                { id: 'lost', labelKey: 'reason.lost' },
                { id: 'argue', labelKey: 'reason.argue' },
                { id: 'notlistened', labelKey: 'reason.notlistened' },
                { id: 'tired', labelKey: 'reason.tired' },
                { id: 'interrupted', labelKey: 'reason.interrupted' }
            ],
            solutions: [
                { id: 'pillow', labelKey: 'solution.pillow' },
                { id: 'draw', labelKey: 'solution.draw' },
                { id: 'walk', labelKey: 'solution.walk' },
                { id: 'breathe', labelKey: 'solution.breathe' },
                { id: 'talk', labelKey: 'solution.talk' },
                { id: 'water', labelKey: 'solution.water' }
            ]
        },
        sad:
        {
            reasons: [
                { id: 'missing', labelKey: 'reason.missing' },
                { id: 'school', labelKey: 'reason.school' },
                { id: 'friends', labelKey: 'reason.friends' },
                { id: 'lonely', labelKey: 'reason.lonely' },
                { id: 'failed', labelKey: 'reason.failed' },
                { id: 'sickness', labelKey: 'reason.sickness' }
            ],
            solutions: [
                { id: 'talk', labelKey: 'solution.talk' },
                { id: 'hug', labelKey: 'solution.hug' },
                { id: 'draw', labelKey: 'solution.draw' },
                { id: 'nature', labelKey: 'solution.nature' },
                { id: 'comfort', labelKey: 'solution.comfort' },
                { id: 'music', labelKey: 'solution.music' }
            ]
        },
        calm:
        {
            reasons: [
                { id: 'read', labelKey: 'reason.read' },
                { id: 'nature', labelKey: 'reason.nature' },
                { id: 'family', labelKey: 'reason.family' },
                { id: 'music', labelKey: 'reason.music' },
                { id: 'rest', labelKey: 'reason.rest' },
                { id: 'pettime', labelKey: 'reason.pettime' }
            ],
            solutions: [
                { id: 'music', labelKey: 'solution.music' },
                { id: 'breathe', labelKey: 'solution.breathe' },
                { id: 'draw', labelKey: 'solution.draw' },
                { id: 'read', labelKey: 'solution.read' },
                { id: 'stretch', labelKey: 'solution.stretch' },
                { id: 'tea', labelKey: 'solution.tea' }
            ]
        },
        surprised:
        {
            reasons: [
                { id: 'gift', labelKey: 'reason.gift' },
                { id: 'news', labelKey: 'reason.news' },
                { id: 'school', labelKey: 'reason.school' },
                { id: 'unexpected', labelKey: 'reason.unexpected' },
                { id: 'visitor', labelKey: 'reason.visitor' },
                { id: 'achievement', labelKey: 'reason.achievement' }
            ],
            solutions: [
                { id: 'share', labelKey: 'solution.share' },
                { id: 'celebrate', labelKey: 'solution.celebrate' },
                { id: 'dance', labelKey: 'solution.dance' },
                { id: 'talk', labelKey: 'solution.talk' },
                { id: 'hug', labelKey: 'solution.hug' },
                { id: 'draw', labelKey: 'solution.draw' }
            ]
        }
    },

    moodTextual:
    {
        happy: [
            'text.happy.0','text.happy.1','text.happy.2','text.happy.3','text.happy.4','text.happy.5','text.happy.6','text.happy.7'
        ],
        sad: [
            'text.sad.0','text.sad.1','text.sad.2','text.sad.3','text.sad.4','text.sad.5','text.sad.6'
        ],
        angry: [
            'text.angry.0','text.angry.1','text.angry.2','text.angry.3','text.angry.4'
        ],
        surprised: [
            'text.surprised.0','text.surprised.1','text.surprised.2','text.surprised.3','text.surprised.4','text.surprised.5'
        ],
        scared: [
            'text.scared.0','text.scared.1','text.scared.2','text.scared.3','text.scared.4','text.scared.5','text.scared.6'
        ]
    },

    setupEventListeners()
    {
        const c = this.container;

        c.querySelectorAll('.mood-btn').forEach(btn => {
            btn.onclick = () => this.handleMoodSelection(btn.dataset.mood);
        });

        const reasonsList = c.querySelector('#reasons-text');
        if (reasonsList)
        {
            reasonsList.addEventListener('click', (e) =>
            {
                const li = e.target.closest('.reason-item');
                if (!li) return;
                reasonsList.querySelectorAll('.reason-item').forEach(n => n.classList.remove('selected'));
                li.classList.add('selected');
                this.handleContextSelection(li.textContent);
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

        const solutionGrid = c.querySelector('#step-3-solutions');
        if (solutionGrid)
        {
            solutionGrid.addEventListener('click', (e) =>
            {
                const btn = e.target.closest('button');
                if (!btn) return;
                const solution = btn.dataset.solution;
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
        
        const prevBtn2 = c.querySelector('#btn-prev-step-2');
        if (prevBtn2) prevBtn2.onclick = () => this.goToStep(1);
        
        const prevBtn3 = c.querySelector('#btn-prev-step-3');
        if (prevBtn3) prevBtn3.onclick = () => this.goToStep(2);

        const finishBtn = c.querySelector('#btn-finish');
        if (finishBtn) finishBtn.onclick = () => this.saveFinalMood();

        const commentEl = c.querySelector('#mood-context-text');
        if (commentEl)
        {
            commentEl.addEventListener('input', () => {
                this._persistDraft();
            });
        }

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
        this._persistDraft();

        const display = this.container.querySelector('#selected-mood-text');
        if (display) display.textContent = (store && store.t) ? (store.t(`mood.${mood}`) || mood) : mood;

        const reasonsContainer = this.container.querySelector('#reasons-text');
        const map = this.moodMap[mood] || { reasons: [], solutions: [] };

        if (reasonsContainer)
        {
            reasonsContainer.innerHTML = '';

            const ul = document.createElement('ul');
            ul.className = 'reasons-list';

            map.reasons.forEach(r =>
            {
                const li = document.createElement('li');
                li.tabIndex = 0;
                li.className = 'reason-item';
                const labelKey = r.labelKey || (r.id ? `reason.${r.id}` : null);
                const displayed = (store && store.t && labelKey) ? store.t(labelKey) : (r.label || r.id || r);
                li.dataset.context = displayed;
                li.textContent = displayed;
                ul.appendChild(li);
            });

            reasonsContainer.appendChild(ul);
        }

        const solutionsGrid = this.container.querySelector('#step-3-solutions');
        if (solutionsGrid)
        {
            solutionsGrid.innerHTML = '';
            map.solutions.forEach(s =>
            {
                const b = document.createElement('button');
                b.className = 'solution-btn';
                b.dataset.solution = s.id;
                const solLabelKey = s.labelKey || (s.id ? `solution.${s.id}` : null);
                b.textContent = (store && store.t && solLabelKey) ? store.t(solLabelKey) : (s.label || s.id || '');
                solutionsGrid.appendChild(b);
            });
        }


        this.goToStep(2);
    },

    handleContextSelection(context)
    {
        if (!context) return;
        this.model.temporaryContext = context;
        this._persistDraft();

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
        this._persistDraft();
    },

    goToStep(stepNumber)
    {
        this.container.querySelectorAll('.step-container').forEach(el => {
            el.hidden = true;
        });

        const currentStepEl = this.container.querySelector(`#step-${stepNumber}`);
        if (currentStepEl) {
            currentStepEl.hidden = false;
        }

        const progressValues = { 1: 33, 2: 66, 3: 100 };
        const progressEl = this.container.querySelector('#checkin-progress');
        if (progressEl)
        {
            progressEl.value = progressValues[stepNumber] || 33;
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
            if (found) {
                const solLabelKey = found.labelKey || (found.id ? `solution.${found.id}` : null);
                data.solutionLabel = (store && store.t && solLabelKey) ? store.t(solLabelKey) : (found.label || found.id || null);
            }
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

            try { await this._clearDraft(); } catch (e) { console.debug('Failed to clear draft after save', e); }

            if (data.solutionLabel)
            {
                const el = document.getElementById('global-notice');
                if (el)
                {
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
    },

    // ------------------------------------------------------------------

    _getLocalDraftKey()
    {
        return 'moodmate_draft_v1';
    },

    _loadLocalDraft()
    {
        try
        {
            const raw = localStorage.getItem(this._getLocalDraftKey());
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) { return null; }
    },

    _saveLocalDraft(draft)
    {
        try { localStorage.setItem(this._getLocalDraftKey(), JSON.stringify(draft)); } catch (e) { console.debug('Local draft save failed', e); }
    },

    _clearLocalDraft()
    {
        try { localStorage.removeItem(this._getLocalDraftKey()); } catch (e) { }
    },

    _persistDraft()
    {
        try
        {
            const draft =
            {
                mood: this.model.temporaryMoodSelection || null,
                context: this.model.temporaryContext || null,
                solution: this.model.temporarySolutionSelection || null,
                note: (this.container && this.container.querySelector('#mood-context-text')) ? (this.container.querySelector('#mood-context-text').value || '') : '',
                timestamp: new Date().toISOString(),
                profileId: store.currentChild ? store.currentChild.id : null
            };

            store.draftMood = draft;

            this._saveLocalDraft(draft);

            if (draft.profileId && navigator.onLine)
            {
                if (this._draftSyncTimer) clearTimeout(this._draftSyncTimer);
                this._draftSyncTimer = setTimeout(async () =>
                {
                    try {
                        await ApiService.saveDraft(draft, draft.profileId);
                    } catch (e) { console.debug('Server draft sync failed', e); }
                }, 800);
            }
        } catch (e) { console.debug('Persist draft failed', e); }
    },

    async _maybeRestoreDraft()
    {
        try
        {
            const profileId = store.currentChild ? store.currentChild.id : null;
            if (profileId && navigator.onLine)
            {
                const serverDraft = await ApiService.getDraft(profileId);
                if (serverDraft && serverDraft.mood)
                {
                    const msg = (store && store.t) ? (store.t('checkin.restoreDraft') || 'Restore unfinished mood entry?') : 'Restore unfinished mood entry?';
                    if (confirm(msg)) {
                        this._applyMoodDraftToModel(serverDraft);
                        return;
                    }
                }
            }

            const local = this._loadLocalDraft();
            if (local && (local.mood || local.context || local.solution || local.note))
            {
                const msg = (store && store.t) ? (store.t('checkin.restoreDraftLocal') || 'Restore unfinished mood entry from this device?') : 'Restore unfinished mood entry from this device?';
                if (confirm(msg)) {
                    this._applyMoodDraftToModel(local);
                }
            }
        } catch (e) { console.debug('maybeRestoreDraft failed', e); }
    },

    _applyMoodDraftToModel(draft)
    {
        try
        {
            if (!draft) return;
            this.model.temporaryMoodSelection = draft.mood || null;
            this.model.temporaryContext = draft.context || null;
            this.model.temporarySolutionSelection = draft.solution || null;
            try { const el = this.container.querySelector('#mood-context-text'); if (el) el.value = draft.note || ''; } catch (_) {}
            store.draftMood = draft;

            if (draft.solution) {
                this.goToStep(3);
            } else if (draft.context) {
                this.goToStep(2);
            } else if (draft.mood) {
                this.goToStep(2);
            } else {
                this.goToStep(1);
            }
        } catch (e) { console.debug('applyDraft failed', e); }
    },

    async _clearDraft()
    {
        try { this._clearLocalDraft(); } catch (_) {}
        try { delete store.draftMood; } catch(_) {}
        const profileId = store.currentChild ? store.currentChild.id : null;
        if (profileId && navigator.onLine) {
            try { await ApiService.deleteDraft(profileId); } catch (e) { console.debug('deleteDraft failed', e); }
        }
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export async function initChildApp(container, model) {
    return childController.init(container, model);
}