export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'optiprint_theme';

/**
 * Retrieves the stored theme preference from localStorage.
 * Falls back to system prefers-color-scheme or 'light' if not available.
 */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // LocalStorage might be inaccessible (e.g. security sandboxing)
  }

  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // matchMedia not available or threw
  }

  return 'light';
}

/**
 * Stores the theme preference in localStorage safely.
 */
export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage write errors (quota, private mode)
  }
}

/**
 * Applies the theme to the DOM by adding/removing the 'dark' class on <html>
 * and setting colorScheme style property for native controls.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

/**
 * Toggles the theme between 'light' and 'dark'.
 */
export function toggleTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}
