import { store } from '../singleton.mjs';

// Profile Model
// Responsible for storing and manipulating child profiles in the client-side model.
// Controllers should call these functions and not mutate store.currentUser or store.profiles directly.

export const ProfileModel = {
  getAll() {
    if (store.currentUser) return store.currentUser.profiles || [];
    return store.profiles || [];
  },

  create(profile) {
    const p = { id: Date.now().toString(), ...profile };
    if (store.currentUser) {
      store.currentUser = { ...store.currentUser, profiles: [...(store.currentUser.profiles || []), p] };
    } else {
      store.profiles = [...(store.profiles || []), p];
    }
    return p;
  },

  update(id, data) {
    if (store.currentUser) {
      const profiles = (store.currentUser.profiles || []).map(p => p.id === id ? { ...p, ...data } : p);
      store.currentUser = { ...store.currentUser, profiles };
      return profiles.find(p => p.id === id);
    }
    const profiles = (store.profiles || []).map(p => p.id === id ? { ...p, ...data } : p);
    store.profiles = profiles;
    return profiles.find(p => p.id === id);
  },

  delete(id) {
    if (store.currentUser) {
      store.currentUser = { ...store.currentUser, profiles: (store.currentUser.profiles || []).filter(p => p.id !== id) };
    } else {
      store.profiles = (store.profiles || []).filter(p => p.id !== id);
    }
    if (store.currentChild && store.currentChild.id === id) store.currentChild = null;
  },

  select(id) {
    const profiles = this.getAll();
    const found = profiles.find(p => p.id === id);
    if (found) store.currentChild = found;
    return found || null;
  }
};

