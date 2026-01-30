"use strict";

// =====================================================================================================================
// TASK 1: Initialize the parent dashboard app, fetch child logs, and show insights.
// =====================================================================================================================

export function initParentApp(container)
{
    container.innerHTML = `
        <section id="parent-dashboard">
            <h2>Foreldrekontroll</h2>
            <p>Velkommen! Her kan du administrere barnas profiler.</p>
            
            <div class="parent-actions">
                <button id="view-insights">Se humørtrender</button>
                <button id="manage-profiles">Administrer profiler</button>
                <button id="delete-account-btn" style="color: red; margin-top: 20px;">Slett min konto (GDPR)</button>
            </div>
        </section>
    `;

    // Logic for the buttons
    document.getElementById('view-insights').onclick = () => alert("Åpner innsikt...");

    document.getElementById('delete-account-btn').onclick = () => {
        if(confirm("Er du sikker? Dette sletter alle dine data permanent.")) {
            console.log("Sletter bruker...");
        }
    };
}