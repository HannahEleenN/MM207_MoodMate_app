import { privacyPolicy, termsOfService } from './modules/legal_content.js';

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
    registerBtn.disabled = !consentBox.checked;
};

// Registration logic (API-call)
registerBtn.onclick = async () =>
{
    const nick = nickInput.value;
    const secret = secretInput.value;

    try {
        const response = await fetch('/api/users/register',
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
            alert("Konto opprettet! Velkommen til MoodMate.");
            // Here I might want to redirect the user or hide the registration form:
            // document.getElementById('registration-form').style.display = 'none';
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
};

document.getElementById('view-privacy').onclick = (e) => {
    e.preventDefault();
    modalText.innerHTML = privacyPolicy;
    modal.style.display = 'block';
};

// Helper function
function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('no-NO');
}