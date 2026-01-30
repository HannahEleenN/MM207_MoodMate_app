import { privacyPolicy, termsOfService } from './modules/legal_content.js';

// Elements
const consentBox = document.getElementById('consent-checkbox');
const registerBtn = document.getElementById('register-btn');
const modal = document.getElementById('legal-modal');
const modalText = document.getElementById('legal-text');

// Activate button only if checkbox is checked
consentBox.addEventListener('change', () => {
    registerBtn.disabled = !consentBox.checked;
});

// Show ToS/Privacy when clicked
document.getElementById('view-tos').onclick = () => {
    modalText.innerHTML = termsOfService;
    modal.style.display = 'block';
};

document.getElementById('view-privacy').onclick = () => {
    modalText.innerHTML = privacyPolicy;
    modal.style.display = 'block';
};

function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('no-NO');
}
