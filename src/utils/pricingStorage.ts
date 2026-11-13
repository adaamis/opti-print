import { roundCurrency } from '../engine/pricing';
import type { CurrencyCode, PricingConfig } from '../types/optimizer';

export const PRICING_STORAGE_KEY = 'optiprint_pricing_settings';

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  costPerSheet: 1.5,
  clickCost: 0.4,
  otherFixedCosts: 0.0,
  markupPercent: 40,
  currency: 'BRL',
};

const VALID_CURRENCIES: CurrencyCode[] = ['BRL', 'USD', 'EUR'];

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'de-DE',
};

function isValidCurrency(val: unknown): val is CurrencyCode {
  return typeof val === 'string' && VALID_CURRENCIES.includes(val as CurrencyCode);
}

/**
 * Loads the saved pricing configuration from localStorage safely.
 * Returns default configuration on SSR or if data is missing or corrupted.
 */
export function loadPricingConfig(): PricingConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_PRICING_CONFIG };
  }

  try {
    const raw = window.localStorage.getItem(PRICING_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PRICING_CONFIG };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_PRICING_CONFIG };
    }

    const obj = parsed as Record<string, unknown>;

    const costPerSheet =
      typeof obj.costPerSheet === 'number' && Number.isFinite(obj.costPerSheet) && obj.costPerSheet >= 0
        ? roundCurrency(obj.costPerSheet)
        : DEFAULT_PRICING_CONFIG.costPerSheet;

    const clickCost =
      typeof obj.clickCost === 'number' && Number.isFinite(obj.clickCost) && obj.clickCost >= 0
        ? roundCurrency(obj.clickCost)
        : DEFAULT_PRICING_CONFIG.clickCost;

    const otherFixedCosts =
      typeof obj.otherFixedCosts === 'number' && Number.isFinite(obj.otherFixedCosts) && obj.otherFixedCosts >= 0
        ? roundCurrency(obj.otherFixedCosts)
        : DEFAULT_PRICING_CONFIG.otherFixedCosts;

    const markupPercent =
      typeof obj.markupPercent === 'number' && Number.isFinite(obj.markupPercent) && obj.markupPercent >= 0
        ? roundCurrency(obj.markupPercent)
        : DEFAULT_PRICING_CONFIG.markupPercent;

    const currency: CurrencyCode = isValidCurrency(obj.currency)
      ? obj.currency
      : DEFAULT_PRICING_CONFIG.currency;

    return {
      costPerSheet,
      clickCost,
      otherFixedCosts,
      markupPercent,
      currency,
    };
  } catch (error) {
    console.error('Failed to load pricing config from localStorage:', error);
    return { ...DEFAULT_PRICING_CONFIG };
  }
}

/** Alias for loadPricingConfig */
export const loadSavedPricingConfig = loadPricingConfig;

/**
 * Persists updated pricing parameters to localStorage and returns the merged configuration.
 */
export function savePricingConfig(config: Partial<PricingConfig>): PricingConfig {
  const current = loadPricingConfig();

  const costPerSheet =
    typeof config.costPerSheet === 'number' && Number.isFinite(config.costPerSheet)
      ? roundCurrency(Math.max(0, config.costPerSheet))
      : current.costPerSheet;

  const clickCost =
    typeof config.clickCost === 'number' && Number.isFinite(config.clickCost)
      ? roundCurrency(Math.max(0, config.clickCost))
      : current.clickCost;

  const otherFixedCosts =
    typeof config.otherFixedCosts === 'number' && Number.isFinite(config.otherFixedCosts)
      ? roundCurrency(Math.max(0, config.otherFixedCosts))
      : current.otherFixedCosts;

  const markupPercent =
    typeof config.markupPercent === 'number' && Number.isFinite(config.markupPercent)
      ? roundCurrency(Math.max(0, config.markupPercent))
      : current.markupPercent;

  const currency: CurrencyCode = isValidCurrency(config.currency)
    ? config.currency
    : current.currency;

  const updated: PricingConfig = {
    costPerSheet,
    clickCost,
    otherFixedCosts,
    markupPercent,
    currency,
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save pricing config to localStorage:', error);
    }
  }

  return updated;
}

/**
 * Resets pricing configuration in localStorage to the defaults.
 */
export function resetPricingConfig(): PricingConfig {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(PRICING_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset pricing config in localStorage:', error);
    }
  }
  return { ...DEFAULT_PRICING_CONFIG };
}

/**
 * Formats a numeric monetary value according to the specified currency code and locale.
 */
export function formatCurrency(value: number, currency: CurrencyCode = 'BRL'): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const targetCurrency = isValidCurrency(currency) ? currency : 'BRL';
  const locale = CURRENCY_LOCALES[targetCurrency] || 'pt-BR';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: targetCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
}
