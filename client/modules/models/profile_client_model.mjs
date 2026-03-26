import { store } from '../singleton.mjs';
import { ApiService } from '../api.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export const ProfileModel =
{
  getAll() {
    if (store.currentUser) return store.currentUser.profiles || [];
    return store.profiles || [];
  },

  async create(profile)
  {
    try
    {
      // Use provided PIN if available, otherwise don't set one (optional)
      const pin = profile.pin || (profile.hasPin ? Math.floor(100000 + Math.random() * 900000).toString() : undefined);
      const createData = {
        name: profile.name,
        ...(pin && { pin })
      };

      const response = await ApiService.createChild(createData);
      const created = response && (response.child || response);

      if (store.currentUser) {
        store.currentUser = { ...store.currentUser, profiles: [...(store.currentUser.profiles || []), created] };
      } else {
        store.profiles = [...(store.profiles || []), created];
      }
      return created;
    } catch (err) {
      console.error('Failed to create child profile:', err);
      throw err;
    }
  },

  async loadProfiles()
  {
    try {
      // Fetch profiles from database
      const response = await ApiService.getChildren();
      const profiles = response && (response.data || response.children || []);
      
      if (store.currentUser) {
        store.currentUser = { ...store.currentUser, profiles };
      } else {
        store.profiles = profiles;
      }
      return profiles;
    } catch (err) {
      console.error('Failed to load child profiles:', err);
      return this.getAll();
    }
  },

  async update(id, data)
  {
    try
    {
      await ApiService.updateChild(id, data);

      if (store.currentUser) {
        const profiles = (store.currentUser.profiles || []).map(profile => profile.id === id ? { ...profile, ...data } : profile);
        store.currentUser = { ...store.currentUser, profiles };
        return profiles.find(profile => profile.id === id);
      }
      const profiles = (store.profiles || []).map(profile => profile.id === id ? { ...profile, ...data } : profile);
      store.profiles = profiles;
      return profiles.find(profile => profile.id === id);
    } catch (err) {
      console.error('Failed to update child profile:', err);
      throw err;
    }
  },

  async delete(id)
  {
    try
    {
      await ApiService.deleteChild(id);

      if (store.currentUser) {
        store.currentUser = { ...store.currentUser, profiles: (store.currentUser.profiles || []).filter(p => p.id !== id) };
      } else {
        store.profiles = (store.profiles || []).filter(p => p.id !== id);
      }
      if (store.currentChild && store.currentChild.id === id) store.currentChild = null;
    } catch (err) {
      console.error('Failed to delete child profile:', err);
      throw err;
    }
  },

  select(id)
  {
    const profiles = this.getAll();
    const found = profiles.find(p => p.id === id);
    if (found) store.currentChild = found;
    return found || null;
  }
};