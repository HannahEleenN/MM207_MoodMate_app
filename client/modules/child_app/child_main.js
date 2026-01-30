"use strict";

// =====================================================================================================================
// TASK 1: Initialize the child app, attach event listeners, and handle offline storage.
// =====================================================================================================================

console.log("MoodMate client scaffold running");

export function initChildApp(container)
{
    container.innerHTML = `
        <section id="child-menu">
            <h2>Hei på deg! 🌟</h2>
            <p>Hvordan føler du deg akkurat nå?</p>
            
            <div class="mood-options">
                <button class="mood-btn" data-mood="glad">😊 Glad</button>
                <button class="mood-btn" data-mood="lei">😢 Lei meg</button>
                <button class="mood-btn" data-mood="sint">😡 Sint</button>
                <button class="mood-btn" data-mood="redd">😨 Redd</button>
                <button class="mood-btn" data-mood="rolig">😌 Rolig</button>
                <button class="mood-btn" data-mood="overrasket">😲 Overrasket</button>
            </div>
        </section>
    `;

    // Logic for mood buttons
    const buttons = container.querySelectorAll('.mood-btn');
    buttons.forEach(btn => {
        btn.onclick = () => {
            const mood = btn.getAttribute('data-mood');
            alert("Du valgte: " + mood);
            // TODO: Call on mood_checkin_view.js here to start mood logging flow
        };
    });
}