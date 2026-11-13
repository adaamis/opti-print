import { describe, expect, it } from 'vitest';
import {
  BUILTIN_SHEET_PRESETS,
  DEFAULT_SHEET_CONFIG,
  SHEET_PRESET_GROUPS,
  SHEET_PRESETS,
} from './sheets';

describe('SHEET_PRESET_GROUPS and SHEET_PRESETS', () => {
  it('contains all 5 expected categories', () => {
    const categories = SHEET_PRESET_GROUPS.map((g) => g.category);
    expect(categories).toContain('Digital / SRA');
    expect(categories).toContain('Série ISO A');
    expect(categories).toContain('Gráfica Offset (Brasil)');
    expect(categories).toContain('Série ISO B');
    expect(categories).toContain('EUA / Outros');
  });

  it('contains all required ISO A sheet sizes with correct dimensions', () => {
    const isoGroup = SHEET_PRESET_GROUPS.find((g) => g.category === 'Série ISO A');
    expect(isoGroup).toBeDefined();

    const ids = isoGroup?.items.map((i) => i.id);
    expect(ids).toContain('A0');
    expect(ids).toContain('A1');
    expect(ids).toContain('A2');
    expect(ids).toContain('A3');
    expect(ids).toContain('A3_PLUS');
    expect(ids).toContain('A4');
    expect(ids).toContain('A5');
    expect(ids).toContain('A6');

    expect(SHEET_PRESETS.A0).toMatchObject({ widthMm: 841, heightMm: 1189 });
    expect(SHEET_PRESETS.A1).toMatchObject({ widthMm: 594, heightMm: 841 });
    expect(SHEET_PRESETS.A2).toMatchObject({ widthMm: 420, heightMm: 594 });
    expect(SHEET_PRESETS.A3).toMatchObject({ widthMm: 297, heightMm: 420 });
    expect(SHEET_PRESETS.A3_PLUS).toMatchObject({ widthMm: 329, heightMm: 483 });
    expect(SHEET_PRESETS.A4).toMatchObject({ widthMm: 210, heightMm: 297 });
    expect(SHEET_PRESETS.A5).toMatchObject({ widthMm: 148, heightMm: 210 });
    expect(SHEET_PRESETS.A6).toMatchObject({ widthMm: 105, heightMm: 148 });
  });

  it('contains Digital / SRA sizes with standard digital offset dimensions', () => {
    expect(SHEET_PRESETS.SRA3).toMatchObject({ widthMm: 320, heightMm: 450 });
    expect(SHEET_PRESETS.SRA4).toMatchObject({ widthMm: 225, heightMm: 320 });
    expect(SHEET_PRESETS.SUPER_B).toMatchObject({ widthMm: 330, heightMm: 483 });
  });

  it('contains Brazilian Offset standard sheet sizes', () => {
    expect(SHEET_PRESETS.OFFSET_66X96).toMatchObject({ widthMm: 660, heightMm: 960 });
    expect(SHEET_PRESETS.OFFSET_48X66).toMatchObject({ widthMm: 480, heightMm: 660 });
    expect(SHEET_PRESETS.OFFSET_64X88).toMatchObject({ widthMm: 640, heightMm: 880 });
    expect(SHEET_PRESETS.OFFSET_70X100).toMatchObject({ widthMm: 700, heightMm: 1000 });
    expect(SHEET_PRESETS.OFFSET_CARTAO_77X110).toMatchObject({ widthMm: 770, heightMm: 1100 });
  });

  it('contains ISO B sheet sizes', () => {
    expect(SHEET_PRESETS.B3).toMatchObject({ widthMm: 353, heightMm: 500 });
    expect(SHEET_PRESETS.B4).toMatchObject({ widthMm: 250, heightMm: 353 });
    expect(SHEET_PRESETS.B5).toMatchObject({ widthMm: 176, heightMm: 250 });
  });

  it('contains US / American sheet sizes', () => {
    expect(SHEET_PRESETS.US_LETTER).toMatchObject({ widthMm: 215.9, heightMm: 279.4 });
    expect(SHEET_PRESETS.US_LEGAL).toMatchObject({ widthMm: 215.9, heightMm: 355.6 });
    expect(SHEET_PRESETS.US_TABLOID).toMatchObject({ widthMm: 279.4, heightMm: 431.8 });
  });

  it('ensures every preset in BUILTIN_SHEET_PRESETS has positive dimensions and matching lookup key', () => {
    expect(BUILTIN_SHEET_PRESETS.length).toBeGreaterThan(15);
    for (const preset of BUILTIN_SHEET_PRESETS) {
      expect(preset.widthMm).toBeGreaterThan(0);
      expect(preset.heightMm).toBeGreaterThan(0);
      expect(SHEET_PRESETS[preset.id]).toBe(preset);
    }
  });

  it('maintains valid DEFAULT_SHEET_CONFIG', () => {
    expect(DEFAULT_SHEET_CONFIG.presetId).toBe('A3');
    expect(DEFAULT_SHEET_CONFIG.widthMm).toBe(297);
    expect(DEFAULT_SHEET_CONFIG.heightMm).toBe(420);
    expect(DEFAULT_SHEET_CONFIG.orientation).toBe('portrait');
    expect(DEFAULT_SHEET_CONFIG.grainDirection).toBe('long');
  });
});
