import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PRICING_CONFIG,
  PRICING_STORAGE_KEY,
  formatCurrency,
  loadPricingConfig,
  loadSavedPricingConfig,
  resetPricingConfig,
  savePricingConfig,
} from './pricingStorage';

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

describe('pricingStorage utilities', () => {
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
    vi.restoreAllMocks();
  });

  describe('loadPricingConfig', () => {
    it('returns default pricing config when storage is empty', () => {
      const config = loadPricingConfig();
      expect(config).toEqual(DEFAULT_PRICING_CONFIG);
      expect(loadSavedPricingConfig()).toEqual(DEFAULT_PRICING_CONFIG);
    });

    it('returns default config when running in SSR environment (window is undefined)', () => {
      (globalThis as unknown as { window: unknown }).window = undefined;
      const config = loadPricingConfig();
      expect(config).toEqual(DEFAULT_PRICING_CONFIG);
    });

    it('recovers gracefully from corrupted JSON in localStorage', () => {
      mockStorage.setItem(PRICING_STORAGE_KEY, '{invalid json');
      const config = loadPricingConfig();
      expect(config).toEqual(DEFAULT_PRICING_CONFIG);
    });

    it('recovers gracefully from non-object JSON values', () => {
      mockStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(['array', 'not', 'object']));
      expect(loadPricingConfig()).toEqual(DEFAULT_PRICING_CONFIG);

      mockStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(12345));
      expect(loadPricingConfig()).toEqual(DEFAULT_PRICING_CONFIG);
    });

    it('sanitizes partially invalid or negative fields in stored object', () => {
      mockStorage.setItem(
        PRICING_STORAGE_KEY,
        JSON.stringify({
          costPerSheet: -5.0, // negative -> should fallback to default
          clickCost: 0.75, // valid
          otherFixedCosts: 'invalid' as unknown as number, // not a number -> default
          markupPercent: 50, // valid
          currency: 'INVALID_CURRENCY', // invalid currency -> default BRL
        })
      );

      const config = loadPricingConfig();
      expect(config.costPerSheet).toBe(DEFAULT_PRICING_CONFIG.costPerSheet);
      expect(config.clickCost).toBe(0.75);
      expect(config.otherFixedCosts).toBe(DEFAULT_PRICING_CONFIG.otherFixedCosts);
      expect(config.markupPercent).toBe(50);
      expect(config.currency).toBe('BRL');
    });
  });

  describe('savePricingConfig and resetPricingConfig', () => {
    it('saves full config and loads back accurately', () => {
      const custom = {
        costPerSheet: 3.25,
        clickCost: 0.85,
        otherFixedCosts: 15.0,
        markupPercent: 65,
        currency: 'USD' as const,
      };

      const saved = savePricingConfig(custom);
      expect(saved).toEqual(custom);

      const loaded = loadPricingConfig();
      expect(loaded).toEqual(custom);
    });

    it('merges partial config updates with existing values', () => {
      savePricingConfig({ costPerSheet: 2.5 });
      const step1 = loadPricingConfig();
      expect(step1.costPerSheet).toBe(2.5);
      expect(step1.clickCost).toBe(DEFAULT_PRICING_CONFIG.clickCost);

      savePricingConfig({ clickCost: 1.1, currency: 'EUR' });
      const step2 = loadPricingConfig();
      expect(step2.costPerSheet).toBe(2.5);
      expect(step2.clickCost).toBe(1.1);
      expect(step2.currency).toBe('EUR');
    });

    it('sanitizes negative values on save by clamping to 0', () => {
      const saved = savePricingConfig({
        costPerSheet: -10,
        clickCost: -5,
        otherFixedCosts: -20,
        markupPercent: -30,
      });

      expect(saved.costPerSheet).toBe(0);
      expect(saved.clickCost).toBe(0);
      expect(saved.otherFixedCosts).toBe(0);
      expect(saved.markupPercent).toBe(0);
    });

    it('handles localStorage.setItem exceptions safely', () => {
      mockStorage.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      const result = savePricingConfig({ costPerSheet: 5.0 });
      expect(result.costPerSheet).toBe(5.0);
    });

    it('resets configuration to defaults and removes storage key', () => {
      savePricingConfig({ costPerSheet: 8.0, currency: 'USD' });
      expect(loadPricingConfig().costPerSheet).toBe(8.0);

      const reset = resetPricingConfig();
      expect(reset).toEqual(DEFAULT_PRICING_CONFIG);
      expect(mockStorage.removeItem).toHaveBeenCalledWith(PRICING_STORAGE_KEY);
      expect(loadPricingConfig()).toEqual(DEFAULT_PRICING_CONFIG);
    });
  });

  describe('formatCurrency', () => {
    it('formats BRL currency using Brazilian locale formatting', () => {
      const formatted = formatCurrency(1234.56, 'BRL');
      expect(formatted).toContain('1.234,56');
      expect(formatted).toContain('R$');
    });

    it('formats USD currency using US locale formatting', () => {
      const formatted = formatCurrency(1234.56, 'USD');
      expect(formatted).toContain('1,234.56');
      expect(formatted).toContain('$');
    });

    it('formats EUR currency using European locale formatting', () => {
      const formatted = formatCurrency(1234.56, 'EUR');
      expect(formatted).toContain('1.234,56');
      expect(formatted).toContain('€');
    });

    it('defaults to BRL when currency is omitted', () => {
      const formatted = formatCurrency(50.0);
      expect(formatted).toContain('50,00');
      expect(formatted).toContain('R$');
    });

    it('safely handles non-finite or NaN values by formatting 0', () => {
      expect(formatCurrency(NaN, 'BRL')).toContain('0,00');
      expect(formatCurrency(Infinity, 'BRL')).toContain('0,00');
      expect(formatCurrency(-Infinity, 'USD')).toContain('0.00');
    });
  });
});
