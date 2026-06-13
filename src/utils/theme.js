import { getStorage, setStorage } from '../hooks/useStorage';

// Préférence : 'auto' (suit le système) | 'light' | 'dark'
export function getThemePref() {
  return getStorage('theme') || 'auto';
}

export function setThemePref(pref) {
  setStorage('theme', pref);
  applyTheme(pref);
}

export function applyTheme(pref = getThemePref()) {
  const dark = pref === 'dark' ||
    (pref === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#101418' : '#C0392B';
}

// En mode auto, suivre les changements système (jour/nuit iOS)
export function watchSystemTheme() {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!mq?.addEventListener) return () => {};
  const onChange = () => { if (getThemePref() === 'auto') applyTheme(); };
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
