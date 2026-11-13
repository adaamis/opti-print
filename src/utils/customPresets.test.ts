import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  SAVED_PRESETS_STORAGE_KEY,
  deleteCustomPreset,
  findPresetById,
  loadSavedCustomPresets,
  saveCustomPreset,
} from './customPresets';

function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
}

describe('customPresets storage utilities', () => {
  const originalWindow = globalThis.window;
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    (globalThis as unknown as { window: { localStorage: typeof mockStorage } }).window = {
      localStorage: mockStorage,
    };
  });

  afterEach(() => {
    (globalThis as unknown as { window: typeof originalWindow }).window = originalWindow;
  });

  it('loads empty array when localStorage has no saved presets', () => {
    const list = loadSavedCustomPresets();
    expect(list).toEqual([]);
  });

  it('saves and loads a custom preset', () => {
    const created = saveCustomPreset({
      name: 'Envelope Especial',
      widthMm: 114,
      heightMm: 162,
    });

    expect(created.id).toContain('custom_');
    expect(created.name).toBe('Envelope Especial');
    expect(created.widthMm).toBe(114);
    expect(created.heightMm).toBe(162);
    expect(created.isCustomSaved).toBe(true);
    expect(created.category).toBe('⭐ Meus Formatos Salvos');

    const loaded = loadSavedCustomPresets();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(created.id);
    expect(loaded[0].name).toBe('Envelope Especial');
  });

  it('generates a default name if name is empty', () => {
    const created = saveCustomPreset({
      name: '   ',
      widthMm: 200,
      heightMm: 300,
    });

    expect(created.name).toBe('Formato 200×300 mm');
  });

  it('deletes a custom preset by id', () => {
    const p1 = saveCustomPreset({ name: 'Formato A', widthMm: 100, heightMm: 100 });
    const p2 = saveCustomPreset({ name: 'Formato B', widthMm: 200, heightMm: 200 });

    expect(loadSavedCustomPresets()).toHaveLength(2);

    const remaining = deleteCustomPreset(p1.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(p2.id);

    const reloaded = loadSavedCustomPresets();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].id).toBe(p2.id);
  });

  it('gracefully handles malformed or corrupted localStorage content', () => {
    mockStorage.setItem(SAVED_PRESETS_STORAGE_KEY, '{invalid json');
    expect(loadSavedCustomPresets()).toEqual([]);

    mockStorage.setItem(
      SAVED_PRESETS_STORAGE_KEY,
      JSON.stringify([
        null,
        'string-item',
        { id: '1', name: 'missing dimensions' },
        { id: '2', name: 'valid', widthMm: 100, heightMm: 200 },
        { id: '3', name: 'negative width', widthMm: -10, heightMm: 50 },
      ])
    );

    const loaded = loadSavedCustomPresets();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('2');
  });

  it('finds preset by id from builtin and custom sources', () => {
    // Builtin
    const a4 = findPresetById('A4');
    expect(a4).toBeDefined();
    expect(a4?.widthMm).toBe(210);
    expect(a4?.heightMm).toBe(297);

    // Custom
    const custom = saveCustomPreset({ name: 'Capa 145x203', widthMm: 145, heightMm: 203 });
    const list = loadSavedCustomPresets();
    const foundCustom = findPresetById(custom.id, list);
    expect(foundCustom).toBeDefined();
    expect(foundCustom?.name).toBe('Capa 145x203');

    // Unknown and CUSTOM
    expect(findPresetById('CUSTOM')).toBeUndefined();
    expect(findPresetById('NON_EXISTENT')).toBeUndefined();
  });
});
