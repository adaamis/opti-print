import { SHEET_PRESETS } from '../constants/sheets';
import type { SheetPreset } from '../types/optimizer';

export const SAVED_PRESETS_STORAGE_KEY = 'sheet_optimizer_saved_custom_presets';

export interface SaveCustomPresetInput {
  name: string;
  widthMm: number;
  heightMm: number;
}

/**
 * Loads custom saved sheet presets from localStorage safely.
 */
export function loadSavedCustomPresets(): SheetPreset[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SAVED_PRESETS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is { id: string; name: string; widthMm: number; heightMm: number; description?: string } => (
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.widthMm === 'number' &&
        Number.isFinite(item.widthMm) &&
        item.widthMm > 0 &&
        typeof item.heightMm === 'number' &&
        Number.isFinite(item.heightMm) &&
        item.heightMm > 0
      ))
      .map((item) => ({
        id: item.id,
        name: item.name.trim() || 'Formato Salvo',
        description: item.description?.trim() || `${item.widthMm} × ${item.heightMm} mm`,
        widthMm: Math.round(item.widthMm * 100) / 100,
        heightMm: Math.round(item.heightMm * 100) / 100,
        category: '⭐ Meus Formatos Salvos',
        isCustomSaved: true,
      }));
  } catch (error) {
    console.error('Failed to load saved custom presets from localStorage:', error);
    return [];
  }
}

/**
 * Saves a new custom sheet preset to localStorage and returns the created preset.
 */
export function saveCustomPreset(input: SaveCustomPresetInput): SheetPreset {
  const widthMm = Math.round(Number(input.widthMm) * 100) / 100;
  const heightMm = Math.round(Number(input.heightMm) * 100) / 100;
  const trimmedName = input.name.trim();
  const name = trimmedName || `Formato ${widthMm}×${heightMm} mm`;

  const newPreset: SheetPreset = {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    description: `${widthMm} × ${heightMm} mm`,
    widthMm,
    heightMm,
    category: '⭐ Meus Formatos Salvos',
    isCustomSaved: true,
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const current = loadSavedCustomPresets();
      // Avoid duplicate exact names or prepend newest
      const updated = [newPreset, ...current.filter((p) => p.name !== newPreset.name || p.widthMm !== newPreset.widthMm || p.heightMm !== newPreset.heightMm)];
      window.localStorage.setItem(SAVED_PRESETS_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save custom preset to localStorage:', error);
    }
  }

  return newPreset;
}

/**
 * Deletes a custom preset from localStorage by ID and returns the updated list.
 */
export function deleteCustomPreset(id: string): SheetPreset[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const current = loadSavedCustomPresets();
    const updated = current.filter((p) => p.id !== id);
    window.localStorage.setItem(SAVED_PRESETS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to delete custom preset from localStorage:', error);
    return [];
  }
}

/**
 * Finds a preset by ID, searching first in saved custom presets, then in builtin presets.
 */
export function findPresetById(
  id: string,
  customPresets: SheetPreset[] = []
): SheetPreset | undefined {
  if (!id || id === 'CUSTOM') return undefined;

  const fromCustom = customPresets.find((p) => p.id === id);
  if (fromCustom) return fromCustom;

  return SHEET_PRESETS[id];
}
