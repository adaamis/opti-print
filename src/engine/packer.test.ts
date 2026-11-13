import { describe, expect, it } from 'vitest';
import type { ItemSpec, PlacedItem, SheetConfig, SheetLayout } from '../types/optimizer';
import { computeQuickYield, fitCountInLength, packItems } from './packer';

const EPS = 1e-5;

function assertLayoutInvariants(layout: SheetLayout, sheet: SheetConfig): void {
  const { marginMm, spacingMm, widthMm, heightMm } = sheet;
  const items = layout.placedItems;

  // 1. Every placed item must stay strictly within printable bounds (marginMm)
  for (const item of items) {
    expect(item.x).toBeGreaterThanOrEqual(marginMm - EPS);
    expect(item.y).toBeGreaterThanOrEqual(marginMm - EPS);
    expect(item.x + item.width).toBeLessThanOrEqual(widthMm - marginMm + EPS);
    expect(item.y + item.height).toBeLessThanOrEqual(heightMm - marginMm + EPS);
    expect(item.width).toBeGreaterThan(0);
    expect(item.height).toBeGreaterThan(0);
  }

  // 2. Zero overlap and minimum spacingMm gap between every pair of items
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a: PlacedItem = items[i];
      const b: PlacedItem = items[j];

      const separatedHorizontally =
        a.x + a.width + spacingMm <= b.x + EPS || b.x + b.width + spacingMm <= a.x + EPS;
      const separatedVertically =
        a.y + a.height + spacingMm <= b.y + EPS || b.y + b.height + spacingMm <= a.y + EPS;

      expect(separatedHorizontally || separatedVertically).toBe(true);
    }
  }
}

describe('fitCountInLength', () => {
  it('computes exact fit counts with spacing', () => {
    expect(fitCountInLength(200, 90, 2)).toBe(2); // 90 + 2 + 90 = 182 <= 200
    expect(fitCountInLength(182, 90, 2)).toBe(2);
    expect(fitCountInLength(181.9, 90, 2)).toBe(1);
    expect(fitCountInLength(89, 90, 2)).toBe(0);
    expect(fitCountInLength(100, 0, 2)).toBe(0);
  });
});

