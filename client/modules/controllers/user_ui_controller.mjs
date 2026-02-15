import { store } from '../singleton.mjs';
import { ApiService } from '../api.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// Controller for User Management (CRUD operations for parent users).

export const userUIController =
{
    async init(container)
    {
        // Store the reference to the container
        this.container = container;

        this.container.innerHTML = await ApiService.loadView('userManager');

        const form = this.container.querySelector("#regForm");
        const list = this.container.querySelector("#user-list");

        if (form) {
            form.onsubmit = async (e) =>
            {
                e.preventDefault();
                const formData = Object.fromEntries(new FormData(form));
                await this.handleRegister(formData);
            };
        }

        this.loadUserList(list);
    },

    async handleRegister(formData)
    {
        let btn = this.container.querySelector(".btn-reg");
        try {
            if (btn) btn.disabled = true;

            const result = await ApiService.register({ ...formData, hasConsented: true });

            if (result && result.user)
            {
                store.users = [...store.users, result.user];
                // Look for the list specifically inside this controller's container
                this.loadUserList(this.container.querySelector("#user-list"));
                alert("Bruker registrert!");
            }
        } catch (error) {
            console.error("Registration failed:", error);
            alert("Kunne ikke registrere bruker.");
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    async handleEdit(id, oldNick)
    {
        const newNick = prompt("Skriv inn nytt kallenavn:", oldNick);

        if (newNick && newNick !== oldNick)
        {
            try {
                const result = await ApiService.updateUser(id, { nick: newNick });

                if (result) {
                    store.users = store.users.map(user =>
                        user.id === id ? { ...user, nick: newNick } : user
                    );
                    this.loadUserList(this.container.querySelector("#user-list"));
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
            this.loadUserList(this.container.querySelector("#user-list"));
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Kunne ikke slette brukeren.");
        }
    },

    loadUserList(listElement)
    {
        if (!listElement) return;

        const template = this.container.querySelector('#user-item-template');
        if (!template) return;

        listElement.innerHTML = ''; // Clear existing list items

        store.users.forEach(user =>
        {
            // Clone the template for each user (Separation of concerns: Structure vs Logic)
            const clone = template.content.cloneNode(true);
            const li = clone.querySelector('li');

            // Set user data in the cloned node (Data Binding)
            li.querySelector('.user-nick-display').textContent = user.nick;

            // Attach event listeners for edit and delete (Event Delegation)
            li.querySelector('.btn-edit').onclick = () => this.handleEdit(user.id, user.nick);
            li.querySelector('.btn-del').onclick = () => this.handleDelete(user.id);

            // Append the cloned node to the list (DOM Manipulation)
            listElement.appendChild(clone);
        });
    }

}; // End of userUIController