import { privacyPolicy, termsOfService } from './modules/legal_content.js';

const modal = document.getElementById('legal-modal');
const modalText = document.getElementById('legal-text');

// Elements
const consentBox = document.getElementById('consent-checkbox');
const registerBtn = document.getElementById('register-btn');
const modal = document.getElementById('legal-modal');
const modalText = document.getElementById('legal-text');

// Open terms of service
document.getElementById('view-tos').onclick = (e) =>
{
    e.preventDefault();
    modalText.innerHTML = termsOfService;
    modal.style.display = 'block';
};

// Open privacy policy
document.getElementById('view-privacy').onclick = (e) =>
{
    e.preventDefault();
    modalText.innerHTML = privacyPolicy;
    modal.style.display = 'block';
};

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
