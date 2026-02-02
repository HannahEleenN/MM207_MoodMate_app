import { ApiService } from '../../api_client.js';

export class userManager extends HTMLElement
{
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // UI message to the user in Norwegian
        const res = await ApiService.register({ ...data, hasConsented: true });
        alert(res.message || res.error);
    }

    render()
    {
        this.shadowRoot.innerHTML = `
            <style>
                form { display: flex; flex-direction: column; gap: 10px; max-width: 300px; }
                button { cursor: pointer; background: #4CAF50; color: white; border: none; padding: 10px; }
            </style>
            <section>
                <h3>Opprett ny konto</h3>
                <form id="regForm">
                    <input type="text" name="nick" placeholder="Kallenavn" required>
                    <input type="password" name="secret" placeholder="Hemmelig kode" required>
                    <button type="submit">Registrer</button>
                </form>
            </section>
        `;

        this.shadowRoot.getElementById('regForm').addEventListener('submit', (e) => this.handleRegister(e));
    }
}

customElements.define('user-manager', userManager);