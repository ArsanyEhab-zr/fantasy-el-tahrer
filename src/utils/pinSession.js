export const STORAGE_KEYS = {
  admin: 'fanta_admin_unlocked',
  referee: 'fanta_referee_unlocked',
};

export const clearPinSession = (role) => {
  try {
    sessionStorage.removeItem(STORAGE_KEYS[role]);
  } catch {
    // Ignore storage errors in restricted environments
  }
};

export const isPinUnlocked = (role) => {
  try {
    return sessionStorage.getItem(STORAGE_KEYS[role]) === '1';
  } catch {
    return false;
  }
};
