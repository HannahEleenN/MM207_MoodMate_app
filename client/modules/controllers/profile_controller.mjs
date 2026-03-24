import { store } from '../singleton.mjs';
import { ApiService } from '../api.mjs';
import { ProfileModel } from '../models/profile_client_model.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export const childProfilesUI =
{
  async init(container)
  {
    this.container = container;

    if (!store.i18n || Object.keys(store.i18n).length === 0) {
      await store.loadI18n('nb');
    }

    this.container.innerHTML = await ApiService.loadView('child_profiles');

    this.listEl = this.container.querySelector('#child-list');
    this.form = this.container.querySelector('#create-child-form');
    this.template = this.container.querySelector('#child-item-template');
    this.editTemplate = this.container.querySelector('#child-edit-template');

    this.form.onsubmit = (e) =>
    {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this.form));
      this.createProfile(data);
    };

    const backBtn = this.container.querySelector('#back-to-parent');
    if (backBtn)
    {
      backBtn.onclick = (e) =>
      {
        e.preventDefault();
        store.currentView = 'parentMenu';
      };
    }
    await this.loadProfiles();
  },

  async loadProfiles()
  {
    try {
      const profiles = await ProfileModel.loadProfiles();
      this.updateList(profiles);
    } catch (err) {
      console.error('Failed to load profiles:', err);
      const profiles = ProfileModel.getAll();
      this.updateList(profiles);
    }
  },

  updateList(profiles)
  {
    this.listEl.innerHTML = '';
    profiles.forEach(p =>
    {
      const clone = this.template.content.cloneNode(true);
      const li = clone.querySelector('li');
      li.dataset.id = p.id;
      li.querySelector('.child-name').textContent = p.name;

      li.querySelector('.select-child').onclick = () => this.selectProfile(p.id);
      li.querySelector('.edit-child').onclick = () => this.editProfile(p.id);
      li.querySelector('.delete-child').onclick = () => this.deleteProfile(p.id);

      const pinSection = li.querySelector('.profile-pin-section');
      const createPinBtn = li.querySelector('.create-pin-btn');
      const changePinBtn = li.querySelector('.change-pin-btn');
      const removePinBtn = li.querySelector('.remove-pin-btn');
      const pinStatusText = li.querySelector('.pin-status-text');

      if (p.hasPin)
      {
        pinStatusText.textContent = '🔒 PIN enabled';
        createPinBtn.style.display = 'none';
        changePinBtn.style.display = 'block';
        removePinBtn.style.display = 'block';
      } else {
        pinStatusText.textContent = '🔓 No PIN';
        createPinBtn.style.display = 'block';
        changePinBtn.style.display = 'none';
        removePinBtn.style.display = 'none';
      }

      createPinBtn.onclick = () => this.showPinInput(li, p.id, 'create');
      changePinBtn.onclick = () => this.showPinInput(li, p.id, 'change');
      removePinBtn.onclick = () => this.removePin(li, p.id);

      this.listEl.appendChild(clone);
    });
  },

  showPinInput(listItem, profileId, mode)
  {
    const inputSection = listItem.querySelector('.pin-input-section');
    const input = listItem.querySelector('.pin-input');
    const confirmBtn = listItem.querySelector('.confirm-pin-btn');
    const cancelBtn = listItem.querySelector('.cancel-pin-btn');

    inputSection.style.display = 'block';
    input.value = '';
    input.focus();

    confirmBtn.onclick = async () =>
    {
      const pin = input.value.trim();
      if (pin.length !== 6 || !/^\d+$/.test(pin))
      {
        alert(store.t ? store.t('profiles.pinMustBe6Digits') : 'PIN must be 6 digits');
        return;
      }
      const profile = ProfileModel.getAll().find(p => p.id === profileId);
      if (profile)
      {
        profile.hasPin = true;
        profile.pin = pin;
        ProfileModel.update(profileId, { hasPin: true });
        await this.loadProfiles();
        this.showNotice(mode === 'create' ? 'profiles.pinCreated' : 'profiles.pinChanged');
      }
    };

    cancelBtn.onclick = () => {
      inputSection.style.display = 'none';
    };
  },

  async removePin(listItem, profileId)
  {
    if (!confirm(store.t ? store.t('profiles.removePinConfirm') : 'Remove PIN?')) return;

    const profile = ProfileModel.getAll().find(p => p.id === profileId);
    if (profile)
    {
      profile.hasPin = false;
      profile.pin = null;
      ProfileModel.update(profileId, { hasPin: false, pin: null });
      await this.loadProfiles();
      this.showNotice('profiles.pinRemoved');
    }
  },

  async createProfile(data)
  {
    try
    {
      await ProfileModel.create({ name: data.name, age: data.age || null });
      this.form.reset();
      await this.loadProfiles();
      this.showNotice('child.createSuccess');
    } catch (err) {
      console.error('Failed to create profile:', err);
      this.showNotice('child.createFailed');
    }
  },

  selectProfile(id)
  {
    const found = ProfileModel.select(id);
    if (found) {
      store.currentView = 'childMenu';
    }
  },

  editProfile(id)
  {
    const found = ProfileModel.getAll().find(p => p.id === id);
    if (!found) return;

    const listItem = this.listEl.querySelector(`li[data-id="${id}"]`);
    if (!listItem) return;
    if (listItem.querySelector('.edit-inline')) return;

    const clone = this.editTemplate.content.cloneNode(true);
    const editDiv = clone.querySelector('.edit-inline');
    const input = editDiv.querySelector('.edit-input');
    input.value = found.name || '';

    editDiv.querySelector('.save-edit').onclick = async () =>
    {
      const newName = input.value.trim();
      if (!newName || newName === found.name) { editDiv.remove(); return; }
      ProfileModel.update(id, { name: newName });
      await this.loadProfiles();
      this.showNotice('edit.success');
    };

    editDiv.querySelector('.cancel-edit').onclick = () => { editDiv.remove(); };

    listItem.appendChild(clone);
  },

  async deleteProfile(id)
  {
    if (!confirm(store.t('delete.confirm'))) return;
    ProfileModel.delete(id);
    await this.loadProfiles();
  },

  showNotice(key)
  {
    const el = document.getElementById('global-notice');
    if (!el) return;
    el.textContent = store.t(key);
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
  }
};