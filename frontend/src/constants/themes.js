// Keep in sync with the inline script in index.html.
export const THEME_STORAGE_KEY = 'pc-theme-mode';
export const ACCENT_STORAGE_KEY = 'pc-accent';

export const THEME_MODES = ['dark', 'light', 'system'];
export const DEFAULT_THEME_MODE = 'dark';

export const THEMES = {
  dark: 'ember-dark',
  light: 'ember-light',
};

export const ACCENTS = [
  { id: 'ember', label: 'Ember', swatch: '#ff8a4c' },
  { id: 'iris', label: 'Iris', swatch: '#8b8cf8' },
  { id: 'jade', label: 'Jade', swatch: '#3ccb9a' },
  { id: 'sky', label: 'Sky', swatch: '#5ab0f5' },
  { id: 'rose', label: 'Rose', swatch: '#f2789f' },
];
export const DEFAULT_ACCENT = 'ember';

const systemPrefersLight = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches;

/** Convert a mode ("dark" | "light" | "system") into a daisyUI theme name. */
export function resolveTheme(mode) {
  if (mode === 'system') return systemPrefersLight() ? THEMES.light : THEMES.dark;
  return THEMES[mode] ?? THEMES.dark;
}
