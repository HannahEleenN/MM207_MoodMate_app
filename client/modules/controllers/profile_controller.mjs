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

    this.cacheElements();
    this.attachEventListeners();
    await this.loadProfiles();
  },

  cacheElements()
  {
    this.listEl = this.container.querySelector('#child-list');
    this.form = this.container.querySelector('#create-child-form');
    this.template = this.container.querySelector('#child-item-template');
    this.editTemplate = this.container.querySelector('#child-edit-template');

    if (!this.form) {
      throw new Error('Form element #create-child-form not found in child_profiles view');
    }
    if (!this.listEl) {
      throw new Error('List element #child-list not found in child_profiles view');
    }
    if (!this.template) {
      throw new Error('Template element #child-item-template not found in child_profiles view');
    }
    if (!this.editTemplate) {
      throw new Error('Template element #child-edit-template not found in child_profiles view');
    }
  },

  attachEventListeners()
  {
    if (this.form)
    {
      this.form.onsubmit = async (e) =>
      {
        e.preventDefault();
        const profileFormData = Object.fromEntries(new FormData(this.form));
        await this.createProfile(profileFormData);
      };
    }

    const backBtn = this.container.querySelector('#back-to-parent');
    if (backBtn)
    {
      backBtn.onclick = (e) =>
      {
        e.preventDefault();
        store.currentView = 'parentMenu';
      };
    }
  },

  async loadProfiles()
  {
    try
    {
      const profiles = await ProfileModel.loadProfiles();
      this.updateList(profiles);
    } catch (err)
    {
      console.error('Failed to load profiles:', err);
      const profiles = ProfileModel.getAll();
      this.updateList(profiles);
    }
  },

  updateList(profiles)
  {
    if (!this.template)
    {
      this.template = this.container.querySelector('#child-item-template');
      if (!this.template)
      {
        console.error('Template not found in updateList');
        return;
      }
    }

    this.listEl.innerHTML = '';
    profiles.forEach(profile =>
    {
      const profileItemClone = this.template.content.cloneNode(true);
      const profileItem = profileItemClone.querySelector('li');
      profileItem.dataset.id = profile.id;
      profileItem.querySelector('.child-name').textContent = profile.name;

      const ageEl = profileItem.querySelector('.child-age');
      if (ageEl && profile.age) {
        ageEl.textContent = `(${profile.age} ${profile.age === '1' ? 'year' : 'years'})`;
      }

      profileItem.querySelector('.select-child').onclick = () => this.selectProfile(p.id);
      profileItem.querySelector('.edit-child').onclick = () => this.editProfile(p.id);
      profileItem.querySelector('.delete-child').onclick = () => this.deleteProfile(p.id);

      const createPinBtn = profileItem.querySelector('.create-pin-btn');
      const changePinBtn = profileItem.querySelector('.change-pin-btn');
      const removePinBtn = profileItem.querySelector('.remove-pin-btn');
      const pinStatusText = profileItem.querySelector('.pin-status-text');

      if (profile.hasPin)
      {
        pinStatusText.textContent = '🔒 PIN enabled';
        createPinBtn.style.display = 'none';
        changePinBtn.style.display = 'block';
        removePinBtn.style.display = 'block';
      } else
      {
        pinStatusText.textContent = '🔓 No PIN';
        createPinBtn.style.display = 'block';
        changePinBtn.style.display = 'none';
        removePinBtn.style.display = 'none';
      }

      createPinBtn.onclick = () => this.showPinInput(profileItem, profile.id, 'create');
      changePinBtn.onclick = () => this.showPinInput(profileItem, profile.id, 'change');
      removePinBtn.onclick = () => this.removePin(profileItem, profile.id);

      this.listEl.appendChild(profileItemClone);
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
        await ProfileModel.update(profileId, { hasPin: true });
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
      await ProfileModel.update(profileId, { hasPin: false, pin: null });
      await this.loadProfiles();
      this.showNotice('profiles.pinRemoved');
    }
  },

  async createProfile(data)
  {
    try
    {
      if (data.pin && (data.pin.length !== 6 || !/^\d+$/.test(data.pin)))
      {
        const errorMsg = store.t ? store.t('profiles.pinMustBe6Digits') : 'PIN must be 6 digits';
        const errorEl = this.form.querySelector('#pin-error');
        if (errorEl)
        {
          errorEl.textContent = errorMsg;
          errorEl.classList.add('show');
        }
        return;
      }

      const profileData =
      {
        name: data.childName || data.name,
        age: data.age || null,
        ...(data.pin && { pin: data.pin, hasPin: true })
      };

      await ProfileModel.create(profileData);
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

    if (!this.editTemplate)
    {
      this.editTemplate = this.container.querySelector('#child-edit-template');
      if (!this.editTemplate)
      {
        console.error('Edit template not found');
        return;
      }
    }

    const editFormClone = this.editTemplate.content.cloneNode(true);
    const editFormSection = editFormClone.querySelector('.edit-inline');
    const nameInputField = editFormSection.querySelector('.edit-input');
    const ageSelect = editFormSection.querySelector('.edit-age');
    
    nameInputField.value = found.name || '';
    if (ageSelect && found.age) {
      ageSelect.value = found.age;
    }

    editFormSection.querySelector('.save-edit').onclick = async () =>
    {
      const newName = nameInputField.value.trim();
      const newAge = ageSelect ? ageSelect.value : found.age;
      
      if (!newName || (newName === found.name && newAge === found.age)) { 
        editFormSection.remove(); 
        return; 
      }
      
      await ProfileModel.update(id, { name: newName, age: newAge || null });
      await this.loadProfiles();
      this.showNotice('edit.success');
    };

    editFormSection.querySelector('.cancel-edit').onclick = () => { editFormSection.remove(); };

    listItem.appendChild(editFormClone);
  },

  async deleteProfile(id)
  {
    if (!confirm(store.t('delete.confirm'))) return;
    await ProfileModel.delete(id);
    await this.loadProfiles();
  },

  showNotice(key)
  {
    const noticeElement = document.getElementById('global-notice');
    if (!noticeElement) return;
    noticeElement.textContent = store.t(key);
    noticeElement.classList.remove('hidden');
    setTimeout(() => noticeElement.classList.add('hidden'), 3000);
  }
};
