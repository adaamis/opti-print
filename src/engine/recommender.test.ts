import { describe, expect, it } from 'vitest';
import { BUILTIN_SHEET_PRESETS } from '../constants/sheets';
import type { PricingConfig, SheetPreset } from '../types/optimizer';
import { recommendSubstrates } from './recommender';

describe('recommendSubstrates', () => {
  const defaultPricing: PricingConfig = {
    costPerSheet: 1.5,
    clickCost: 0.25,
    otherFixedCosts: 15.0,
    markupPercent: 40.0,
    currency: 'BRL',
  };

  describe('1. Typical 1,000 business cards (90x50 mm) recommendation ranking', () => {
    it('generates sequential ranks, computes correct yields, and sorts by sheets needed when no costs provided', () => {
      const results = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 1000,
        marginMm: 5,
        spacingMm: 2,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBe(BUILTIN_SHEET_PRESETS.length);

      // Verify sequential ranks 1, 2, 3...
      results.forEach((rec, idx) => {
        expect(rec.rank).toBe(idx + 1);
        expect(rec.itemsPerSheet).toBeGreaterThan(0);
        expect(rec.sheetsNeeded).toBeGreaterThan(0);
        expect(rec.totalProduced).toBe(rec.sheetsNeeded * rec.itemsPerSheet);
        expect(rec.totalProduced).toBeGreaterThanOrEqual(1000);
        expect(rec.pricing).toBeUndefined();
      });

      // Without pricing costs, sorting must be sheetsNeeded ASC, then total area ASC
      for (let i = 0; i < results.length - 1; i++) {
        const curr = results[i];
        const next = results[i + 1];
        if (curr.sheetsNeeded === next.sheetsNeeded) {
          const areaCurr = curr.sheetsNeeded * curr.sheetWidthMm * curr.sheetHeightMm;
          const areaNext = next.sheetsNeeded * next.sheetWidthMm * next.sheetHeightMm;
          expect(areaCurr).toBeLessThanOrEqual(areaNext + 1e-3);
        } else {
          expect(curr.sheetsNeeded).toBeLessThan(next.sheetsNeeded);
        }
      }

      // Check specific known presets: A4 (11 items) and A3 (23 items)
      const a4Rec = results.find((r) => r.presetId === 'A4');
      expect(a4Rec).toBeDefined();
      expect(a4Rec?.itemsPerSheet).toBe(11);
      expect(a4Rec?.sheetsNeeded).toBe(Math.ceil(1000 / 11)); // 91 sheets
      expect(a4Rec?.totalProduced).toBe(91 * 11); // 1001
      expect(a4Rec?.bestStrategy).toBe('mixed');

      const a3Rec = results.find((r) => r.presetId === 'A3');
      expect(a3Rec).toBeDefined();
      expect(a3Rec?.itemsPerSheet).toBe(23);
      expect(a3Rec?.sheetsNeeded).toBe(Math.ceil(1000 / 23)); // 44 sheets
      expect(a3Rec?.totalProduced).toBe(44 * 23); // 1012
      expect(a3Rec?.bestStrategy).toBe('mixed');

      // A3 requires fewer sheets than A4, so A3 should rank higher (lower rank number)
      expect(a3Rec!.rank).toBeLessThan(a4Rec!.rank);
    });
  });

  describe('2. Cost-based ranking vs. waste-based ranking', () => {
    it('calculates pricing details and sorts by totalProductionCost ASC when costs are present', () => {
      const results = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 1000,
        pricingConfig: defaultPricing,
      });

      expect(results.length).toBeGreaterThan(0);

      // Every recommendation must have populated pricing
      for (const rec of results) {
        expect(rec.pricing).toBeDefined();
        expect(rec.pricing?.rawMaterialCost).toBeGreaterThan(0);
        expect(rec.pricing?.totalProductionCost).toBeGreaterThan(0);
        expect(rec.pricing?.unitPrice).toBeGreaterThan(0);
        expect(rec.pricing?.currency).toBe('BRL');
      }

      // Check sorting by totalProductionCost ASC, then total area ASC
      for (let i = 0; i < results.length - 1; i++) {
        const curr = results[i];
        const next = results[i + 1];
        const costCurr = curr.pricing!.totalProductionCost;
        const costNext = next.pricing!.totalProductionCost;

        if (Math.abs(costCurr - costNext) < 1e-6) {
          const areaCurr = curr.sheetsNeeded * curr.sheetWidthMm * curr.sheetHeightMm;
          const areaNext = next.sheetsNeeded * next.sheetWidthMm * next.sheetHeightMm;
          expect(areaCurr).toBeLessThanOrEqual(areaNext + 1e-3);
        } else {
          expect(costCurr).toBeLessThan(costNext);
        }
      }
    });

    it('breaks ties using consumed area ASC when sheetsNeeded and costs are identical', () => {
      // Preset A: 100x100mm fits 1 item (100x100) -> 10,000 mm²
      // Preset B: 100x150mm fits 1 item (100x100) -> 15,000 mm²
      const mockPresets: SheetPreset[] = [
        {
          id: 'SHEET_HIGH_WASTE',
          name: 'High Waste Sheet',
          description: '100x150 mm',
          widthMm: 100,
          heightMm: 150,
          category: 'Test',
        },
        {
          id: 'SHEET_LOW_WASTE',
          name: 'Low Waste Sheet',
          description: '100x100 mm',
          widthMm: 100,
          heightMm: 100,
          category: 'Test',
        },
      ];

      const results = recommendSubstrates({
        itemWidthMm: 100,
        itemHeightMm: 100,
        targetQuantity: 1,
        marginMm: 0,
        spacingMm: 0,
        presets: mockPresets,
      });

      expect(results.length).toBe(2);
      const lowWaste = results.find((r) => r.presetId === 'SHEET_LOW_WASTE')!;
      const highWaste = results.find((r) => r.presetId === 'SHEET_HIGH_WASTE')!;

      expect(lowWaste.itemsPerSheet).toBe(1);
      expect(highWaste.itemsPerSheet).toBe(1);
      expect(lowWaste.sheetsNeeded).toBe(1);
      expect(highWaste.sheetsNeeded).toBe(1);

      expect(lowWaste.wastePercent).toBe(0);
      expect(highWaste.wastePercent).toBeCloseTo(33.33, 1);

      // Low waste (smaller area) ranks #1, high waste ranks #2
      expect(lowWaste.rank).toBe(1);
      expect(highWaste.rank).toBe(2);
    });

    it('breaks ties using wastePercent ASC when sheetsNeeded, costs, and consumed area are identical', () => {
      // Both presets have identical area: 100x100 = 10,000 mm² vs 50x200 = 10,000 mm²
      // Item: 40x40 mm, margin: 0, spacing: 0
      // Preset A (100x100): fits 2x2 = 4 items. Placed area = 4 * 1600 = 6400 mm². Waste = 36%
      // Preset B (50x200): fits 1x5 = 5 items. Placed area = 5 * 1600 = 8000 mm². Waste = 20%
      const mockPresets: SheetPreset[] = [
        {
          id: 'PRESET_A',
          name: 'Square 100x100',
          description: '100x100 mm',
          widthMm: 100,
          heightMm: 100,
          category: 'Test',
        },
        {
          id: 'PRESET_B',
          name: 'Strip 50x200',
          description: '50x200 mm',
          widthMm: 50,
          heightMm: 200,
          category: 'Test',
        },
      ];

      const results = recommendSubstrates({
        itemWidthMm: 40,
        itemHeightMm: 40,
        targetQuantity: 1,
        marginMm: 0,
        spacingMm: 0,
        presets: mockPresets,
      });

      expect(results.length).toBe(2);
      expect(results[0].presetId).toBe('PRESET_B'); // lower waste 20% < 36%
      expect(results[1].presetId).toBe('PRESET_A');
    });

    it('ranks purely by sheetsNeeded and wastePercent when costPerSheet and clickCost are zero', () => {
      const freePricing: PricingConfig = {
        costPerSheet: 0,
        clickCost: 0,
        otherFixedCosts: 0,
        markupPercent: 20,
        currency: 'BRL',
      };

      const results = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 1000,
        pricingConfig: freePricing,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].pricing).toBeDefined();
      expect(results[0].pricing?.totalProductionCost).toBe(0);

      // Should sort by sheetsNeeded ASC, not by totalProductionCost
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].sheetsNeeded).toBeLessThanOrEqual(results[i + 1].sheetsNeeded);
      }
    });
  });

  describe('3. Handling of presets where item does not fit (itemsPerSheet === 0)', () => {
    it('filters out presets where the item is too large to fit', () => {
      // 500x500 mm cannot fit on A4 (210x297), A5, A6, A3 (297x420)
      const results = recommendSubstrates({
        itemWidthMm: 500,
        itemHeightMm: 500,
        targetQuantity: 50,
        marginMm: 5,
        spacingMm: 2,
      });

      expect(results.length).toBeGreaterThan(0);

      // Verify that small formats were excluded
      const ids = results.map((r) => r.presetId);
      expect(ids).not.toContain('A4');
      expect(ids).not.toContain('A5');
      expect(ids).not.toContain('A6');
      expect(ids).not.toContain('A3');

      // Verify large formats are included (A1: 594x841, etc.)
      expect(ids).not.toContain('A0');
      expect(ids).toContain('A1');

      // Verify all included presets have itemsPerSheet > 0 and finite sheetsNeeded
      for (const rec of results) {
        expect(rec.itemsPerSheet).toBeGreaterThan(0);
        expect(Number.isFinite(rec.sheetsNeeded)).toBe(true);
        expect(rec.sheetsNeeded).toBeGreaterThan(0);
      }
    });

    it('returns empty array when item is larger than every available preset', () => {
      const results = recommendSubstrates({
        itemWidthMm: 2000,
        itemHeightMm: 2000,
        targetQuantity: 10,
      });

      expect(results).toEqual([]);
    });

    it('returns empty array for non-positive or invalid item dimensions', () => {
      expect(
        recommendSubstrates({ itemWidthMm: 0, itemHeightMm: 50, targetQuantity: 100 })
      ).toEqual([]);
      expect(
        recommendSubstrates({ itemWidthMm: 90, itemHeightMm: -5, targetQuantity: 100 })
      ).toEqual([]);
      expect(
        recommendSubstrates({ itemWidthMm: NaN, itemHeightMm: 50, targetQuantity: 100 })
      ).toEqual([]);
      expect(
        recommendSubstrates({ itemWidthMm: 90, itemHeightMm: Infinity, targetQuantity: 100 })
      ).toEqual([]);
    });

    it('returns empty array for non-positive or invalid target quantity', () => {
      expect(
        recommendSubstrates({ itemWidthMm: 90, itemHeightMm: 50, targetQuantity: 0 })
      ).toEqual([]);
      expect(
        recommendSubstrates({ itemWidthMm: 90, itemHeightMm: 50, targetQuantity: -100 })
      ).toEqual([]);
      expect(
        recommendSubstrates({ itemWidthMm: 90, itemHeightMm: 50, targetQuantity: NaN })
      ).toEqual([]);
    });
  });

  describe('4. Category filtering', () => {
    it('filters recommendations strictly by specified category', () => {
      const resultsIsoA = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 500,
        categoryFilter: 'Série ISO A',
      });

      expect(resultsIsoA.length).toBeGreaterThan(0);
      for (const rec of resultsIsoA) {
        expect(rec.category).toBe('Série ISO A');
      }

      const resultsDigital = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 500,
        categoryFilter: 'Digital / SRA',
      });

      expect(resultsDigital.length).toBe(3); // SRA3, SRA4, SUPER_B
      for (const rec of resultsDigital) {
        expect(rec.category).toBe('Digital / SRA');
      }
    });

    it('handles case-insensitive and trimmed category filter', () => {
      const results = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 500,
        categoryFilter: '  série iso a  ',
      });

      expect(results.length).toBeGreaterThan(0);
      for (const rec of results) {
        expect(rec.category).toBe('Série ISO A');
      }
    });

    it('includes all categories when filter is "all" or undefined', () => {
      const allResults = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 500,
        categoryFilter: 'all',
      });

      const categories = new Set(allResults.map((r) => r.category));
      expect(categories.size).toBeGreaterThan(1);
    });

    it('returns empty array if categoryFilter does not match any presets', () => {
      const results = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 500,
        categoryFilter: 'Non-Existent Category',
      });

      expect(results).toEqual([]);
    });
  });

  describe('5. Orientation & custom preset support', () => {
    it('evaluates both orientations and selects the one with higher count or utilization', () => {
      const asymmetricPreset: SheetPreset = {
        id: 'CUSTOM_ASYMMETRIC',
        name: 'Asymmetric 100x170',
        description: 'Custom test sheet',
        widthMm: 100,
        heightMm: 170,
        isCustomSaved: true,
      };

      // Item 70x70 with margin 5 -> usable width 90, usable height 160.
      // Fits 1 col x 2 rows (70 + 2 + 70 = 142 <= 160) = 2 items.
      const results = recommendSubstrates({
        itemWidthMm: 70,
        itemHeightMm: 70,
        targetQuantity: 10,
        presets: [asymmetricPreset],
      });

      expect(results.length).toBe(1);
      expect(results[0].itemsPerSheet).toBe(2);
      expect(results[0].isCustom).toBe(true);
      expect(results[0].rank).toBe(1);
    });
  });

  describe('6. Dynamic ranking sensitivity to targetQuantity (Run Quantity)', () => {
    it('dynamically adapts champion preset based on run quantity (small run prefers compact sheets, large run prefers bulk offset)', () => {
      // Small run: 10 units of 90x50 mm business card
      const smallRun = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 10,
        marginMm: 5,
        spacingMm: 2,
        pricingConfig: defaultPricing,
      });

      expect(smallRun.length).toBeGreaterThan(0);
      const smallChampion = smallRun[0];
      // Compact sheet (A4, SRA4, or US_LETTER) is #1, not A1
      expect(['A4', 'SRA4', 'US_LETTER']).toContain(smallChampion.presetId);
      expect(smallChampion.presetId).not.toBe('A1');

      // Large run: 1,000 units of 90x50 mm business card
      const largeRun = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 1000,
        marginMm: 5,
        spacingMm: 2,
        pricingConfig: defaultPricing,
      });

      expect(largeRun.length).toBeGreaterThan(0);
      const largeChampion = largeRun[0];
      // At 1,000 units, largest sheet in general or bulk offset is champion (e.g. OFFSET_70X100 or A1)
      expect(largeChampion.itemsPerSheet).toBeGreaterThan(smallChampion.itemsPerSheet);

      // Changing targetQuantity dynamically changes the champion (#1)
      expect(smallChampion.presetId).not.toBe(largeChampion.presetId);
    });

    it('dynamically adapts champion preset without pricing config based on consumed area', () => {
      const smallRun = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 10,
        marginMm: 5,
        spacingMm: 2,
      });

      const largeRun = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 1000,
        marginMm: 5,
        spacingMm: 2,
      });

      expect(['A4', 'SRA4', 'US_LETTER']).toContain(smallRun[0].presetId);
      expect(largeRun[0].itemsPerSheet).toBeGreaterThan(smallRun[0].itemsPerSheet);
      expect(smallRun[0].presetId).not.toBe(largeRun[0].presetId);
    });

    it('ranks A4 as #1 within ISO A category for small runs and A1 for large runs', () => {
      const smallIsoA = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 10,
        marginMm: 5,
        spacingMm: 2,
        categoryFilter: 'Série ISO A',
      });
      const largeIsoA = recommendSubstrates({
        itemWidthMm: 90,
        itemHeightMm: 50,
        targetQuantity: 1000,
        marginMm: 5,
        spacingMm: 2,
        categoryFilter: 'Série ISO A',
      });

      expect(smallIsoA[0].presetId).toBe('A4');
      expect(largeIsoA[0].presetId).toBe('A1');
      expect(smallIsoA[0].presetId).not.toBe(largeIsoA[0].presetId);
    });
  });
});