describe('computeQuickYield', () => {
  it('optimizes mixed orientation to beat uniform grids (90x50mm on A4 and A3)', () => {
    const a4: SheetConfig = {
      presetId: 'A4',
      widthMm: 210,
      heightMm: 297,
      marginMm: 5,
      spacingMm: 2,
      orientation: 'portrait',
    };

    const resA4 = computeQuickYield(a4, 90, 50);
    expect(resA4.itemFits).toBe(true);
    expect(resA4.normal.count).toBe(10); // 2 x 5
    expect(resA4.rotated.count).toBe(9); // 3 x 3
    expect(resA4.mixed.count).toBe(11); // 1 col normal (5) + 2 cols rotated (6)
    expect(resA4.bestStrategy).toBe('mixed');
    expect(resA4.extraFromMixed).toBe(1);

    assertLayoutInvariants(resA4.normal.layout, a4);
    assertLayoutInvariants(resA4.rotated.layout, a4);
    assertLayoutInvariants(resA4.mixed.layout, a4);

    const a3: SheetConfig = {
      presetId: 'A3',
      widthMm: 297,
      heightMm: 420,
      marginMm: 5,
      spacingMm: 2,
      orientation: 'portrait',
    };

    const resA3 = computeQuickYield(a3, 90, 50);
    expect(resA3.normal.count).toBe(21); // 3 x 7
    expect(resA3.rotated.count).toBe(20); // 5 x 4
    expect(resA3.mixed.count).toBe(23); // 3x6 normal (18) + bottom strip 5 rotated (5)
    expect(resA3.bestStrategy).toBe('mixed');
    expect(resA3.extraFromMixed).toBe(2);

    assertLayoutInvariants(resA3.normal.layout, a3);
    assertLayoutInvariants(resA3.rotated.layout, a3);
    assertLayoutInvariants(resA3.mixed.layout, a3);

    const a1: SheetConfig = {
      presetId: 'A1',
      widthMm: 594,
      heightMm: 841,
      marginMm: 5,
      spacingMm: 2,
      orientation: 'portrait',
    };

    const resA1 = computeQuickYield(a1, 145, 203);
    expect(resA1.normal.count).toBe(12); // 3 x 4
    expect(resA1.rotated.count).toBe(10); // 2 x 5
    expect(resA1.mixed.count).toBe(14); // 1x4 normal (4) + right strip 2x5 rotated (10)
    expect(resA1.bestStrategy).toBe('mixed');
    expect(resA1.extraFromMixed).toBe(2);
    assertLayoutInvariants(resA1.mixed.layout, a1);
  });

  it('prefers rotated 90 deg uniform grid when it beats normal 0 deg', () => {
    const a4: SheetConfig = {
      presetId: 'A4',
      widthMm: 210,
      heightMm: 297,
      marginMm: 5,
      spacingMm: 2,
      orientation: 'portrait',
    };
    // 130 x 90mm: normal (130x90) 1x3 = 3, rotated (90x130) 2x2 = 4, no room for extra mixed pieces
    const res = computeQuickYield(a4, 130, 90);
    expect(res.normal.count).toBe(3);
    expect(res.rotated.count).toBe(4);
    expect(res.mixed.count).toBe(4);
    expect(res.bestStrategy).toBe('rotated');
    assertLayoutInvariants(res.rotated.layout, a4);
    assertLayoutInvariants(res.mixed.layout, a4);

    // 100 x 50mm: normal = 5, rotated = 6, mixed = 7 (6 rotated + 1 normal in bottom strip)
    const resMixed = computeQuickYield(a4, 100, 50);
    expect(resMixed.normal.count).toBe(5);
    expect(resMixed.rotated.count).toBe(6);
    expect(resMixed.mixed.count).toBe(7);
    expect(resMixed.bestStrategy).toBe('mixed');
    assertLayoutInvariants(resMixed.mixed.layout, a4);
  });

  it('works with zero margin and zero spacing', () => {
    const custom: SheetConfig = {
      presetId: 'CUSTOM',
      widthMm: 300,
      heightMm: 200,
      marginMm: 0,
      spacingMm: 0,
      orientation: 'landscape',
    };
    const res = computeQuickYield(custom, 100, 100);
    expect(res.normal.count).toBe(6);
    expect(res.normal.utilizationPercent).toBeCloseTo(100, 4);
    expect(res.normal.wastePercent).toBeCloseTo(0, 4);
    assertLayoutInvariants(res.normal.layout, custom);
  });

  it('handles oversized items and invalid dimensions gracefully', () => {
    const a4: SheetConfig = {
      presetId: 'A4',
      widthMm: 210,
      heightMm: 297,
      marginMm: 10,
      spacingMm: 2,
      orientation: 'portrait',
    };

    const oversized = computeQuickYield(a4, 250, 280);
    expect(oversized.itemFits).toBe(false);
    expect(oversized.normal.count).toBe(0);
    expect(oversized.rotated.count).toBe(0);
    expect(oversized.mixed.count).toBe(0);

    const invalid = computeQuickYield(a4, NaN, -10);
    expect(invalid.itemFits).toBe(false);
    expect(invalid.mixed.count).toBe(0);
  });
});

