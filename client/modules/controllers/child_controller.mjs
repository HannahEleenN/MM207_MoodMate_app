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
        this.container.innerHTML = await ApiService.loadView('childMenu');

        // Initialize state
        this.resetFlow();
        this.setupEventListeners();
    },

    setupEventListeners()
    {
        const c = this.container;

        // Step 1: Mood buttons
        c.querySelectorAll('.mood-btn').forEach(btn => {
            btn.onclick = () => this.handleMoodSelection(btn.dataset.mood);
        });

        // Step 2: Context buttons
        c.querySelectorAll('.context-btn').forEach(btn => {
            btn.onclick = () => this.handleContextSelection(btn.dataset.context);
        });

        // Step 3: Finish
        const saveBtn = c.querySelector('#save-mood-btn');
        if (saveBtn) {
            saveBtn.onclick = () => this.saveFinalMood();
        }

        // Optional "Back" button logic
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
        const display = this.container.querySelector('#display-mood');
        if (display) display.textContent = mood;

        this.goToStep(2);
    },

    handleContextSelection(context)
    {
        if (!context) return;
        this.model.tempContext = context;
        this.goToStep(3);
    },

    goToStep(stepNumber)
    {
        // 1. Hide all steps (uses the .step-container class from your HTML)
        this.container.querySelectorAll('.step-container').forEach(el => {
            el.style.display = 'none';
        });

        // 2. Show the current step
        const currentStepEl = this.container.querySelector(`#step-${stepNumber}`);
        if (currentStepEl) {
            currentStepEl.style.display = 'block';
        }

        // 3. Update the progress bar
        const bar = this.container.querySelector('#mood-progress');
        if (bar) {
            const progressMap = { 1: '33%', 2: '66%', 3: '100%' };
            bar.style.width = progressMap[stepNumber];
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
            note: commentEl ? commentEl.value : "",
            timestamp: new Date().toISOString(),
            profileId: store.currentChild ? store.currentChild.id : null
        };

        // Ensure a child profile is selected when saving
        if (!data.profileId) {
            this.showNotice('child.selectPrompt');
            store.currentView = 'parentMenu';
            return;
        }

        try {
            await ApiService.saveMood(data);
            this.showNotice('mood.saved');

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