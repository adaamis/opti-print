import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';
import type { Language, LocaleDictionary, TranslationParams } from './types';

export const STORAGE_KEY = 'app_user_language';

const dictionaries: Record<Language, LocaleDictionary> = {
  'pt-BR': ptBR,
  en,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'pt-BR';
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'pt-BR' || stored === 'en') {
      return stored;
    }
  } catch {
    // LocalStorage may throw in restricted sandboxes
  }

  if (typeof navigator !== 'undefined') {
    const candidateLanguages: string[] = [];
    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
      candidateLanguages.push(...navigator.languages);
    } else if (navigator.language) {
      candidateLanguages.push(navigator.language);
    }

    for (const lang of candidateLanguages) {
      const lower = lang.toLowerCase();
      if (lower.startsWith('en')) {
        return 'en';
      }
      if (lower.startsWith('pt')) {
        return 'pt-BR';
      }
    }
  }

  return 'pt-BR';
}

let currentLanguage: Language = detectInitialLanguage();

// Sync document element lang attribute initially if running in browser
if (typeof document !== 'undefined' && document.documentElement) {
  document.documentElement.lang = currentLanguage;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  if (lang !== 'pt-BR' && lang !== 'en') {
    return;
  }

  currentLanguage = lang;

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lang;
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
    } catch {
      // CustomEvent might not be supported in older test polyfills
    }
  }

  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error notifying i18n subscriber:', err);
    }
  });
}

export function subscribeLanguage(listener: Listener): () => void {
  listeners.add(listener);

  const handleWindowLanguageChange = (event: Event) => {
    const customEvent = event as CustomEvent<{ lang: Language }>;
    if (customEvent.detail?.lang && customEvent.detail.lang !== currentLanguage) {
      currentLanguage = customEvent.detail.lang;
    }
    listener();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('languagechange', handleWindowLanguageChange);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('languagechange', handleWindowLanguageChange);
    }
  };
}

function resolveNestedKey(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const segments = path.split('.');
  let current = obj;
  for (const seg of segments) {
    if (current && typeof current === 'object' && seg in current) {
      current = current[seg];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    if (key in params) {
      const val = params[key];
      return val === null || val === undefined ? '' : String(val);
    }
    return match;
  });
}

/**
 * Translates a key using the active language with safe fallback to pt-BR and key string.
 */
export function t(key: string, params?: TranslationParams, fallback?: string): string {
  const activeDict = dictionaries[currentLanguage];
  const canonicalDict = dictionaries['pt-BR'];

  let raw = resolveNestedKey(activeDict, key);
  if (raw === undefined && currentLanguage !== 'pt-BR') {
    raw = resolveNestedKey(canonicalDict, key);
  }

  if (raw === undefined) {
    raw = fallback !== undefined ? fallback : key;
  }

  return interpolate(raw, params);
}

export function getDictionary(lang: Language): LocaleDictionary {
  return dictionaries[lang];
}

/**
 * Testing utility to reset language without localStorage side-effects
 */
export function resetLanguageForTesting(lang: Language = 'pt-BR'): void {
  currentLanguage = lang;
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lang;
  }
  listeners.forEach((l) => l());
}