describe('packItems (multi-item multi-sheet)', () => {
  const a4: SheetConfig = {
    presetId: 'A4',
    widthMm: 210,
    heightMm: 297,
    marginMm: 5,
    spacingMm: 2,
    orientation: 'portrait',
  };

  it('packs heterogeneous items across multiple sheets without overlap and respects margins/spacing', () => {
    const items: ItemSpec[] = [
      {
        id: 'card',
        name: 'Cartão de Visita',
        widthMm: 90,
        heightMm: 50,
        quantity: 15,
        color: '#2563eb',
        allowRotation: true,
      },
      {
        id: 'sticker',
        name: 'Adesivo',
        widthMm: 70,
        heightMm: 70,
        quantity: 6,
        color: '#059669',
        allowRotation: true,
      },
      {
        id: 'tag',
        name: 'Tag',
        widthMm: 40,
        heightMm: 80,
        quantity: 8,
        color: '#d97706',
        allowRotation: true,
      },
    ];

    const result = packItems(a4, items);
    expect(result.totalRequested).toBe(29);
    expect(result.totalPlaced).toBe(29);
    expect(result.unplacedItems).toHaveLength(0);
    expect(result.sheets.length).toBeGreaterThanOrEqual(2);

    for (const sheetLayout of result.sheets) {
      assertLayoutInvariants(sheetLayout, a4);
    }

    // Verify exact per-item placed counts
    const countsById = new Map<string, number>();
    for (const sheet of result.sheets) {
      for (const p of sheet.placedItems) {
        countsById.set(p.itemId, (countsById.get(p.itemId) ?? 0) + 1);
      }
    }
    expect(countsById.get('card')).toBe(15);
    expect(countsById.get('sticker')).toBe(6);
    expect(countsById.get('tag')).toBe(8);
  });

  it('strictly respects allowRotation = false', () => {
    const items: ItemSpec[] = [
      {
        id: 'locked-portrait',
        name: 'Banner Vertical',
        widthMm: 120,
        heightMm: 250,
        quantity: 2,
        color: '#dc2626',
        allowRotation: false,
      },
      {
        id: 'cant-fit-unrotated',
        name: 'Largo Sem Rotação',
        widthMm: 220, // Wider than A4 usable width (200), though fits height (287) if rotated
        heightMm: 80,
        quantity: 3,
        color: '#7c3aed',
        allowRotation: false,
      },
    ];

    const result = packItems(a4, items);
    expect(result.totalRequested).toBe(5);
    expect(result.totalPlaced).toBe(2);
    expect(result.sheets).toHaveLength(2);
    for (const sheet of result.sheets) {
      assertLayoutInvariants(sheet, a4);
      for (const p of sheet.placedItems) {
        expect(p.rotated).toBe(false);
        expect(p.width).toBe(120);
        expect(p.height).toBe(250);
      }
    }
    expect(result.unplacedItems).toHaveLength(1);
    expect(result.unplacedItems[0].itemId).toBe('cant-fit-unrotated');
    expect(result.unplacedItems[0].quantity).toBe(3);
  });

  it('handles zero quantities, oversized items, and degenerate sheet margins', () => {
    const items: ItemSpec[] = [
      {
        id: 'zero',
        name: 'Zero Qtd',
        widthMm: 50,
        heightMm: 50,
        quantity: 0,
        color: '#2563eb',
        allowRotation: true,
      },
      {
        id: 'huge',
        name: 'Gigante',
        widthMm: 500,
        heightMm: 500,
        quantity: 4,
        color: '#dc2626',
        allowRotation: true,
      },
    ];

    const result = packItems(a4, items);
    expect(result.totalRequested).toBe(4);
    expect(result.totalPlaced).toBe(0);
    expect(result.sheets).toHaveLength(0);
    expect(result.unplacedItems).toHaveLength(1);
    expect(result.unplacedItems[0].quantity).toBe(4);

    // Margin eats entire sheet
    const badMarginSheet: SheetConfig = {
      ...a4,
      marginMm: 110, // 220 > 210 width
    };
    const validItem: ItemSpec[] = [
      {
        id: 'small',
        name: 'Pequeno',
        widthMm: 20,
        heightMm: 20,
        quantity: 2,
        color: '#059669',
        allowRotation: true,
      },
    ];
    const badResult = packItems(badMarginSheet, validItem);
    expect(badResult.totalPlaced).toBe(0);
    expect(badResult.unplacedItems).toHaveLength(1);
  });

  it('preserves grainDirection from SheetConfig on generated SheetLayouts (computeQuickYield and packItems)', () => {
    const sheetDefault: SheetConfig = {
      presetId: 'A4',
      widthMm: 210,
      heightMm: 297,
      marginMm: 5,
      spacingMm: 2,
      orientation: 'portrait',
    };
    const quickDefault = computeQuickYield(sheetDefault, 90, 50);
    expect(quickDefault.normal.layout.grainDirection).toBe('long');
    expect(quickDefault.rotated.layout.grainDirection).toBe('long');
    expect(quickDefault.mixed.layout.grainDirection).toBe('long');

    const sheetShort: SheetConfig = {
      ...sheetDefault,
      grainDirection: 'short',
    };
    const quickShort = computeQuickYield(sheetShort, 90, 50);
    expect(quickShort.normal.layout.grainDirection).toBe('short');
    expect(quickShort.rotated.layout.grainDirection).toBe('short');
    expect(quickShort.mixed.layout.grainDirection).toBe('short');

    const packDefault = packItems(sheetDefault, [
      { id: '1', name: 'Item', widthMm: 50, heightMm: 50, quantity: 2, color: '#000', allowRotation: true },
    ]);
    expect(packDefault.sheets[0].grainDirection).toBe('long');

    const packShort = packItems(sheetShort, [
      { id: '1', name: 'Item', widthMm: 50, heightMm: 50, quantity: 2, color: '#000', allowRotation: true },
    ]);
    expect(packShort.sheets[0].grainDirection).toBe('short');
  });
});
