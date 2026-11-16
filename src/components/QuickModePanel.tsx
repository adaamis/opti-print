import React from 'react';
import { AlertTriangle, Award, CheckCircle2, Sparkles, Zap } from 'lucide-react';
import { SAMPLE_ELEMENT_PRESETS } from '../constants/sheets';
import {
  getLocalizedPresetItemName,
  getLocalizedSamplePresetLabel,
  useTranslation,
} from '../i18n';
import type { QuickComparison, QuickStrategy, Unit } from '../types/optimizer';
import { formatNumber, fromMm, toMm } from '../utils/units';

interface QuickModePanelProps {
  itemWidthMm: number;
  itemHeightMm: number;
  itemName: string;
  unit: Unit;
  comparison: QuickComparison;
  activeStrategy: QuickStrategy;
  onItemChange: (widthMm: number, heightMm: number, name: string) => void;
  onSelectStrategy: (strategy: QuickStrategy) => void;
  onOpenRecommender?: () => void;
}

export const QuickModePanel: React.FC<QuickModePanelProps> = ({
  itemWidthMm,
  itemHeightMm,
  itemName,
  unit,
  comparison,
  activeStrategy,
  onItemChange,
  onSelectStrategy,
  onOpenRecommender,
}) => {
  const { t, language } = useTranslation();
  const step = unit === 'cm' ? '0.1' : '1';

  const handleWidthChange = (val: string) => {
    const p = parseFloat(val);
    const mm = Number.isFinite(p) && p >= 0 ? toMm(p, unit) : 0;
    onItemChange(mm, itemHeightMm, itemName);
  };

  const handleHeightChange = (val: string) => {
    const p = parseFloat(val);
    const mm = Number.isFinite(p) && p >= 0 ? toMm(p, unit) : 0;
    onItemChange(itemWidthMm, mm, itemName);
  };

  const matchingPreset = SAMPLE_ELEMENT_PRESETS.find(
    (preset) => preset.widthMm === itemWidthMm && preset.heightMm === itemHeightMm
  );
  const currentPresetValue = matchingPreset ? matchingPreset.label : '';

  const handlePresetSelect = (selectedLabel: string) => {
    const preset = SAMPLE_ELEMENT_PRESETS.find((p) => p.label === selectedLabel);
    if (preset) {
      onItemChange(
        preset.widthMm,
        preset.heightMm,
        getLocalizedPresetItemName(preset.name, language)
      );
    }
  };

  const cards: Array<{
    strategy: QuickStrategy;
    title: string;
    badge?: string;
    count: number;
    subtext: string;
    utilization: number;
    isWinner: boolean;
  }> = [
    {
      strategy: 'normal',
      title: t('forms.quick.normalTitle'),
      count: comparison.normal.count,
      subtext: t('forms.quick.normalSubtext', { count: comparison.normal.normalCount }),
      utilization: comparison.normal.utilizationPercent,
      isWinner: comparison.bestStrategy === 'normal' && comparison.normal.count > 0,
    },
    {
      strategy: 'rotated',
      title: t('forms.quick.rotatedTitle'),
      count: comparison.rotated.count,
      subtext: t('forms.quick.rotatedSubtext', { count: comparison.rotated.rotatedCount }),
      utilization: comparison.rotated.utilizationPercent,
      isWinner: comparison.bestStrategy === 'rotated' && comparison.rotated.count > 0,
    },
    {
      strategy: 'mixed',
      title: t('forms.quick.mixedTitle'),
      badge:
        comparison.extraFromMixed > 0
          ? t('forms.quick.mixedBadge', { extra: comparison.extraFromMixed })
          : undefined,
      count: comparison.mixed.count,
      subtext:
        comparison.mixed.rotatedCount > 0 && comparison.mixed.normalCount > 0
          ? t('forms.quick.mixedSubtextCombined', {
              normal: comparison.mixed.normalCount,
              rotated: comparison.mixed.rotatedCount,
            })
          : t('forms.quick.mixedSubtextBest'),
      utilization: comparison.mixed.utilizationPercent,
      isWinner: comparison.bestStrategy === 'mixed' && comparison.mixed.count > 0,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Element Dimension Input Form */}
      <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-xs dark:border-[#1E2B45] dark:bg-[#111A2E]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h2
              data-i18n="forms.quick.title"
              className="text-sm font-semibold tracking-tight text-stone-900 dark:text-slate-100"
            >
              {t('forms.quick.title')}
            </h2>
          </div>
          <span className="text-[11px] font-medium text-stone-400 dark:text-slate-400">1 Elemento</span>
        </div>

        <div className="mb-3.5">
          <label
            data-i18n="forms.quick.elementNameLabel"
            className="mb-1 block text-xs font-medium text-stone-500 dark:text-slate-300"
          >
            {t('forms.quick.elementNameLabel')}
          </label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => onItemChange(itemWidthMm, itemHeightMm, e.target.value)}
            placeholder={t('forms.quick.elementNamePlaceholder')}
            data-i18n-placeholder="forms.quick.elementNamePlaceholder"
            className="w-full rounded-xl border border-stone-200/70 bg-stone-50/40 px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100 dark:focus:border-teal-400 dark:focus:bg-[#0D1527]"
          />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2.5">
          <div>
            <label
              data-i18n="forms.quick.widthLabel"
              className="mb-1 block text-xs font-medium text-stone-500 dark:text-slate-300"
            >
              {t('forms.quick.widthLabel', { unit })}
            </label>
            <input
              type="number"
              min="1"
              step={step}
              value={fromMm(itemWidthMm, unit) || ''}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="w-full rounded-xl border border-stone-200/70 bg-stone-50/40 px-3 py-2 text-sm font-medium text-stone-900 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100 dark:focus:border-teal-400 dark:focus:bg-[#0D1527]"
            />
          </div>

          <div>
            <label
              data-i18n="forms.quick.heightLabel"
              className="mb-1 block text-xs font-medium text-stone-500 dark:text-slate-300"
            >
              {t('forms.quick.heightLabel', { unit })}
            </label>
            <input
              type="number"
              min="1"
              step={step}
              value={fromMm(itemHeightMm, unit) || ''}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="w-full rounded-xl border border-stone-200/70 bg-stone-50/40 px-3 py-2 text-sm font-medium text-stone-900 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100 dark:focus:border-teal-400 dark:focus:bg-[#0D1527]"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label
            htmlFor="quick-format-preset-select"
            data-i18n="forms.quick.presetsLabel"
            className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-slate-300"
          >
            {t('forms.quick.presetsLabel')}
          </label>
          <select
            id="quick-format-preset-select"
            value={currentPresetValue}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="w-full rounded-xl border border-stone-200/70 bg-stone-50/40 px-3 py-2 text-xs font-medium text-stone-900 shadow-xs focus:border-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100 dark:focus:border-teal-400 dark:focus:bg-[#0D1527]"
          >
            <option value="" disabled={false}>
              {t('forms.quick.selectPresetPlaceholder')}
            </option>
            {SAMPLE_ELEMENT_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.label}>
                {getLocalizedSamplePresetLabel(preset, language)}
              </option>
            ))}
          </select>
        </div>

        {/* Recommender CTA Button */}
        {onOpenRecommender && (
          <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-[#1E2B45]">
            <button
              type="button"
              onClick={onOpenRecommender}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-teal-900 active:scale-[0.99] cursor-pointer dark:bg-teal-700 dark:hover:bg-teal-600"
            >
              <span data-i18n="forms.quick.whichSheetToBuy">{t('forms.quick.whichSheetToBuy')}</span>
            </button>
          </div>
        )}
      </section>

      {/* Comparison Cards: Normal vs 90 deg vs Mixed */}
      <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-xs dark:border-[#1E2B45] dark:bg-[#111A2E]">
        <div className="mb-3.5 flex items-center justify-between">
          <h3
            data-i18n="forms.quick.comparisonTitle"
            className="text-xs font-semibold tracking-wider text-stone-400 uppercase dark:text-slate-400"
          >
            {t('forms.quick.comparisonTitle')}
          </h3>
          <span className="text-[11px] text-stone-400 font-light dark:text-slate-500">Clique para visualizar</span>
        </div>

        {!comparison.itemFits && (
          <div
            data-i18n="forms.quick.elementLargerThanUsable"
            className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              {t('forms.quick.elementLargerThanUsable', {
                width: fromMm(itemWidthMm, unit),
                height: fromMm(itemHeightMm, unit),
                unit,
                usableW: fromMm(
                  Math.max(0, comparison.normal.layout.widthMm - 2 * comparison.normal.layout.marginMm),
                  unit
                ),
                usableH: fromMm(
                  Math.max(0, comparison.normal.layout.heightMm - 2 * comparison.normal.layout.marginMm),
                  unit
                ),
              })}
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {cards.map((card) => {
            const isSelected = activeStrategy === card.strategy;
            const isWinner = card.isWinner;

            let cardClasses = 'relative w-full rounded-2xl p-3.5 text-left transition-all ';
            if (isWinner) {
              if (isSelected) {
                cardClasses +=
                  'border-2 border-teal-600/70 bg-teal-50/40 text-stone-900 shadow-xs ring-2 ring-teal-500/20 dark:border-teal-500 dark:bg-teal-950/40 dark:text-slate-100 dark:ring-teal-500/30';
              } else {
                cardClasses +=
                  'border-2 border-teal-600/40 bg-teal-50/20 text-stone-900 hover:border-teal-600/60 hover:bg-teal-50/30 dark:border-teal-700/60 dark:bg-teal-950/20 dark:text-slate-100 dark:hover:bg-teal-950/30';
              }
            } else {
              if (isSelected) {
                cardClasses +=
                  'border-2 border-stone-900 bg-stone-50/80 text-stone-900 shadow-xs ring-1 ring-stone-900/10 dark:border-slate-400 dark:bg-[#0D1527] dark:text-slate-100 dark:ring-slate-500/20';
              } else {
                cardClasses +=
                  'border border-stone-200/70 bg-white hover:border-stone-300 hover:bg-stone-50/60 text-stone-700 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:hover:border-slate-600 dark:hover:bg-[#141E33] dark:text-slate-300';
              }
            }

            return (
              <button
                key={card.strategy}
                type="button"
                onClick={() => onSelectStrategy(card.strategy)}
                className={cardClasses}
              >
                {card.badge && (
                  <span className="absolute -top-2.5 right-3.5 inline-flex items-center gap-1 rounded-full bg-teal-700 px-2.5 py-0.5 text-[10px] font-medium text-white shadow-xs">
                    <Sparkles className="h-3 w-3" />
                    {card.badge}
                  </span>
                )}

                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900 text-sm tracking-tight dark:text-slate-100">
                        {card.title}
                      </span>
                      {card.isWinner && (
                        <span
                          data-i18n="modals.recommender.morePieces"
                          className="inline-flex items-center gap-1 rounded-full bg-teal-100/80 px-2 py-0.5 text-[10px] font-medium text-teal-800 dark:bg-teal-900/60 dark:text-teal-300"
                        >
                          <Award className="h-3 w-3 text-teal-700 dark:text-teal-400" />
                          {t('modals.recommender.morePieces')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-slate-400">{card.subtext}</p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span
                        className={`font-bold text-2xl font-mono ${card.isWinner ? 'text-teal-950 dark:text-teal-300' : 'text-stone-900 dark:text-slate-100'}`}
                      >
                        {card.count}
                      </span>
                      <span className="text-xs text-stone-400 font-normal dark:text-slate-400">
                        {card.count === 1 ? t('common.units.piece') : t('common.units.pieces')}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-400 font-light dark:text-slate-400">
                      {formatNumber(card.utilization, 1)}% {t('common.units.pieces') === 'peças' ? 'útil' : 'usable'}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div
                    className={`mt-2.5 flex items-center gap-1.5 border-t pt-2 text-[11px] font-medium ${
                      card.isWinner
                        ? 'border-teal-200/70 text-teal-800 dark:border-teal-800 dark:text-teal-300'
                        : 'border-stone-200/80 text-stone-800 dark:border-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t('common.units.pieces') === 'peças'
                      ? 'Exibindo este arranjo na folha'
                      : 'Displaying this layout on sheet'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
