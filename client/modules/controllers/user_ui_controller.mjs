import { universalFetch, store } from '../singleton.mjs';
import { ApiService } from '../api.mjs'; // Use loadView from here

export const userUIController =
{
    // Dependency Injection:
    // @param {HTMLElement} container - The element in index.html where we inject the view.

    async init(container)
    {
        // Fetch the HTML view file using the single fetch function
        // This keeps HTML out of your Javascript.
        const html = await ApiService.loadView('userManager');
        container.innerHTML = html;

        // Setup event listeners on the newly injected HTML
        const form = container.querySelector("#regForm");
        const list = container.querySelector("#user-list");

        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const formData = Object.fromEntries(new FormData(form));
                await this.handleRegister(formData);
            };
        }

        // Initial render of users from the store (Model)
        this.renderUserList(list);
    },

    async handleRegister(formData)
    {
        try {
            // UI Feedback: Disable button
            const btn = document.querySelector(".btn-reg");
            if (btn) btn.disabled = true;

            const result = await universalFetch('/api/users/register', {
                method: 'POST',
                body: JSON.stringify({ ...formData, hasConsented: true })
            });

            if (result && result.user) {
                // Update the Proxy-state (Model)
                // This triggers the 'stateChanged' event in your app
                store.users = [...store.users, result.user];
                store.currentUser = result.user;
                alert("Bruker registrert!");
            }
        } catch (error) {
            console.error("Registration failed:", error);
            alert("Kunne ikke registrere bruker.");
        } finally {
            const btn = document.querySelector(".btn-reg");
            if (btn) btn.disabled = false;
        }
    },

    renderUserList(listElement)
    {
        if (!listElement) return;
        // Map data from the store to HTML strings
        listElement.innerHTML = store.users.map(user => `
            <li>
                <span>${user.nick}</span>
                <button class="btn-del" data-id="${user.id}">Slett</button>
            </li>
        `).join('');
    }
};