import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  Check,
  Info,
  Layers,
  Medal,
  Trophy,
  X,
} from 'lucide-react';
import { BUILTIN_SHEET_PRESETS } from '../constants/sheets';
import { recommendSubstrates } from '../engine/recommender';
import {
  getLocalizedCategory,
  getLocalizedPresetItemName,
  getLocalizedSheetPresetName,
  useTranslation,
} from '../i18n';
import type {
  PricingConfig,
  SheetPreset,
  SubstrateRecommendation,
} from '../types/optimizer';
import { loadSavedCustomPresets } from '../utils/customPresets';
import { formatCurrency } from '../utils/pricingStorage';
import { formatNumber } from '../utils/units';

export interface SubstrateRecommenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemWidthMm: number;
  itemHeightMm: number;
  itemName: string;
  marginMm: number;
  spacingMm: number;
  currentPresetId?: string;
  pricingConfig: PricingConfig;
  onApplyPreset: (presetId: string, widthMm: number, heightMm: number) => void;
}

export type CategoryFilter =
  | 'Todos'
  | 'Digital / SRA'
  | 'Série ISO A'
  | 'Gráfica Offset (Brasil)'
  | 'Formatos Salvos';

const CATEGORY_FILTERS: CategoryFilter[] = [
  'Todos',
  'Digital / SRA',
  'Série ISO A',
  'Gráfica Offset (Brasil)',
  'Formatos Salvos',
];

const QUANTITY_INCREMENTS = [250, 500, 1000, 2500, 5000];

