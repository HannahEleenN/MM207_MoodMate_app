import { ApiService } from "../api.mjs";

/**
 * Controller for the child's journey.
 * Handles both the main menu and the follow-up questions.
 */
export async function initChildApp(container, model)
{
    try {
        // --- STEP 1: Main Mood Menu ---
        const menuHtml = await ApiService.loadView('childMenu');
        container.innerHTML = menuHtml;

        const moodButtons = container.querySelectorAll('.mood-btn');
        moodButtons.forEach(btn => {
            btn.onclick = async () => {
                const selectedMood = btn.getAttribute('data-mood');
                model.currentMood = selectedMood; // Update the Proxy state

                // Move to the next part of the flow (Why & Solutions)
                await initMoodCheckinFlow(container, model);
            };
        });

    } catch (error) {
        console.error("Failed to initialize child view:", error);
        container.innerHTML = "<p>Beklager, kunne ikke laste menyen.</p>";
    }
}

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Internal function to handle the "Why" and "Solutions" steps
 */
async function initMoodCheckinFlow(container, model)
{
    const checkinHtml = await ApiService.loadView('moodCheckin');
    container.innerHTML = checkinHtml;

    // UI Update: Show what mood was selected
    const display = container.querySelector("#selected-mood-display");
    if (display) display.innerText = model.currentMood.toUpperCase();

    // Logic for Step 1: Reason (Context)
    const contextButtons = container.querySelectorAll('.context-btn');
    let selectedContext = "";

    contextButtons.forEach(btn => {
        btn.onclick = () => {
            selectedContext = btn.getAttribute('data-context');
            // Visual feedback: highlight selected
            contextButtons.forEach(b => b.style.border = "none");
            btn.style.border = "3px solid var(--primary-color, blue)";
        };
    });

    // Navigation: Go to Solutions
    container.querySelector("#next-to-solutions").onclick = () => {
        container.querySelector("#step-reason").style.display = "none";
        container.querySelector("#step-solutions").style.display = "block";
    };

    // Logic for Step 2: Finalize and Save
    container.querySelector("#finish-checkin").onclick = async () => {
        const finalData = {
            mood: model.currentMood,
            context: selectedContext || container.querySelector("#mood-context-text").value,
            timestamp: new Date().toISOString()
        };

        try {
            await ApiService.saveMood(finalData);
            alert("Så flink du er! Humøret ditt er lagret. ✨");

            // Redirect back to start via the model/router
            model.currentView = 'childMenu';
        } catch (err) {
            alert("Det skjedde en feil ved lagring.");
        }
    };
}