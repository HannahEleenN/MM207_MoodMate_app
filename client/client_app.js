import { privacyPolicy, termsOfService } from './modules/legal_content.js';
import { initParentApp } from './modules/parent_app/parent_main.js';
import { initChildApp } from './modules/child_app/child_main.js';

// Element references
const consentBox = document.getElementById('consent-checkbox');
const registerBtn = document.getElementById('register-btn');
const modal = document.getElementById('legal-modal');
const modalText = document.getElementById('legal-text');
const nickInput = document.getElementById('nick');
const secretInput = document.getElementById('secret');

// Consent logic
// Activate the button only when the box is checked
consentBox.onchange = () => {
    const disabled = !consentBox.checked;
    registerBtn.disabled = disabled;
    registerBtn.setAttribute('aria-disabled', String(disabled));
};

// Registration logic (API-call)
registerBtn.onclick = async () =>
{
    const nick = nickInput.value;
    const secret = secretInput.value;

    try {
        const response = await fetch('/api/users',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nick,
                secret,
                hasConsented: true
            })
        });

        if (response.ok) {
            const userData = await response.json();
            // Use the returned userData for a clearer UX and for debugging
            console.log('Registered user:', userData);
            // Persist to localStorage so other views can read the current user
            try { localStorage.setItem('moodmateUser', JSON.stringify(userData)); } catch (e) { /* ignore storage errors */ }
            alert("Konto opprettet! Velkommen til MoodMate.");
            // Here I might want to redirect the user or hide the registration form:
            // document.getElementById('registration-form').style.display = 'none';
            loadView("parent");
        } else {
            const data = await response.json();
            alert("Feil: " + data.error);
        }
    } catch (error) {
        console.error("Kunne ikke koble til serveren:", error);
        alert("En teknisk feil oppstod. Er serveren din startet?");
    }
};

// Modal logic (Show TOS or Privacy Policy documents)
document.getElementById('view-tos').onclick = (e) => {
    e.preventDefault(); // Hindrer siden i å hoppe til toppen
    modalText.innerHTML = termsOfService;
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    // Move focus into modal for accessibility
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) closeBtn.focus();
};

document.getElementById('view-privacy').onclick = (e) => {
    e.preventDefault();
    modalText.innerHTML = privacyPolicy;
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) closeBtn.focus();
};

document.getElementById('close-modal-btn').onclick = () => {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
};

// ---------------------------------------------------------------------------------------------------------------------

function loadView(viewName)
{
    const root = document.getElementById('app-root');
    root.innerHTML = '';

    if (viewName === 'parent') {
        initParentApp(root);
    } else if (viewName === 'child') {
        initChildApp(root);
    }
}
