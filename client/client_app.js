import { privacyPolicy, termsOfService } from './modules/legal_content.js';
import { initParentApp } from './modules/parent_app/parent_main.js';
import { initChildApp } from './modules/child_app/child_main.js';
import './modules/parent_app/views/userManager.js';

// ---------------------------------------------------------------------------------------------------------------------

// Element references
const consentBox = document.getElementById('consent-checkbox');
const registerBtn = document.getElementById('register-btn');
const modal = document.getElementById('legal-modal');
const modalText = document.getElementById('legal-text');
const nickInput = document.getElementById('nick');
const secretInput = document.getElementById('secret');

// ---------------------------------------------------------------------------------------------------------------------

// Consent logic
// Activate the button only when the box is checked
consentBox.onchange = () =>
{
    const disabled = !consentBox.checked;
    registerBtn.disabled = disabled;
    registerBtn.setAttribute('aria-disabled', String(disabled));
};

// Modal logic (Show TOS or Privacy Policy documents)
document.getElementById('view-tos').onclick = (e) =>
{
    e.preventDefault(); // Hindrer siden i å hoppe til toppen
    modalText.innerHTML = termsOfService;
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    // Move focus into modal for accessibility
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) closeBtn.focus();
};

document.getElementById('view-privacy').onclick = (e) =>
{
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