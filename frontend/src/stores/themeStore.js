import { create } from 'zustand';
import {
  ACCENTS,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  DEFAULT_THEME_MODE,
  THEME_MODES,
  THEME_STORAGE_KEY,
  resolveTheme,
} from '../constants/themes';

function read(key, allowed, fallback) {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback; // storage blocked (private mode, sandboxed iframe…)
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* the choice still applies for this visit */
  }
}

const ACCENT_IDS = ACCENTS.map((a) => a.id);

function apply(mode, accent) {
  const root = document.documentElement;
  const theme = resolveTheme(mode);
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-accent', accent);
  root.style.colorScheme = theme === 'ember-light' ? 'light' : 'dark';
}

export const useThemeStore = create((set, get) => ({
  mode: read(THEME_STORAGE_KEY, THEME_MODES, DEFAULT_THEME_MODE),
  accent: read(ACCENT_STORAGE_KEY, ACCENT_IDS, DEFAULT_ACCENT),

  setMode(mode) {
    if (!THEME_MODES.includes(mode)) return;
    write(THEME_STORAGE_KEY, mode);
    apply(mode, get().accent);
    set({ mode });
  },

  setAccent(accent) {
    if (!ACCENT_IDS.includes(accent)) return;
    write(ACCENT_STORAGE_KEY, accent);
    apply(get().mode, accent);
    set({ accent });
  },
}));

/** Apply the saved theme and follow OS changes while "system" is chosen. Call once at startup. */
export function initThemeSync() {
  const { mode, accent } = useThemeStore.getState();
  apply(mode, accent);

  const media = window.matchMedia('(prefers-color-scheme: light)');
  const onChange = () => {
    const state = useThemeStore.getState();
    if (state.mode === 'system') apply('system', state.accent);
  };
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
