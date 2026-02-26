import { store } from '../singleton.mjs';
import { ApiService } from '../api.mjs';
import { ProfileModel } from '../models/profile_client_model.mjs';

// Simple client-side controller for managing child profiles.
// Stores profiles under store.currentUser.profiles when available, otherwise uses store.profiles

export const profileController = {
  async init(container) {
    this.container = container;

    // Ensure translations are loaded
    if (!store.i18n || Object.keys(store.i18n).length === 0) {
      await store.loadI18n('no');
    }

    this.container.innerHTML = await ApiService.loadView('childProfiles');

    this.listEl = this.container.querySelector('#child-list');
    this.form = this.container.querySelector('#create-child-form');
    this.template = this.container.querySelector('#child-item-template');
    this.editTemplate = this.container.querySelector('#child-edit-template');

    this.form.onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this.form));
      this.createProfile(data);
    };

    this.loadProfiles();
  },

  loadProfiles() {
    const profiles = ProfileModel.getAll();
    this.renderList(profiles);
  },

  renderList(profiles) {
    this.listEl.innerHTML = '';
    profiles.forEach(p => {
      const clone = this.template.content.cloneNode(true);
      const li = clone.querySelector('li');
      li.dataset.id = p.id;
      li.querySelector('.child-name').textContent = p.name;

      li.querySelector('.select-child').onclick = () => this.selectProfile(p.id);
      li.querySelector('.edit-child').onclick = () => this.editProfile(p.id);
      li.querySelector('.delete-child').onclick = () => this.deleteProfile(p.id);

      this.listEl.appendChild(clone);
    });
  },

  async createProfile(data) {
    const profile = ProfileModel.create({ name: data.name, age: data.age || null });
    this.loadProfiles();
    this.showNotice('child.createSuccess');
  },

  selectProfile(id) {
    const found = ProfileModel.select(id);
    if (found) {
      store.currentView = 'childMenu';
    }
  },

  editProfile(id) {
    const found = ProfileModel.getAll().find(p => p.id === id);
    if (!found) return;

    // Prevent multiple edit forms for the same list item
    const listItem = this.listEl.querySelector(`li[data-id="${id}"]`);
    if (!listItem) return;
    if (listItem.querySelector('.edit-inline')) return;

    const clone = this.editTemplate.content.cloneNode(true);
    const editDiv = clone.querySelector('.edit-inline');
    const input = editDiv.querySelector('.edit-input');
    input.value = found.name || '';

    // Wire save/cancel buttons
    editDiv.querySelector('.save-edit').onclick = () => {
      const newName = input.value.trim();
      if (!newName || newName === found.name) { editDiv.remove(); return; }
      ProfileModel.update(id, { name: newName });
      this.loadProfiles();
      this.showNotice('edit.success');
    };

    editDiv.querySelector('.cancel-edit').onclick = () => { editDiv.remove(); };

    listItem.appendChild(clone);
  },

  deleteProfile(id) {
    if (!confirm(store.t('delete.confirm'))) return;
    ProfileModel.delete(id);
    this.loadProfiles();
  },

  showNotice(key) {
    const el = document.getElementById('global-notice');
    if (!el) return;
    el.textContent = store.t(key);
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
  }
};
