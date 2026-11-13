import { describe, expect, it } from 'vitest';
import type { PricingConfig } from '../types/optimizer';
import { calculatePricing, roundCurrency, sanitizePositive } from './pricing';

describe('Pricing Engine', () => {
  const defaultConfig: PricingConfig = {
    costPerSheet: 1.5,
    clickCost: 0.4,
    otherFixedCosts: 0.0,
    markupPercent: 40,
    currency: 'BRL',
  };

  describe('roundCurrency & sanitizePositive utilities', () => {
    it('rounds monetary values to exactly 2 decimal places', () => {
      expect(roundCurrency(10.556)).toBe(10.56);
      expect(roundCurrency(10.554)).toBe(10.55);
      expect(roundCurrency(0)).toBe(0);
      expect(roundCurrency(NaN)).toBe(0);
      expect(roundCurrency(Infinity)).toBe(0);
    });

    it('sanitizes negative or non-finite numbers', () => {
      expect(sanitizePositive(-10)).toBe(0);
      expect(sanitizePositive(NaN, 5)).toBe(5);
      expect(sanitizePositive('invalid' as unknown as number, 2)).toBe(2);
      expect(sanitizePositive(12.5)).toBe(12.5);
    });
  });

  describe('calculatePricing with standard config', () => {
    it('computes material, click, production costs and suggested sale price', () => {
      const config: PricingConfig = {
        costPerSheet: 1.5,
        clickCost: 0.4,
        otherFixedCosts: 10.0,
        markupPercent: 40,
        currency: 'BRL',
      };

      const result = calculatePricing({
        totalSheets: 10,
        placedCount: 200,
        wastePercent: 20,
        config,
      });

      // rawMaterialCost = 10 * 1.50 = 15.00
      expect(result.rawMaterialCost).toBe(15.0);
      // totalClickCost = 10 * 0.40 = 4.00
      expect(result.totalClickCost).toBe(4.0);
      // totalProductionCost = 15.00 + 4.00 + 10.00 = 29.00
      expect(result.totalProductionCost).toBe(29.0);
      // wasteCostValue = 15.00 * (20 / 100) = 3.00
      expect(result.wasteCostValue).toBe(3.0);
      // suggestedTotalPrice = 29.00 * 1.40 = 40.60
      expect(result.suggestedTotalPrice).toBe(40.6);
      // unitCost = 29.00 / 200 = 0.145 -> 0.15
      expect(result.unitCost).toBe(0.15);
      // unitPrice = 40.60 / 200 = 0.203 -> 0.20
      expect(result.unitPrice).toBe(0.2);
      expect(result.currency).toBe('BRL');
    });

    it('supports positional arguments signature identically to params object', () => {
      const fromObj = calculatePricing({
        totalSheets: 5,
        placedCount: 50,
        wastePercent: 15,
        config: defaultConfig,
      });

      const fromPositional = calculatePricing(5, 50, 15, defaultConfig);

      expect(fromPositional).toEqual(fromObj);
    });
  });

  describe('zero sheets and zero placed items', () => {
    it('safely handles 0 sheets and 0 items with zero costs', () => {
      const result = calculatePricing({
        totalSheets: 0,
        placedCount: 0,
        wastePercent: 0,
        config: defaultConfig,
      });

      expect(result.rawMaterialCost).toBe(0);
      expect(result.totalClickCost).toBe(0);
      expect(result.totalProductionCost).toBe(0);
      expect(result.wasteCostValue).toBe(0);
      expect(result.suggestedTotalPrice).toBe(0);
      expect(result.unitCost).toBe(0);
      expect(result.unitPrice).toBe(0);
      expect(result.currency).toBe('BRL');
    });

    it('safely handles fixed costs when placedCount is 0 without division by zero', () => {
      const configWithSetup: PricingConfig = {
        ...defaultConfig,
        otherFixedCosts: 25.0,
      };

      const result = calculatePricing({
        totalSheets: 0,
        placedCount: 0,
        wastePercent: 0,
        config: configWithSetup,
      });

      expect(result.totalProductionCost).toBe(25.0);
      // 25.00 * 1.40 = 35.00
      expect(result.suggestedTotalPrice).toBe(35.0);
      expect(result.unitCost).toBe(0);
      expect(result.unitPrice).toBe(0);
    });
  });

  describe('markup variations', () => {
    it('handles 0% markup (sale price equals production cost)', () => {
      const config: PricingConfig = {
        costPerSheet: 2.0,
        clickCost: 0.5,
        otherFixedCosts: 5.0,
        markupPercent: 0,
        currency: 'USD',
      };

      const result = calculatePricing({
        totalSheets: 5,
        placedCount: 50,
        wastePercent: 10,
        config,
      });

      // rawMaterialCost = 10, totalClickCost = 2.5, otherFixed = 5 => 17.50
      expect(result.totalProductionCost).toBe(17.5);
      expect(result.suggestedTotalPrice).toBe(17.5);
      expect(result.currency).toBe('USD');
    });

    it('handles high markup percentage (e.g. 150%)', () => {
      const config: PricingConfig = {
        costPerSheet: 5.0,
        clickCost: 1.0,
        otherFixedCosts: 0,
        markupPercent: 150,
        currency: 'EUR',
      };

      const result = calculatePricing({
        totalSheets: 2,
        placedCount: 20,
        wastePercent: 30,
        config,
      });

      // rawMaterialCost = 10, click = 2 => production = 12
      expect(result.totalProductionCost).toBe(12.0);
      // suggested = 12 * (1 + 1.50) = 30.00
      expect(result.suggestedTotalPrice).toBe(30.0);
      expect(result.unitCost).toBe(0.6);
      expect(result.unitPrice).toBe(1.5);
      expect(result.currency).toBe('EUR');
    });
  });

  describe('scrap waste valuation', () => {
    it('calculates proportional waste scrap value', () => {
      const config: PricingConfig = {
        costPerSheet: 2.0,
        clickCost: 0,
        otherFixedCosts: 0,
        markupPercent: 0,
        currency: 'BRL',
      };

      // 10 sheets * R$ 2.00 = R$ 20.00 raw material
      const res0 = calculatePricing({ totalSheets: 10, placedCount: 100, wastePercent: 0, config });
      expect(res0.wasteCostValue).toBe(0);

      const res25 = calculatePricing({ totalSheets: 10, placedCount: 100, wastePercent: 25, config });
      expect(res25.wasteCostValue).toBe(5.0);

      const res33 = calculatePricing({ totalSheets: 10, placedCount: 100, wastePercent: 33.33, config });
      // 20.00 * 0.3333 = 6.666 -> 6.67
      expect(res33.wasteCostValue).toBe(6.67);

      const res100 = calculatePricing({ totalSheets: 10, placedCount: 100, wastePercent: 100, config });
      expect(res100.wasteCostValue).toBe(20.0);
    });
  });

  describe('negative inputs and sanitization', () => {
    it('sanitizes negative values to 0 without breaking calculations', () => {
      const negativeConfig: PricingConfig = {
        costPerSheet: -2.5,
        clickCost: -0.8,
        otherFixedCosts: -15,
        markupPercent: -50,
        currency: 'BRL',
      };

      const result = calculatePricing({
        totalSheets: -5,
        placedCount: -20,
        wastePercent: -10,
        config: negativeConfig,
      });

      expect(result.rawMaterialCost).toBe(0);
      expect(result.totalClickCost).toBe(0);
      expect(result.totalProductionCost).toBe(0);
      expect(result.wasteCostValue).toBe(0);
      expect(result.suggestedTotalPrice).toBe(0);
      expect(result.unitCost).toBe(0);
      expect(result.unitPrice).toBe(0);
    });

    it('handles non-finite values safely', () => {
      const weirdConfig: PricingConfig = {
        costPerSheet: NaN,
        clickCost: Infinity,
        otherFixedCosts: -Infinity,
        markupPercent: NaN,
        currency: 'BRL',
      };

      const result = calculatePricing({
        totalSheets: NaN,
        placedCount: NaN,
        wastePercent: NaN,
        config: weirdConfig,
      });

      expect(result.rawMaterialCost).toBe(0);
      expect(result.totalClickCost).toBe(0);
      expect(result.totalProductionCost).toBe(0);
      expect(result.wasteCostValue).toBe(0);
      expect(result.suggestedTotalPrice).toBe(0);
      expect(result.unitCost).toBe(0);
      expect(result.unitPrice).toBe(0);
    });
  });
});
