export const STORAGE_KEYS = {
  admin: 'fanta_admin_unlocked',
  referee: 'fanta_referee_unlocked',
};

export const clearPinSession = (role) => {
  try {
    sessionStorage.removeItem(STORAGE_KEYS[role]);
    sessionStorage.removeItem('fanta_push_pin');
  } catch {
    // Ignore storage errors in restricted environments
  }
};

export const isPinUnlocked = (role) => {
  try {
    return sessionStorage.getItem(STORAGE_KEYS[role]) === '1' && Boolean(sessionStorage.getItem('fanta_push_pin'));
  } catch {
    return false;
  }
};
