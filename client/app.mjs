import { privacyPolicy, termsOfService } from './modules/legal_content.js';
import { initParentApp } from './modules/parent_main.js';
import { initChildApp } from './modules/child_main.js';
import './modules/views/userManager.mjs';

// ---------------------------------------------------------------------------------------------------------------------

// Element references
const consentBox = document.getElementById('consent-checkbox');
const registerBtn = document.getElementById('register-btn');
const modal = document.getElementById('legal-modal');
const modalText = document.getElementById('legal-text');

// ---------------------------------------------------------------------------------------------------------------------

// Consent logic
// Activate the button only when the box is checked
if (consentBox && registerBtn)
{
    consentBox.onchange = () =>
    {
        const disabled = !consentBox.checked;
        registerBtn.disabled = disabled;
        registerBtn.setAttribute('aria-disabled', String(disabled));
    };
}

// Modal logic (Show TOS or Privacy Policy documents)
const viewTos = document.getElementById('view-tos');
if (viewTos) {
    viewTos.onclick = (e) =>
    {
        e.preventDefault(); // Prevents the page from jumping to the top when the link is clicked
        modalText.innerHTML = termsOfService;
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        // Move focus into modal for accessibility
        const closeBtn = document.getElementById('close-modal-btn');
        if (closeBtn) closeBtn.focus();
    };
}

const viewPrivacy = document.getElementById('view-privacy');
if (viewPrivacy)
{
    viewPrivacy.onclick = (e) =>
    {
        e.preventDefault();
        modalText.innerHTML = privacyPolicy;
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        const closeBtn = document.getElementById('close-modal-btn');
        if (closeBtn) closeBtn.focus();
    };
}

const closeModalBtn = document.getElementById('close-modal-btn');
if (closeModalBtn)
{
    closeModalBtn.onclick = () => {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    };
}

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