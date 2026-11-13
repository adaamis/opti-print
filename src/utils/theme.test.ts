import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  THEME_STORAGE_KEY,
  applyTheme,
  getStoredTheme,
  setStoredTheme,
  toggleTheme,
} from './theme';

function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string): string | null => store[key] ?? null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key];
    }),
    clear: vi.fn((): void => {
      store = {};
    }),
  };
}

describe('theme utilities', () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  let mockStorage: ReturnType<typeof createMockLocalStorage>;
  let classListSet: Set<string>;
  let mockDocument: any;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    classListSet = new Set<string>();

    mockDocument = {
      documentElement: {
        classList: {
          add: vi.fn((cls: string) => classListSet.add(cls)),
          remove: vi.fn((cls: string) => classListSet.delete(cls)),
          contains: vi.fn((cls: string) => classListSet.has(cls)),
        },
        style: {
          colorScheme: '',
        },
      },
    };

    const mockWin: any = {
      localStorage: mockStorage,
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
      })),
    };

    (globalThis as any).window = mockWin;
    (globalThis as any).document = mockDocument;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
    vi.restoreAllMocks();
  });

  describe('getStoredTheme', () => {
    it('returns "light" when window is undefined', () => {
      (globalThis as any).window = undefined;
      expect(getStoredTheme()).toBe('light');
    });

    it('returns stored theme when set to dark in localStorage', () => {
      mockStorage.setItem(THEME_STORAGE_KEY, 'dark');
      expect(getStoredTheme()).toBe('dark');
    });

    it('returns stored theme when set to light in localStorage', () => {
      mockStorage.setItem(THEME_STORAGE_KEY, 'light');
      expect(getStoredTheme()).toBe('light');
    });

    it('falls back to dark when no stored theme and system prefers dark', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
      }));

      expect(getStoredTheme()).toBe('dark');
    });

    it('falls back to light when no stored theme and system prefers light', () => {
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
      }));

      expect(getStoredTheme()).toBe('light');
    });

    it('handles localStorage errors gracefully and falls back to system preference or light', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
      }));

      expect(() => getStoredTheme()).not.toThrow();
      expect(getStoredTheme()).toBe('light');
    });

    it('handles matchMedia throwing or missing safely', () => {
      (window as any).matchMedia = undefined;
      expect(getStoredTheme()).toBe('light');
    });
  });

  describe('setStoredTheme', () => {
    it('does nothing when window is undefined', () => {
      (globalThis as any).window = undefined;
      expect(() => setStoredTheme('dark')).not.toThrow();
    });

    it('saves theme correctly to localStorage', () => {
      setStoredTheme('dark');
      expect(mockStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');

      setStoredTheme('light');
      expect(mockStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light');
    });

    it('catches and ignores storage write errors gracefully', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });

      expect(() => setStoredTheme('dark')).not.toThrow();
    });
  });

  describe('applyTheme', () => {
    it('does nothing when document is undefined', () => {
      (globalThis as any).document = undefined;
      expect(() => applyTheme('dark')).not.toThrow();
    });

    it('adds dark class and sets color-scheme to dark when applying dark theme', () => {
      applyTheme('dark');
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('dark');
      expect(mockDocument.documentElement.style.colorScheme).toBe('dark');
    });

    it('removes dark class and sets color-scheme to light when applying light theme', () => {
      classListSet.add('dark');
      applyTheme('light');
      expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith('dark');
      expect(mockDocument.documentElement.style.colorScheme).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('switches dark to light', () => {
      expect(toggleTheme('dark')).toBe('light');
    });

    it('switches light to dark', () => {
      expect(toggleTheme('light')).toBe('dark');
    });
  });
});
