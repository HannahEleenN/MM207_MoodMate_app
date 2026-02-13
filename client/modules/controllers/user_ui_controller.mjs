import { universalFetch, store } from '../singleton.mjs';
import { ApiService } from '../api.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export const userUIController =
{
    async init(container)
    {
        container.innerHTML = await ApiService.loadView('userManager');

        const form = container.querySelector("#regForm");
        const list = container.querySelector("#user-list");

        if (form) {
            form.onsubmit = async (e) =>
            {
                e.preventDefault();
                const formData = Object.fromEntries(new FormData(form));
                await this.handleRegister(formData);
            };
        }

        this.renderUserList(list);
    },

    async handleRegister(formData)
    {
        try {
            const btn = document.querySelector(".btn-reg");
            if (btn) btn.disabled = true;

            const result = await universalFetch('/api/users/register', {
                method: 'POST',
                body: JSON.stringify({ ...formData, hasConsented: true })
            });

            if (result && result.user) {
                store.users = [...store.users, result.user];
                this.renderUserList(document.querySelector("#user-list"));
                alert("Bruker registrert!");
            }
        } catch (error) {
            console.error("Registration failed:", error);
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    async handleEdit(id, oldNick)
    {
        const newNick = prompt("Skriv inn nytt kallenavn:", oldNick);

        if (newNick && newNick !== oldNick) {
            try {
                const result = await ApiService.updateUser(id, { nick: newNick });

                if (result)
                {
                    store.users = store.users.map(user =>
                        user.id === id ? { ...user, nick: newNick } : user
                    );
                    this.renderUserList(document.querySelector("#user-list"));
                    alert("Navn oppdatert!");
                }
            } catch (error) {
                console.error("Update failed:", error);
                alert("Kunne ikke oppdatere navn.");
            }
        }
    },

    async handleDelete(id)
    {
        if (!confirm("Vil du slette denne brukeren?")) return;
        try {
            await ApiService.deleteUser(id);
            store.users = store.users.filter(user => user.id !== id);
            this.renderUserList(document.querySelector("#user-list"));
        } catch (error) {
            console.error("Delete failed:", error);
        }
    },

    renderUserList(listElement)
    {
        if (!listElement) return;

        listElement.innerHTML = store.users.map(user => `
            <li>
                <span>${user.nick}</span>
                <div class="user-actions">
                    <button class="btn-edit" data-id="${user.id}" data-nick="${user.nick}">Endre</button>
                    <button class="btn-del" data-id="${user.id}">Slett</button>
                </div>
            </li>
        `).join('');

        // Connect event listeners for edit and delete buttons
        listElement.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = () => this.handleEdit(Number(btn.dataset.id), btn.dataset.nick);
        });

        listElement.querySelectorAll('.btn-del').forEach(btn => {
            btn.onclick = () => this.handleDelete(Number(btn.dataset.id));
        });
    }

}; // End of userUIController