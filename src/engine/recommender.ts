import { BUILTIN_SHEET_PRESETS } from '../constants/sheets';
import type {
  RecommenderOptions,
  SheetConfig,
  SubstrateRecommendation,
} from '../types/optimizer';
import { computeQuickYield } from './packer';
import { calculatePricing } from './pricing';

export type { RecommenderOptions, SubstrateRecommendation };

/**
 * Recommends and ranks the best substrate sheet formats for a given target print item and quantity.
 *
 * Evaluates each preset across both natural and rotated orientations to find maximum item yield,
 * computes required sheets and financial pricing (if pricingConfig supplied),
 * and ranks options by cost or sheets needed (with waste percentage as tie-breaker).
 */
export function recommendSubstrates(options: RecommenderOptions): SubstrateRecommendation[] {
  // Safeguards for invalid dimensions or target quantity
  if (
    !Number.isFinite(options.itemWidthMm) ||
    options.itemWidthMm <= 0 ||
    !Number.isFinite(options.itemHeightMm) ||
    options.itemHeightMm <= 0 ||
    !Number.isFinite(options.targetQuantity) ||
    options.targetQuantity <= 0
  ) {
    return [];
  }

  const marginMm = Number.isFinite(options.marginMm) ? Math.max(0, options.marginMm!) : 5;
  const spacingMm = Number.isFinite(options.spacingMm) ? Math.max(0, options.spacingMm!) : 2;
  const presets = options.presets ?? BUILTIN_SHEET_PRESETS;

  // Filter presets by category if specified
  const rawFilter = options.categoryFilter?.trim();
  const filter =
    rawFilter && rawFilter.toLowerCase() !== 'all' && rawFilter.toLowerCase() !== 'todos'
      ? rawFilter
      : undefined;
  const activePresets = filter
    ? presets.filter(
        (p) =>
          p.category === filter ||
          (p.category && p.category.toLowerCase() === filter.toLowerCase()) ||
          (filter.toLowerCase().includes('salvo') &&
            (Boolean(p.isCustomSaved) || Boolean(p.category?.toLowerCase().includes('salvo'))))
      )
    : presets;

  const recommendations: SubstrateRecommendation[] = [];

  for (const preset of activePresets) {
    if (
      !Number.isFinite(preset.widthMm) ||
      preset.widthMm <= 0 ||
      !Number.isFinite(preset.heightMm) ||
      preset.heightMm <= 0
    ) {
      continue;
    }

    // Evaluate both orientations (portrait & landscape) to find the layout with the highest item count
    const isLandscapeDefault = preset.widthMm > preset.heightMm;

    const sheetA: SheetConfig = {
      presetId: preset.id,
      widthMm: preset.widthMm,
      heightMm: preset.heightMm,
      marginMm,
      spacingMm,
      orientation: isLandscapeDefault ? 'landscape' : 'portrait',
    };
    const yieldA = computeQuickYield(sheetA, options.itemWidthMm, options.itemHeightMm);

    const sheetB: SheetConfig = {
      presetId: preset.id,
      widthMm: preset.heightMm,
      heightMm: preset.widthMm,
      marginMm,
      spacingMm,
      orientation: isLandscapeDefault ? 'portrait' : 'landscape',
    };
    const yieldB = computeQuickYield(sheetB, options.itemWidthMm, options.itemHeightMm);

    const resA = yieldA[yieldA.bestStrategy];
    const resB = yieldB[yieldB.bestStrategy];

    let winningSheet = sheetA;
    let winningYield = yieldA;
    let winningRes = resA;

    if (resB.count > resA.count) {
      winningSheet = sheetB;
      winningYield = yieldB;
      winningRes = resB;
    } else if (resB.count === resA.count && resB.count > 0) {
      // Tie-breaker on orientation: prefer higher utilization (lower waste)
      if (resB.utilizationPercent > resA.utilizationPercent + 1e-6) {
        winningSheet = sheetB;
        winningYield = yieldB;
        winningRes = resB;
      }
    }

    // Safeguard: item does not fit in this sheet preset
    if (winningRes.count <= 0) {
      continue;
    }

    const itemsPerSheet = winningRes.count;
    const sheetsNeeded = Math.ceil(options.targetQuantity / itemsPerSheet);
    const totalProduced = sheetsNeeded * itemsPerSheet;
    const utilizationPercent = winningRes.utilizationPercent;
    const wastePercent = winningRes.wastePercent;
    const bestStrategy = winningYield.bestStrategy;

    let pricing = undefined;
    if (options.pricingConfig) {
      pricing = calculatePricing({
        totalSheets: sheetsNeeded,
        placedCount: totalProduced,
        wastePercent,
        config: options.pricingConfig,
      });
    }

    recommendations.push({
      presetId: preset.id,
      presetName: preset.name,
      category: preset.category ?? 'Outros',
      sheetWidthMm: winningSheet.widthMm,
      sheetHeightMm: winningSheet.heightMm,
      itemsPerSheet,
      sheetsNeeded,
      totalProduced,
      utilizationPercent,
      wastePercent,
      bestStrategy,
      pricing,
      isCustom: Boolean(preset.isCustomSaved || preset.id === 'CUSTOM'),
      rank: 0,
    });
  }

  // Sort recommendations:
  // If pricingConfig has costs (costPerSheet > 0 || clickCost > 0), sort by pricing.totalProductionCost ASC,
  // then total area consumed ASC, then wastePercent ASC, then sheetsNeeded ASC.
  // Otherwise, sort by sheetsNeeded ASC, then total area consumed ASC, then wastePercent ASC, then itemsPerSheet DESC.
  const hasCosts = Boolean(
    options.pricingConfig &&
      ((options.pricingConfig.costPerSheet ?? 0) > 0 || (options.pricingConfig.clickCost ?? 0) > 0)
  );

  recommendations.sort((a, b) => {
    const areaA = a.sheetsNeeded * a.sheetWidthMm * a.sheetHeightMm;
    const areaB = b.sheetsNeeded * b.sheetWidthMm * b.sheetHeightMm;

    if (hasCosts) {
      const costA = a.pricing?.totalProductionCost ?? 0;
      const costB = b.pricing?.totalProductionCost ?? 0;
      if (Math.abs(costA - costB) > 1e-6) {
        return costA - costB;
      }
      if (Math.abs(areaA - areaB) > 1e-3) {
        return areaA - areaB;
      }
      if (Math.abs(a.wastePercent - b.wastePercent) > 1e-6) {
        return a.wastePercent - b.wastePercent;
      }
      return a.sheetsNeeded - b.sheetsNeeded;
    } else {
      if (a.sheetsNeeded !== b.sheetsNeeded) {
        return a.sheetsNeeded - b.sheetsNeeded;
      }
      if (Math.abs(areaA - areaB) > 1e-3) {
        return areaA - areaB;
      }
      if (Math.abs(a.wastePercent - b.wastePercent) > 1e-6) {
        return a.wastePercent - b.wastePercent;
      }
      return b.itemsPerSheet - a.itemsPerSheet;
    }
  });

  // Assign 1-based ranks
  recommendations.forEach((rec, idx) => {
    rec.rank = idx + 1;
  });

  return recommendations;
}
