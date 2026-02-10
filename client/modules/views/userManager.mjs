import { ApiService } from '../api.mjs';

export class UserManager extends HTMLElement
{
    constructor()
    {
        super();
        this.attachShadow({ mode: 'open' });
        this.users = [
            { id: 1, nick: "Mamma" },
            { id: 2, nick: "Pappa" }
        ];
    }

    connectedCallback() {
        this.render();
    }

    async handleRegister(e)
    {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            const res = await ApiService.register({ ...data, hasConsented: true });
            alert("Suksess: " + (res.message || "Bruker opprettet"));

            this.users.push({ id: Date.now(), nick: data.nick });
            this.render();
        } catch (err) {
            alert("Kunne ikke registrere: " + err.message);
        }
    }

    async handleDelete(id)
    {
        if (!confirm("Er du sikker på at du vil slette denne brukeren?")) return;

        try {
            await ApiService.deleteUser(id);
            // Update local list after successful deletion
            this.users = this.users.filter(user => user.id !== id);
            this.render();
        } catch (err) {
            alert("Feil ved sletting: " + err.message);
        }
    }

    handleEdit(id)
    {
        const newNick = prompt("Skriv inn nytt kallenavn:");
        if (newNick) {
            this.users = this.users.map(u => u.id === id ? { ...u, nick: newNick } : u);
            this.render();
        }
    }

    render()
    {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; font-family: sans-serif; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; }
                form { display: flex; flex-direction: column; gap: 10px; max-width: 300px; margin-bottom: 2rem; }
                button { cursor: pointer; padding: 8px; border: none; border-radius: 4px; }
                .btn-reg { background: #4CAF50; color: white; }
                .btn-edit { background: #ff9800; color: white; margin-left: 10px; }
                .btn-del { background: #f44336; color: white; margin-left: 5px; }
                ul { list-style: none; padding: 0; }
                li { padding: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; }
                .consent-label { font-size: 0.8rem; }
            </style>

            <section>
                <h3>Opprett ny konto</h3>
                <form id="regForm">
                    <input type="text" name="nick" placeholder="Kallenavn" required>
                    <input type="password" name="secret" placeholder="Hemmelig kode" required>
                    <label class="consent-label">
                        <input type="checkbox" required> Jeg godtar vilkårene
                    </label>
                    <button type="submit" class="btn-reg">Registrer</button>
                </form>

                <hr>

                <h3>Administrer brukere</h3>
                <ul id="user-list">
                    ${this.users.map(user => `
                        <li>
                            <span>${user.nick}</span>
                            <div>
                                <button class="btn-edit" data-id="${user.id}">Endre</button>
                                <button class="btn-del" data-id="${user.id}">Slett</button>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </section>
        `;

        // Event listeners
        this.shadowRoot.getElementById('regForm').addEventListener('submit', (e) => this.handleRegister(e));

        this.shadowRoot.querySelectorAll('.btn-del').forEach(btn => {
            btn.onclick = () => this.handleDelete(Number(btn.dataset.id));
        });

        this.shadowRoot.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = () => this.handleEdit(Number(btn.dataset.id));
        });
    }
}

customElements.define('user-manager', UserManager);