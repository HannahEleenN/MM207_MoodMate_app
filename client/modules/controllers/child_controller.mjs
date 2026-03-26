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
                    const loginResponse = await ApiService.childLogin({ pin });
                    if (loginResponse && loginResponse.child)
                    {
                        store.currentChild = { id: String(loginResponse.child.id), name: loginResponse.child.name };
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
                { id: 'newPlace', labelKey: 'reason.newPlace' }
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
                { id: 'notListened', labelKey: 'reason.notListened' },
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
                { id: 'petTime', labelKey: 'reason.petTime' }
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


    setupEventListeners()
    {
        const container = this.container;

        container.querySelectorAll('.mood-btn').forEach(btn => {
            btn.onclick = () => this.handleMoodSelection(btn.dataset.mood);
        });

        const reasonsList = container.querySelector('#reasons-text');
        if (reasonsList)
        {
            reasonsList.addEventListener('click', (event) =>
            {
                const reasonItem = event.target.closest('.reason-item');
                if (!reasonItem) return;
                reasonsList.querySelectorAll('.reason-item').forEach(n => n.classList.remove('selected'));
                reasonItem.classList.add('selected');
                this.handleContextSelection(reasonItem.textContent);
            });

            reasonsList.addEventListener('keydown', (event) =>
            {
                if (event.key === 'Enter')
                {
                    const reasonItem = event.target.closest('.reason-item');
                    if (!reasonItem) return;
                    reasonItem.click();
                }
            });
        }

        const solutionGrid = container.querySelector('#step-3-solutions');
        if (solutionGrid)
        {
            solutionGrid.addEventListener('click', (event) =>
            {
                const solutionBtn = event.target.closest('button');
                if (!solutionBtn) return;
                const solution = solutionBtn.dataset.solution;
                if (solution)
                {
                    solutionGrid.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
                    solutionBtn.classList.add('selected');
                    this.handleSolutionSelection(solution);
                }
            });
        }

        const nextBtn = container.querySelector('#btn-next-step');
        if (nextBtn) nextBtn.onclick = () => this.navigateToStep(3);
        
        const prevBtn2 = container.querySelector('#btn-prev-step-2');
        if (prevBtn2) prevBtn2.onclick = () => this.navigateToStep(1);
        
        const prevBtn3 = container.querySelector('#btn-prev-step-3');
        if (prevBtn3) prevBtn3.onclick = () => this.navigateToStep(2);

        const finishBtn = container.querySelector('#btn-finish');
        if (finishBtn) finishBtn.onclick = () => this.saveFinalMood();

        const contextInput = container.querySelector('#mood-context-text');
        if (contextInput)
        {
            contextInput.addEventListener('input', () => {
                this._persistDraft();
            });
        }

        container.querySelectorAll('.back-btn').forEach(btn =>
        {
            btn.onclick = () =>
            {
                const prevStep = Number(btn.dataset.toStep);
                this.navigateToStep(prevStep);
            };
        });
    },

    handleMoodSelection(mood)
    {
        if (!mood) return;
        this.model.temporaryMoodSelection = mood;
        this._persistDraft();

        const moodDisplay = this.container.querySelector('#selected-mood-text');
        if (moodDisplay) {
            const moodLabel = (store && store.t) ? (store.t(`mood.${mood}`) || mood) : mood;
            // Remove emoji and trim, then convert first letter to lowercase
            const cleanLabel = moodLabel.replace(/^[^a-zA-Z0-9]+\s*/, '').trim();
            moodDisplay.textContent = cleanLabel.charAt(0).toLowerCase() + cleanLabel.slice(1);
        }

        const reasonsContainer = this.container.querySelector('#reasons-text');
        const moodData = this.moodMap[mood] || { reasons: [], solutions: [] };

        if (reasonsContainer)
        {
            reasonsContainer.innerHTML = '';
            const reasonsList = document.createElement('ul');
            reasonsList.className = 'reasons-list';

            moodData.reasons.forEach(reason =>
            {
                const reasonItem = document.createElement('li');
                reasonItem.tabIndex = 0;
                reasonItem.className = 'reason-item';
                const labelKey = reason.labelKey || (reason.id ? `reason.${reason.id}` : null);
                const displayText = (store && store.t && labelKey) ? store.t(labelKey) : (reason.label || reason.id || reason);
                reasonItem.dataset.context = displayText;
                reasonItem.textContent = displayText;
                reasonsList.appendChild(reasonItem);
            });

            reasonsContainer.appendChild(reasonsList);
        }

        const solutionsGrid = this.container.querySelector('#step-3-solutions');
        if (solutionsGrid)
        {
            solutionsGrid.innerHTML = '';
            moodData.solutions.forEach(solution =>
            {
                const solutionBtn = document.createElement('button');
                solutionBtn.className = 'solution-btn';
                solutionBtn.dataset.solution = solution.id;
                const solLabelKey = solution.labelKey || (solution.id ? `solution.${solution.id}` : null);
                solutionBtn.textContent = (store && store.t && solLabelKey) ? store.t(solLabelKey) : (solution.label || solution.id || '');
                solutionsGrid.appendChild(solutionBtn);
            });
        }

        this.navigateToStep(2);
    },

    handleContextSelection(context)
    {
        if (!context) return;
        this.model.temporaryContext = context;
        this._persistDraft();

        const mood = this.model.temporaryMoodSelection;
        const moodData = this.moodMap[mood] || { solutions: [] };

        if (moodData.solutions && moodData.solutions.length === 1) {
            this.model.temporarySolutionSelection = moodData.solutions[0].id;
        }
        this.navigateToStep(3);
    },

    handleSolutionSelection(solution)
    {
        if (!solution) return;
        this.model.temporarySolutionSelection = solution;
        this._persistDraft();
    },

    navigateToStep(stepNumber)
    {
        this.container.querySelectorAll('.step-container').forEach(step => {
            step.hidden = true;
        });

        const currentStep = this.container.querySelector(`#step-${stepNumber}`);
        if (currentStep) {
            currentStep.hidden = false;
        }

        const progressValues = { 1: 33, 2: 66, 3: 100 };
        const progressBar = this.container.querySelector('#checkin-progress');
        if (progressBar)
        {
            progressBar.value = progressValues[stepNumber] || 33;
        }
    },

    resetFlow()
    {
        this.model.temporaryMoodSelection = null;
        this.model.temporaryContext = null;
        this.navigateToStep(1);
    },

    async saveFinalMood()
    {
        const contextInput = this.container.querySelector('#mood-context-text');
        const solutionInput = this.container.querySelector('#solution-context-text');

        const moodData =
        {
            mood: this.model.temporaryMoodSelection,
            context: this.model.temporaryContext,
            customContext: contextInput && contextInput.value ? contextInput.value.trim() : null,
            solution: this.model.temporarySolutionSelection || null,
            customSolution: solutionInput && solutionInput.value ? solutionInput.value.trim() : null,
            note: contextInput ? contextInput.value : "",
            timestamp: new Date().toISOString(),
            profileId: store.currentChild ? store.currentChild.id : null
        };

        try
        {
            const mood = this.model.temporaryMoodSelection;
            const moodInfo = this.moodMap[mood] || { solutions: [] };
            const foundSolution = moodInfo.solutions.find(s => s.id === this.model.temporarySolutionSelection);
            if (foundSolution) {
                const solLabelKey = foundSolution.labelKey || (foundSolution.id ? `solution.${foundSolution.id}` : null);
                moodData.solutionLabel = (store && store.t && solLabelKey) ? store.t(solLabelKey) : (foundSolution.label || foundSolution.id || null);
            }
        } catch (e) {
            console.error('Error finding solution label:', e);
        }

        if (!moodData.profileId)
        {
            this.showNotice('child.selectPrompt');
            store.currentView = 'parentMenu';
            return;
        }

        try
        {
            await moodUIController.saveMood(moodData);

            try { await this._clearDraft(); } catch (e) { console.debug('Failed to clear draft after save', e); }

            if (moodData.solutionLabel)
            {
                const noticeElement = document.getElementById('global-notice');
                if (noticeElement)
                {
                    noticeElement.textContent = `${store.t('mood.saved')} — ${moodData.solutionLabel}`;
                    noticeElement.classList.remove('hidden');
                    setTimeout(() => noticeElement.classList.add('hidden'), 4000);
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

    showNotice(translationKey)
    {
        const noticeElement = document.getElementById('global-notice');
        if (!noticeElement) return;
        noticeElement.textContent = store.t(translationKey);
        noticeElement.classList.remove('hidden');
        setTimeout(() => noticeElement.classList.add('hidden'), 3000);
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
            const draftJson = localStorage.getItem(this._getLocalDraftKey());
            if (!draftJson) return null;
            return JSON.parse(draftJson);
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
                solutionNote: (this.container && this.container.querySelector('#solution-context-text')) ? (this.container.querySelector('#solution-context-text').value || '') : '',
                timestamp: new Date().toISOString(),
                profileId: store.currentChild ? store.currentChild.id : null
            };

            store.draftMood = draft;

            this._saveLocalDraft(draft);

            if (draft.profileId && navigator.onLine)
            {
                if (this._draftServerSyncTimer) clearTimeout(this._draftServerSyncTimer);
                this._draftServerSyncTimer = setTimeout(async () =>
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
                    const restoreMsg = (store && store.t) ? (store.t('checkin.restoreDraft') || 'Restore unfinished mood entry?') : 'Restore unfinished mood entry?';
                    if (confirm(restoreMsg)) {
                        this._applyMoodDraftToModel(serverDraft);
                        return;
                    }
                }
            }

            const localDraft = this._loadLocalDraft();
            if (localDraft && (localDraft.mood || localDraft.context || localDraft.solution || localDraft.note))
            {
                const restoreMsg = (store && store.t) ? (store.t('checkin.restoreDraftLocal') || 'Restore unfinished mood entry from this device?') : 'Restore unfinished mood entry from this device?';
                if (confirm(restoreMsg)) {
                    this._applyMoodDraftToModel(localDraft);
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
            try { 
                const contextInput = this.container.querySelector('#mood-context-text'); 
                if (contextInput) contextInput.value = draft.note || ''; 
            } catch (_) {}
            try { 
                const solutionInput = this.container.querySelector('#solution-context-text'); 
                if (solutionInput) solutionInput.value = draft.solutionNote || ''; 
            } catch (_) {}
            store.draftMood = draft;

            if (draft.solution) {
                this.navigateToStep(3);
            } else if (draft.context) {
                this.navigateToStep(2);
            } else if (draft.mood) {
                this.navigateToStep(2);
            } else {
                this.navigateToStep(1);
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