export const SubstrateRecommenderModal: React.FC<SubstrateRecommenderModalProps> = ({
  isOpen,
  onClose,
  itemWidthMm,
  itemHeightMm,
  itemName,
  marginMm,
  spacingMm,
  currentPresetId,
  pricingConfig,
  onApplyPreset,
}) => {
  const { t, language } = useTranslation();
  const [targetQuantity, setTargetQuantity] = useState<number>(1000);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('Todos');

  // Load custom presets dynamically whenever modal opens
  const [customPresets, setCustomPresets] = useState<SheetPreset[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCustomPresets(loadSavedCustomPresets());
    }
  }, [isOpen]);

  // Keyboard accessibility: Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Combine builtin presets with saved custom formats
  const allPresets = useMemo<SheetPreset[]>(() => {
    return [...BUILTIN_SHEET_PRESETS, ...customPresets];
  }, [customPresets]);

  // Filter presets based on selected category pill
  const filteredPresets = useMemo<SheetPreset[]>(() => {
    if (selectedCategory === 'Todos') {
      return allPresets;
    }
    if (selectedCategory === 'Formatos Salvos') {
      return allPresets.filter(
        (p) =>
          Boolean(p.isCustomSaved) ||
          Boolean(p.category && p.category.toLowerCase().includes('salvo'))
      );
    }
    return allPresets.filter((p) => p.category === selectedCategory);
  }, [allPresets, selectedCategory]);

  // Run the recommender engine
  const recommendations = useMemo<SubstrateRecommendation[]>(() => {
    if (!isOpen) return [];

    return recommendSubstrates({
      itemWidthMm,
      itemHeightMm,
      targetQuantity: Math.max(1, targetQuantity),
      marginMm,
      spacingMm,
      pricingConfig,
      presets: filteredPresets,
    });
  }, [
    isOpen,
    itemWidthMm,
    itemHeightMm,
    targetQuantity,
    marginMm,
    spacingMm,
    pricingConfig,
    filteredPresets,
  ]);

  if (!isOpen) {
    return null;
  }

  const champion = recommendations.length > 0 ? recommendations[0] : null;
  const hasCostData =
    Boolean(pricingConfig) &&
    ((pricingConfig.costPerSheet ?? 0) > 0 || (pricingConfig.clickCost ?? 0) > 0);

  const handleIncrementQuantity = (delta: number) => {
    setTargetQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleApply = (presetId: string, widthMm: number, heightMm: number) => {
    onApplyPreset(presetId, widthMm, heightMm);
    onClose();
  };

  const getCategoryLabel = (cat: CategoryFilter) => {
    return getLocalizedCategory(cat, language);
  };

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'mixed':
        return language === 'pt-BR' ? 'Misto Máximo' : 'Maximum Mixed';
      case 'rotated':
        return language === 'pt-BR' ? 'Rotacionado (90°)' : 'Rotated (90°)';
      default:
        return language === 'pt-BR' ? 'Normal (0°)' : 'Normal (0°)';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
          <Trophy className="h-3.5 w-3.5 text-amber-500" /> #1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-700 border border-stone-300">
          <Medal className="h-3.5 w-3.5 text-slate-400" /> #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
          <Award className="h-3.5 w-3.5 text-amber-700" /> #3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-500">
        #{rank}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto dark:bg-black/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recommender-modal-title"
        aria-describedby="recommender-modal-desc"
        className="relative my-6 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-stone-200/80 bg-white shadow-2xl overflow-hidden dark:border-[#1E2B45] dark:bg-[#111A2E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-stone-100 p-5 sm:p-6 bg-white dark:border-[#1E2B45] dark:bg-[#0D1527]">
          <div className="flex items-start gap-3 sm:gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-200/60 text-teal-800 shadow-xs dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300">
              <Layers className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="recommender-modal-title"
                  data-i18n="modals.recommender.title"
                  className="text-base font-semibold tracking-tight text-stone-900 sm:text-lg dark:text-slate-100"
                >
                  {t('modals.recommender.title')}
                </h2>
                <span
                  data-i18n="modals.recommender.badge"
                  className="rounded-full bg-teal-100/70 px-2.5 py-0.5 text-[11px] font-medium text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                >
                  {t('modals.recommender.badge')}
                </span>
              </div>
              <p id="recommender-modal-desc" className="mt-1 text-xs text-stone-500 dark:text-slate-400">
                {t('modals.recommender.itemLabel')}{' '}
                <strong className="text-stone-800 font-medium dark:text-slate-200">
                  {getLocalizedPresetItemName(itemName, language) || t('modals.recommender.graphicElement')}
                </strong>{' '}
                ({itemWidthMm} × {itemHeightMm} mm) · {t('modals.recommender.marginLabel')} {marginMm} mm · {t('modals.recommender.spacingLabel')}{' '}
                {spacingMm} mm
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer dark:text-slate-400 dark:hover:bg-[#18243C] dark:hover:text-slate-200"
            aria-label={t('modals.recommender.close')}
            data-i18n-aria-label="modals.recommender.close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Controls: Target Quantity & Category Filter */}
          <div className="space-y-4 rounded-xl border border-stone-200/70 bg-stone-50/60 p-4 dark:border-[#1E2B45] dark:bg-[#0D1527]">
            {/* Run Quantity Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label
                  htmlFor="recommender-target-qty"
                  data-i18n="modals.recommender.runQuantityTitle"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400"
                >
                  {t('modals.recommender.runQuantityTitle')}
                </label>
                <span className="text-[11px] text-stone-400 dark:text-slate-500">
                  {t('modals.recommender.runQuantitySubtitle')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    id="recommender-target-qty"
                    type="number"
                    min="1"
                    step="50"
                    value={targetQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setTargetQuantity(Number.isFinite(val) && val > 0 ? val : 1);
                    }}
                    className="w-32 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-sm font-semibold text-stone-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-slate-100 dark:focus:border-teal-400"
                  />
                  <span className="absolute right-3 top-2 text-xs font-normal text-stone-400 pointer-events-none dark:text-slate-500">
                    {t('common.units.unitShort')}
                  </span>
                </div>

                {/* Quick Add Pills */}
                <div className="flex flex-wrap gap-1">
                  {QUANTITY_INCREMENTS.map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => handleIncrementQuantity(inc)}
                      className="rounded-lg border border-stone-200/80 bg-white px-2 py-1 text-xs font-medium text-stone-600 hover:border-teal-400 hover:bg-teal-50/50 hover:text-teal-900 transition-colors cursor-pointer dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-slate-300 dark:hover:bg-[#18243C] dark:hover:text-white"
                      title={t('modals.recommender.addQuantityTitle', { qty: formatNumber(inc) })}
                    >
                      +{formatNumber(inc)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="border-t border-stone-200/60 pt-3 dark:border-[#1E2B45]">
              <span
                data-i18n="modals.recommender.filterCategoryTitle"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400"
              >
                {t('modals.recommender.filterCategoryTitle')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_FILTERS.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-800 text-white shadow-xs dark:bg-teal-700'
                          : 'border border-stone-200/80 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-100 hover:text-stone-900 dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-slate-300 dark:hover:bg-[#18243C] dark:hover:text-white'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Empty State */}
          {recommendations.length === 0 && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 text-center dark:border-amber-900/60 dark:bg-amber-950/30">
              <AlertCircle className="mx-auto h-8 w-8 text-amber-500" />
              <h3
                data-i18n="modals.recommender.noViableFound"
                className="mt-2 text-sm font-semibold text-stone-900 dark:text-slate-100"
              >
                {t('modals.recommender.noViableFound')}
              </h3>
              <p className="mt-1 text-xs text-stone-600 max-w-md mx-auto dark:text-slate-400">
                {selectedCategory === 'Formatos Salvos'
                  ? t('modals.recommender.customSavedEmptyDesc')
                  : t('modals.recommender.exceedsPrintableDesc', {
                      width: itemWidthMm,
                      height: itemHeightMm,
                      category: getLocalizedCategory(selectedCategory, language),
                    })}
              </p>
              {selectedCategory !== 'Todos' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('Todos')}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors cursor-pointer dark:bg-amber-700 dark:hover:bg-amber-600"
                >
                  {t('modals.recommender.showAllCategories')}
                </button>
              )}
            </div>
          )}

          {/* Champion Format Card (#1) */}
          {champion && (
            <div className="relative rounded-2xl border-2 border-teal-600/80 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40 p-5 shadow-xs dark:border-teal-500 dark:bg-gradient-to-br dark:from-teal-950/40 dark:via-[#111A2E] dark:to-emerald-950/30">
              {/* Badge & Title */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    data-i18n="modals.recommender.championTitle"
                    className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-xs"
                  >
                    {t('modals.recommender.championTitle')}
                  </span>
                  {currentPresetId === champion.presetId && (
                    <span
                      data-i18n="modals.recommender.currentFormat"
                      className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800 border border-teal-300 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                    >
                      ✓ {t('modals.recommender.currentFormat')}
                    </span>
                  )}
                  {champion.isCustom && (
                    <span
                      data-i18n="modals.recommender.categorySaved"
                      className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                    >
                      {t('modals.recommender.categorySaved')}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleApply(
                      champion.presetId,
                      champion.sheetWidthMm,
                      champion.sheetHeightMm
                    )
                  }
                  data-i18n="modals.recommender.applyFormat"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-900 active:scale-[0.99] transition-all cursor-pointer dark:bg-teal-700 dark:hover:bg-teal-600"
                >
                  <Check className="h-4 w-4" />
                  <span>{t('modals.recommender.applyFormat')}</span>
                </button>
              </div>

              {/* Champion Sheet Specs */}
              <div className="mt-3 flex flex-wrap items-baseline gap-2">
                <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-slate-100">
                  {getLocalizedSheetPresetName(champion.presetId, champion.presetName, language)}
                </h3>
                <span className="text-sm font-semibold text-teal-950/80 dark:text-teal-300">
                  {champion.sheetWidthMm} × {champion.sheetHeightMm} mm
                </span>
                <span className="text-xs text-stone-500 dark:text-slate-400">
                  ({getLocalizedCategory(champion.category, language)})
                </span>
              </div>

              {/* 4 Primary KPI Columns */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-teal-200/60 bg-white/90 p-3 shadow-2xs dark:border-[#1E2B45] dark:bg-[#0D1527]">
                  <span
                    data-i18n="modals.recommender.sheetsNeeded"
                    className="block text-[11px] font-medium uppercase tracking-wider text-stone-400 dark:text-slate-400"
                  >
                    {t('modals.recommender.sheetsNeeded')}
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-stone-900 dark:text-slate-100">
                      {formatNumber(champion.sheetsNeeded)}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-slate-400">
                      {t('tables.recommender.sheetsShort')}
                    </span>
                  </div>
                  <span className="mt-1 block text-[11px] text-stone-500 dark:text-slate-400">
                    {language === 'pt-BR'
                      ? `Produz ${formatNumber(champion.totalProduced)} un. (${
                          champion.totalProduced - targetQuantity >= 0
                            ? t('modals.recommender.excessWaste', { count: formatNumber(champion.totalProduced - targetQuantity) })
                            : ''
                        })`
                      : `Yields ${formatNumber(champion.totalProduced)} un. (${
                          champion.totalProduced - targetQuantity >= 0
                            ? t('modals.recommender.excessWaste', { count: formatNumber(champion.totalProduced - targetQuantity) })
                            : ''
                        })`}
                  </span>
                </div>

                <div className="rounded-xl border border-teal-200/60 bg-white/90 p-3 shadow-2xs dark:border-[#1E2B45] dark:bg-[#0D1527]">
                  <span
                    data-i18n="modals.recommender.piecesPerSheet"
                    className="block text-[11px] font-medium uppercase tracking-wider text-stone-400 dark:text-slate-400"
                  >
                    {t('modals.recommender.piecesPerSheet')}
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-teal-900 dark:text-teal-300">
                      {champion.itemsPerSheet}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-slate-400">
                      {t('common.units.pieces')}
                    </span>
                  </div>
                  <span className="mt-1 block text-[11px] text-stone-500 dark:text-slate-400">
                    {t('modals.recommender.layoutPrefix')} {getStrategyLabel(champion.bestStrategy)}
                  </span>
                </div>

                <div className="rounded-xl border border-teal-200/60 bg-white/90 p-3 shadow-2xs dark:border-[#1E2B45] dark:bg-[#0D1527]">
                  <span
                    data-i18n="modals.recommender.usableYield"
                    className="block text-[11px] font-medium uppercase tracking-wider text-stone-400 dark:text-slate-400"
                  >
                    {t('modals.recommender.usableYield')}
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-300">
                      {formatNumber(champion.utilizationPercent, 1)}%
                    </span>
                  </div>
                  <span className="mt-1 block text-[11px] text-stone-500 dark:text-slate-400">
                    {t('modals.recommender.residualScrapPrefix')} {formatNumber(champion.wastePercent, 1)}%
                  </span>
                </div>

                <div className="rounded-xl border border-teal-200/60 bg-white/90 p-3 shadow-2xs dark:border-[#1E2B45] dark:bg-[#0D1527]">
                  <span
                    data-i18n={hasCostData ? 'modals.recommender.productionCost' : 'modals.recommender.economy'}
                    className="block text-[11px] font-medium uppercase tracking-wider text-stone-400 dark:text-slate-400"
                  >
                    {hasCostData ? t('modals.recommender.productionCost') : t('modals.recommender.economy')}
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    {hasCostData && champion.pricing ? (
                      <span className="text-2xl font-bold font-mono text-stone-900 dark:text-slate-100">
                        {formatCurrency(
                          champion.pricing.totalProductionCost,
                          pricingConfig.currency
                        )}
                      </span>
                    ) : (
                      <span
                        data-i18n="modals.recommender.optimal"
                        className="text-xl font-bold font-mono text-stone-700 dark:text-slate-200"
                      >
                        {t('modals.recommender.optimal')}
                      </span>
                    )}
                  </div>
                  <span className="mt-1 block text-[11px] text-stone-500 dark:text-slate-400">
                    {hasCostData && champion.pricing
                      ? `${formatCurrency(champion.pricing.unitCost, pricingConfig.currency)} ${t('modals.recommender.unitSuffix')}`
                      : t('modals.recommender.lowestConsumption')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ranked Comparison Table */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3
                  data-i18n="tables.recommender.rankingTitle"
                  className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400"
                >
                  {t('tables.recommender.rankingTitle')} ({recommendations.length})
                </h3>
                <span className="text-[11px] text-stone-400 dark:text-slate-500">
                  {hasCostData ? t('modals.recommender.economyNotice') : t('modals.recommender.sheetsFallbackNotice')}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-white shadow-2xs dark:border-[#1E2B45] dark:bg-[#0D1527]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/80 font-semibold text-stone-600 dark:border-[#1E2B45] dark:bg-[#090E1A] dark:text-slate-400">
                      <th className="py-2.5 px-3">#</th>
                      <th data-i18n="tables.recommender.formatDimensions" className="py-2.5 px-3">
                        {t('tables.recommender.formatDimensions')}
                      </th>
                      <th data-i18n="tables.recommender.category" className="py-2.5 px-3">
                        {t('tables.recommender.category')}
                      </th>
                      <th data-i18n="tables.recommender.piecesPerSheet" className="py-2.5 px-3 text-right">
                        {t('tables.recommender.piecesPerSheet')}
                      </th>
                      <th data-i18n="modals.recommender.sheetsNeeded" className="py-2.5 px-3 text-right">
                        {t('modals.recommender.sheetsNeeded')}
                      </th>
                      <th data-i18n="tables.recommender.yield" className="py-2.5 px-3 text-right">
                        {t('tables.recommender.yield')}
                      </th>
                      <th data-i18n="tables.recommender.scrap" className="py-2.5 px-3 text-right">
                        {t('tables.recommender.scrap')}
                      </th>
                      {hasCostData && (
                        <>
                          <th data-i18n="tables.recommender.totalCost" className="py-2.5 px-3 text-right">
                            {t('tables.recommender.totalCost')}
                          </th>
                          <th data-i18n="tables.recommender.unitCost" className="py-2.5 px-3 text-right">
                            {t('tables.recommender.unitCost')}
                          </th>
                        </>
                      )}
                      <th data-i18n="tables.recommender.action" className="py-2.5 px-3 text-center">
                        {t('tables.recommender.action')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-[#1E2B45]">
                    {recommendations.map((rec) => {
                      const isCurrent = currentPresetId === rec.presetId;
                      const isChampion = rec.rank === 1;

                      let rowClasses =
                        'transition-colors hover:bg-stone-50/70 dark:hover:bg-[#18243C] ';
                      if (isChampion) {
                        rowClasses += 'bg-teal-50/20 font-medium dark:bg-teal-950/20 ';
                      } else if (isCurrent) {
                        rowClasses += 'bg-stone-50/40 dark:bg-[#141F36] ';
                      }

                      return (
                        <tr key={rec.presetId} className={rowClasses}>
                          {/* Rank */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {getRankBadge(rec.rank)}
                          </td>

                          {/* Format Name & Dimensions */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-stone-900 dark:text-slate-100">
                                {getLocalizedSheetPresetName(rec.presetId, rec.presetName, language)}
                              </span>
                              {isCurrent && (
                                <span
                                  data-i18n="tables.recommender.current"
                                  className="rounded-full bg-stone-200/80 px-2 py-0.5 text-[10px] font-semibold text-stone-700 dark:border dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300"
                                >
                                  {t('tables.recommender.current')}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-500 font-mono dark:text-slate-400">
                              {rec.sheetWidthMm} × {rec.sheetHeightMm} mm
                            </span>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3 whitespace-nowrap text-stone-500 text-[11px] dark:text-slate-400">
                            {getLocalizedCategory(rec.category, language)}
                          </td>

                          {/* Items / Sheet & Strategy */}
                          <td className="py-3 px-3 whitespace-nowrap text-right">
                            <span className="font-bold text-stone-900 font-mono text-sm dark:text-slate-100">
                              {rec.itemsPerSheet}
                            </span>
                            <span className="block text-[10px] text-stone-400 dark:text-slate-500">
                              {getStrategyLabel(rec.bestStrategy)}
                            </span>
                          </td>

                          {/* Sheets Needed */}
                          <td className="py-3 px-3 whitespace-nowrap text-right">
                            <span className="font-semibold text-stone-900 font-mono text-sm dark:text-slate-100">
                              {formatNumber(rec.sheetsNeeded)}
                            </span>
                            <span className="text-[11px] text-stone-400 dark:text-slate-500">
                              {' '}{t('tables.recommender.sheetsShort')}
                            </span>
                          </td>

                          {/* Utilization */}
                          <td className="py-3 px-3 whitespace-nowrap text-right font-mono font-medium text-emerald-800 dark:text-emerald-300">
                            {formatNumber(rec.utilizationPercent, 1)}%
                          </td>

                          {/* Waste */}
                          <td className="py-3 px-3 whitespace-nowrap text-right font-mono text-stone-500 dark:text-slate-400">
                            {formatNumber(rec.wastePercent, 1)}%
                          </td>

                          {/* Pricing Costs */}
                          {hasCostData && (
                            <>
                              <td className="py-3 px-3 whitespace-nowrap text-right font-mono font-semibold text-stone-900 dark:text-slate-100">
                                {rec.pricing
                                  ? formatCurrency(
                                      rec.pricing.totalProductionCost,
                                      pricingConfig.currency
                                    )
                                  : '-'}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap text-right font-mono text-stone-600 dark:text-slate-300">
                                {rec.pricing
                                  ? formatCurrency(
                                      rec.pricing.unitCost,
                                      pricingConfig.currency
                                    )
                                  : '-'}
                              </td>
                            </>
                          )}

                          {/* Action Button */}
                          <td className="py-3 px-3 whitespace-nowrap text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleApply(
                                  rec.presetId,
                                  rec.sheetWidthMm,
                                  rec.sheetHeightMm
                                )
                              }
                              data-i18n={isCurrent ? 'tables.recommender.current' : 'tables.recommender.apply'}
                              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 dark:bg-[#18243C] dark:text-slate-400'
                                  : isChampion
                                    ? 'bg-teal-800 text-white hover:bg-teal-900 shadow-2xs dark:bg-teal-700 dark:hover:bg-teal-600'
                                    : 'border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-100 hover:text-stone-900 dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-slate-300 dark:hover:bg-[#18243C] dark:hover:text-white'
                              }`}
                            >
                              {isCurrent ? t('tables.recommender.current') : t('tables.recommender.apply')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-stone-100 bg-stone-50/80 px-5 py-3.5 sm:px-6 dark:border-[#1E2B45] dark:bg-[#0D1527]">
          <p
            data-i18n="modals.recommender.pricingCostInfo"
            className="text-[11px] text-stone-500 hidden sm:flex items-center gap-1.5 dark:text-slate-400"
          >
            <Info className="h-4 w-4 text-blue-500 shrink-0" />
            <span>{t('modals.recommender.pricingCostInfo')}</span>
          </p>

          <button
            type="button"
            onClick={onClose}
            data-i18n="modals.recommender.close"
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-100 transition-colors ml-auto cursor-pointer dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-slate-300 dark:hover:bg-[#18243C] dark:hover:text-white"
          >
            {t('modals.recommender.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
