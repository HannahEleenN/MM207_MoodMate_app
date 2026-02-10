"use strict";

// =====================================================================================================================
// TASK 1: Initialize the parent dashboard app, fetch child logs, and show insights.
// =====================================================================================================================

export function initParentApp(container)
{
    // If the container contains the view HTML, query inside it rather than document
    const viewRoot = container || document;

    // Logic for the buttons
    const viewInsightsBtn = viewRoot.querySelector('#view-insights');
    if (viewInsightsBtn) viewInsightsBtn.onclick = () => alert("Åpner innsikt...");

    const deleteBtn = viewRoot.querySelector('#delete-account-btn');
    if (deleteBtn) deleteBtn.onclick = () => {
        if(confirm("Er du sikker? Dette sletter alle dine data permanent.")) {
            console.log("Sletter bruker...");
        }
    };
}