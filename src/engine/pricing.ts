import type {
  CurrencyCode,
  PricingCalculation,
  PricingConfig,
  PricingParams,
} from '../types/optimizer';

/**
 * Rounds a monetary or numeric value to 2 decimal places.
 */
export function roundCurrency(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Sanitizes numeric input to ensure finite, non-negative numbers.
 */
export function sanitizePositive(val: unknown, fallback = 0): number {
  if (typeof val !== 'number' || !Number.isFinite(val) || val < 0) {
    return fallback;
  }
  return val;
}

/**
 * Computes production costs, scrap waste valuation, and suggested retail pricing.
 * Can be called with a single params object or with individual arguments.
 */
export function calculatePricing(params: PricingParams): PricingCalculation;
export function calculatePricing(
  totalSheets: number,
  placedCount: number,
  wastePercent: number,
  config: PricingConfig
): PricingCalculation;
export function calculatePricing(
  arg1: number | PricingParams,
  arg2?: number,
  arg3?: number,
  arg4?: PricingConfig
): PricingCalculation {
  let rawSheets: number;
  let rawPlaced: number;
  let rawWaste: number;
  let rawConfig: PricingConfig | undefined;

  if (typeof arg1 === 'object' && arg1 !== null) {
    rawSheets = arg1.totalSheets;
    rawPlaced = arg1.placedCount;
    rawWaste = arg1.wastePercent;
    rawConfig = arg1.config;
  } else {
    rawSheets = arg1;
    rawPlaced = arg2 ?? 0;
    rawWaste = arg3 ?? 0;
    rawConfig = arg4;
  }

  const totalSheets = sanitizePositive(rawSheets);
  const placedCount = sanitizePositive(rawPlaced);
  const wastePercent = sanitizePositive(rawWaste);

  const costPerSheet = sanitizePositive(rawConfig?.costPerSheet);
  const clickCost = sanitizePositive(rawConfig?.clickCost);
  const otherFixedCosts = sanitizePositive(rawConfig?.otherFixedCosts);
  const markupPercent = sanitizePositive(rawConfig?.markupPercent);
  const currency: CurrencyCode = rawConfig?.currency ?? 'BRL';

  // Raw material & impression costs
  const rawMaterialCost = roundCurrency(totalSheets * costPerSheet);
  const totalClickCost = roundCurrency(totalSheets * clickCost);
  const totalProductionCost = roundCurrency(rawMaterialCost + totalClickCost + otherFixedCosts);

  // Financial waste scrap value (monetary value of unused substrate sheet area)
  const wasteCostValue = roundCurrency(rawMaterialCost * (wastePercent / 100));

  // Suggested price with profit markup
  const suggestedTotalPrice = roundCurrency(totalProductionCost * (1 + markupPercent / 100));

  // Unit pricing safely guarding against 0 placed items
  const unitCost = placedCount > 0 ? roundCurrency(totalProductionCost / placedCount) : 0;
  const unitPrice = placedCount > 0 ? roundCurrency(suggestedTotalPrice / placedCount) : 0;

  return {
    rawMaterialCost,
    totalClickCost,
    totalProductionCost,
    wasteCostValue,
    suggestedTotalPrice,
    unitCost,
    unitPrice,
    currency,
  };
}
