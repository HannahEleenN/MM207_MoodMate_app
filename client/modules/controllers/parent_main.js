"use strict";

// =====================================================================================================================
// TASK 1: Initialize the parent dashboard app, fetch child logs, and show insights.
// =====================================================================================================================

export function initParentApp(container)
{
    // Logic for the buttons
    document.getElementById('view-insights').onclick = () => alert("Åpner innsikt...");

    document.getElementById('delete-account-btn').onclick = () => {
        if(confirm("Er du sikker? Dette sletter alle dine data permanent.")) {
            console.log("Sletter bruker...");
        }
    };
}