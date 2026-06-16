// PIN gate helpers. Kept out of the PinLock component file so Vite fast-refresh
// keeps working (a component file should only export components).
//
// NOTE: this is light obfuscation, not real security — it only deters casual
// localStorage snooping. Do not rely on it to protect sensitive data.

const PIN_KEY = 'fk_pin';
const SESSION_KEY = 'fk_unlocked';

export function hashPin(pin) {
  return btoa(pin.split('').reverse().join('') + '_fk');
}

export function getPinHash() {
  return localStorage.getItem(PIN_KEY) || null;
}

export function setPinHash(pin) {
  localStorage.setItem(PIN_KEY, hashPin(pin));
}

export function checkPin(pin) {
  const stored = getPinHash();
  if (!stored) return false;
  return stored === hashPin(pin);
}

export function unlock() {
  sessionStorage.setItem(SESSION_KEY, '1');
}

export function isUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function hasPinSet() {
  return !!localStorage.getItem(PIN_KEY);
}

export function clearPin() {
  localStorage.removeItem(PIN_KEY);
}
