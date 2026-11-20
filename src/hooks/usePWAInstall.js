import { useSyncExternalStore } from 'react';

const displayMode = window.matchMedia('(display-mode: standalone)');
let installedHere = false;
let deferredPrompt = null;
let prompting = false;
const listeners = new Set();

function isInstalled() {
  return installedHere || displayMode.matches || navigator.standalone === true ||
    document.referrer.includes('android-app://');
}

function notify() {
  for (const listener of listeners) listener();
}

function capturePrompt(event) {
  event.preventDefault();
  deferredPrompt = event;
}

function markInstalled() {
  installedHere = true;
  deferredPrompt = null;
  notify();
}

// Capture the one-shot event during startup, even while a PIN gate or route is mounting.
window.addEventListener('beforeinstallprompt', capturePrompt);
window.addEventListener('appinstalled', markInstalled);
displayMode.addEventListener('change', notify);
if (import.meta.hot) import.meta.hot.dispose(() => {
  window.removeEventListener('beforeinstallprompt', capturePrompt);
  window.removeEventListener('appinstalled', markInstalled);
  displayMode.removeEventListener('change', notify);
});

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function instructions() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? 'ios' : 'menu';
}

async function install() {
  if (isInstalled() || prompting) return null;
  if (!deferredPrompt) return instructions();
  const event = deferredPrompt;
  deferredPrompt = null;
  prompting = true;
  try {
    await event.prompt();
    await event.userChoice;
    return null;
  } catch {
    return instructions();
  } finally {
    prompting = false;
  }
}

export function usePWAInstall() {
  return { installed: useSyncExternalStore(subscribe, isInstalled), install };
}
