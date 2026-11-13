import { describe, expect, it } from 'vitest';
import { computeQuickYield } from './packer';
import { analyzeGuillotineCuts, formatCutDescription } from './guillotine';
import type { PlacedItem, SheetConfig, SheetLayout } from '../types/optimizer';

function createMockLayout(placedItems: PlacedItem[], widthMm = 300, heightMm = 300): SheetLayout {
  const usedAreaMm2 = placedItems.reduce((acc, it) => acc + it.width * it.height, 0);
  const totalAreaMm2 = widthMm * heightMm;
  return {
    sheetNumber: 1,
    widthMm,
    heightMm,
    marginMm: 0,
    spacingMm: 0,
    placedItems,
    usedAreaMm2,
    usableAreaMm2: totalAreaMm2,
    totalAreaMm2,
    utilizationPercent: (usedAreaMm2 / totalAreaMm2) * 100,
    wastePercent: 100 - (usedAreaMm2 / totalAreaMm2) * 100,
  };
}

describe('Guillotine Cutting Engine (analyzeGuillotineCuts)', () => {
  describe('Edge cases: Empty and Single Item Layouts', () => {
    it('handles empty layout (0 items) gracefully', () => {
      const layout = createMockLayout([]);
      const result = analyzeGuillotineCuts(layout);

      expect(result.isGuillotineCuttable).toBe(true);
      expect(result.totalCutsNeeded).toBe(0);
      expect(result.steps).toEqual([]);
      expect(result.efficiencyRating).toBe('ideal');
      expect(result.message).toContain('Nenhum item posicionado');
    });

    it('handles single item layout (1 item)', () => {
      const item: PlacedItem = {
        index: 0,
        itemId: 'item-1',
        name: 'Cartão',
        color: '#ff0000',
        x: 10,
        y: 10,
        width: 90,
        height: 50,
        rotated: false,
      };
      const layout = createMockLayout([item]);
      const result = analyzeGuillotineCuts(layout);

      expect(result.isGuillotineCuttable).toBe(true);
      expect(result.totalCutsNeeded).toBe(0);
      expect(result.steps).toEqual([]);
      expect(result.efficiencyRating).toBe('ideal');
      expect(result.message).toContain('Item único na folha');
    });
  });

  describe('Clean Grid Layouts', () => {
    it('correctly sequences a 2x2 grid layout (4 items -> 3 cuts)', () => {
      const items: PlacedItem[] = [
        { index: 0, itemId: '1', name: 'Item 1', color: '#f00', x: 0, y: 0, width: 50, height: 50, rotated: false },
        { index: 1, itemId: '2', name: 'Item 2', color: '#f00', x: 50, y: 0, width: 50, height: 50, rotated: false },
        { index: 2, itemId: '3', name: 'Item 3', color: '#f00', x: 0, y: 50, width: 50, height: 50, rotated: false },
        { index: 3, itemId: '4', name: 'Item 4', color: '#f00', x: 50, y: 50, width: 50, height: 50, rotated: false },
      ];
      const layout = createMockLayout(items, 100, 100);
      const result = analyzeGuillotineCuts(layout);

      expect(result.isGuillotineCuttable).toBe(true);
      expect(result.totalCutsNeeded).toBe(3);
      expect(result.steps).toHaveLength(3);
      expect(result.efficiencyRating).toBe('ideal');

      // Verify steps are numbered sequentially from 1 to 3
      expect(result.steps.map((s) => s.stepNumber)).toEqual([1, 2, 3]);

      // All cuts must have valid bounds and coordinates
      for (const step of result.steps) {
        expect(step.cutEndMm).toBeGreaterThan(step.cutStartMm);
        expect(step.description).toBeTruthy();
      }
    });

    it('correctly sequences a 3x3 grid layout (9 items -> exact 8 cuts)', () => {
      const items: PlacedItem[] = [];
      let index = 0;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          items.push({
            index: index++,
            itemId: `card-${row}-${col}`,
            name: `Card ${row},${col}`,
            color: '#3b82f6',
            x: col * 90,
            y: row * 50,
            width: 90,
            height: 50,
            rotated: false,
          });
        }
      }
      const layout = createMockLayout(items, 270, 150);
      const result = analyzeGuillotineCuts(layout);

      expect(result.isGuillotineCuttable).toBe(true);
      expect(result.totalCutsNeeded).toBe(8);
      expect(result.steps).toHaveLength(8);
      expect(result.efficiencyRating).toBe('ideal');
      expect(result.message).toContain('Layout 100% guilhotinável em 8 cortes lineares sequenciais');

      // Check step sequential numbering
      expect(result.steps.map((s) => s.stepNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

      // Ensure all cuts are either horizontal or vertical
      for (const step of result.steps) {
        expect(['horizontal', 'vertical']).toContain(step.direction);
        expect(step.cutEndMm).toBeGreaterThan(step.cutStartMm);
      }
    });
  });

  describe('Mixed Nesting Layouts', () => {
    it('correctly handles mixed nesting (horizontal and vertical items combined)', () => {
      // Left side: 2 vertical items (rotated = true)
      // Right side: 2 horizontal items (rotated = false)
      const items: PlacedItem[] = [
        { index: 0, itemId: 'v1', name: 'Vertical 1', color: '#10b981', x: 0, y: 0, width: 50, height: 100, rotated: true },
        { index: 1, itemId: 'v2', name: 'Vertical 2', color: '#10b981', x: 50, y: 0, width: 50, height: 100, rotated: true },
        { index: 2, itemId: 'h1', name: 'Horizontal 1', color: '#6366f1', x: 100, y: 0, width: 100, height: 50, rotated: false },
        { index: 3, itemId: 'h2', name: 'Horizontal 2', color: '#6366f1', x: 100, y: 50, width: 100, height: 50, rotated: false },
      ];
      const layout = createMockLayout(items, 200, 100);
      const result = analyzeGuillotineCuts(layout);

      expect(result.isGuillotineCuttable).toBe(true);
      expect(result.totalCutsNeeded).toBe(3);
      expect(result.steps).toHaveLength(3);
      expect(result.efficiencyRating).toBe('moderate');

      // 1st cut must be vertical at X = 100, separating the vertical block from horizontal block
      const firstCut = result.steps[0];
      expect(firstCut.direction).toBe('vertical');
      expect(firstCut.coordinateMm).toBe(100);
      expect(firstCut.cutStartMm).toBe(0);
      expect(firstCut.cutEndMm).toBe(100);
      expect(firstCut.description).toBe('1º Corte Vertical em X = 100.0 mm (de Y = 0.0 a 100.0 mm)');
    });

    it('identifies complex efficiency rating for alternating interleaved rotations', () => {
      // 4 stacked horizontal strips, alternating rotated vs non-rotated
      const items: PlacedItem[] = [
        { index: 0, itemId: 'r1', name: 'R1', color: '#f00', x: 0, y: 0, width: 100, height: 25, rotated: false },
        { index: 1, itemId: 'r2', name: 'R2', color: '#0f0', x: 0, y: 25, width: 100, height: 25, rotated: true },
        { index: 2, itemId: 'r3', name: 'R3', color: '#00f', x: 0, y: 50, width: 100, height: 25, rotated: false },
        { index: 3, itemId: 'r4', name: 'R4', color: '#ff0', x: 0, y: 75, width: 100, height: 25, rotated: true },
      ];
      const layout = createMockLayout(items, 100, 100);
      const result = analyzeGuillotineCuts(layout);

      expect(result.isGuillotineCuttable).toBe(true);
      expect(result.totalCutsNeeded).toBe(3);
      expect(result.efficiencyRating).toBe('complex');
    });
  });

  describe('Non-Guillotine / Interlocked Pinwheel Layout', () => {
    it('detects pinwheel interlocking pattern and flags non-guillotine', () => {
      // Classic pinwheel pattern: 4 items forming a spiral around a central hole
      // No straight line can pass edge-to-edge without cutting through an item.
      const items: PlacedItem[] = [
        // Top: x: 0..70, y: 0..30
        { index: 0, itemId: 'pw1', name: 'Top', color: '#ef4444', x: 0, y: 0, width: 70, height: 30, rotated: false },
        // Right: x: 70..100, y: 0..70
        { index: 1, itemId: 'pw2', name: 'Right', color: '#f59e0b', x: 70, y: 0, width: 30, height: 70, rotated: true },
        // Bottom: x: 30..100, y: 70..100
        { index: 2, itemId: 'pw3', name: 'Bottom', color: '#10b981', x: 30, y: 70, width: 70, height: 30, rotated: false },
        // Left: x: 0..30, y: 30..100
        { index: 3, itemId: 'pw4', name: 'Left', color: '#3b82f6', x: 0, y: 30, width: 30, height: 70, rotated: true },
      ];
      const layout = createMockLayout(items, 100, 100);
      const result = analyzeGuillotineCuts(layout);

      expect(result.isGuillotineCuttable).toBe(false);
      expect(result.totalCutsNeeded).toBe(0);
      expect(result.steps).toEqual([]);
      expect(result.efficiencyRating).toBe('non-guillotine');
      expect(result.message).toContain('pinwheel/interlock');
    });
  });

  describe('Integration with Packer Engine (computeQuickYield)', () => {
    const sheet: SheetConfig = {
      presetId: 'A4',
      widthMm: 297,
      heightMm: 210,
      marginMm: 5,
      spacingMm: 0,
      orientation: 'landscape',
    };

    it('successfully analyzes a quick yield normal grid layout', () => {
      const comparison = computeQuickYield(sheet, 90, 50, 'Cartão de Visita');
      expect(comparison.normal.count).toBeGreaterThan(0);

      const result = analyzeGuillotineCuts(comparison.normal.layout);
      expect(result.isGuillotineCuttable).toBe(true);
      expect(result.totalCutsNeeded).toBe(comparison.normal.count - 1);
      expect(result.steps).toHaveLength(comparison.normal.count - 1);
      expect(result.efficiencyRating).toBe('ideal');
    });

    it('successfully analyzes a quick yield mixed layout', () => {
      // Pick dimensions that yield a mixed layout with rotated items
      const comparison = computeQuickYield(sheet, 85, 55, 'Cartão');
      if (comparison.mixed.rotatedCount > 0 && comparison.mixed.normalCount > 0) {
        const result = analyzeGuillotineCuts(comparison.mixed.layout);
        expect(result.isGuillotineCuttable).toBe(true);
        expect(result.totalCutsNeeded).toBe(comparison.mixed.count - 1);
        expect(result.efficiencyRating).toBe('moderate');
      }
    });
  });

  describe('formatCutDescription helper', () => {
    it('formats horizontal cut description accurately matching specification', () => {
      const desc = formatCutDescription(1, 'horizontal', 150, 5, 292);
      expect(desc).toBe('1º Corte Horizontal em Y = 150.0 mm (de X = 5.0 a 292.0 mm)');
    });

    it('formats vertical cut description accurately matching specification', () => {
      const desc = formatCutDescription(2, 'vertical', 100, 5, 150);
      expect(desc).toBe('2º Corte Vertical em X = 100.0 mm (de Y = 5.0 a 150.0 mm)');
    });
  });
});
