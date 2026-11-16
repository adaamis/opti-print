import React from 'react';
import {
  Coins,
  Download,
  FileStack,
  Layers,
  Percent,
  Printer,
  Receipt,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import type { PricingCalculation, PricingConfig, SheetLayout } from '../types/optimizer';
import { downloadSheetSvg } from '../utils/exportSvg';
import { formatCurrency } from '../utils/pricingStorage';
import { formatNumber } from '../utils/units';

export interface MetricsBarProps {
  utilizationPercent: number;
  wastePercent: number;
  placedCount: number;
  requestedCount?: number;
  sheetsCount: number;
  activeLayout: SheetLayout | null;
  isQuickMode: boolean;
  pricingCalculation?: PricingCalculation;
  pricingConfig?: PricingConfig;
  onOpenPricingModal?: () => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  utilizationPercent,
  wastePercent,
  placedCount,
  requestedCount,
  sheetsCount,
  activeLayout,
  isQuickMode,
  pricingCalculation,
  pricingConfig,
  onOpenPricingModal,
}) => {
  const { t } = useTranslation();
  const handleExportSvg = () => {
    if (!activeLayout) return;
    downloadSheetSvg(activeLayout);
  };

  const handlePrint = () => {
    window.print();
  };

  const hasPricingConfigured = Boolean(
    pricingConfig &&
      (pricingConfig.costPerSheet > 0 ||
        pricingConfig.clickCost > 0 ||
        pricingConfig.otherFixedCosts > 0)
  );

  return (
    <div className="no-print flex flex-col gap-3 rounded-2xl border border-stone-200/70 bg-white p-4 shadow-xs dark:border-[#1E2B45] dark:bg-[#111A2E]">
      {/* Primary KPI cards & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        {/* 4 Physical Layout KPI cards */}
        <div className="grid min-w-0 flex-1 basis-[580px] grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="min-w-0 rounded-xl border border-teal-100 bg-teal-50/70 px-3 py-2.5 text-teal-900 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-200">
            <div
              data-i18n="common.metrics.yield"
              title={t('common.metrics.yield')}
              className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400"
            >
              <Percent className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t('common.metrics.yield')}</span>
            </div>
            <div className="mt-0.5 font-mono text-xl font-bold tracking-tight text-teal-900 dark:text-teal-100">
              {formatNumber(utilizationPercent, 1)}%
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-stone-200/50 bg-stone-50/70 px-3 py-2.5 text-stone-900 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100">
            <div
              data-i18n="common.metrics.waste"
              title={t('common.metrics.waste')}
              className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-slate-400"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-slate-500" />
              <span className="truncate">{t('common.metrics.waste')}</span>
            </div>
            <div className="mt-0.5 font-mono text-xl font-bold tracking-tight text-stone-900 dark:text-slate-100">
              {formatNumber(wastePercent, 1)}%
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-stone-200/50 bg-stone-50/70 px-3 py-2.5 text-stone-900 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100">
            <div
              data-i18n={isQuickMode ? 'common.metrics.piecesPerSheet' : 'common.metrics.piecesAccommodated'}
              title={isQuickMode ? t('common.metrics.piecesPerSheet') : t('common.metrics.piecesAccommodated')}
              className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-slate-400"
            >
              <Layers className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-slate-500" />
              <span className="truncate">
                {isQuickMode
                  ? t('common.metrics.piecesPerSheet')
                  : t('common.metrics.piecesAccommodated')}
              </span>
            </div>
            <div className="mt-0.5 font-mono text-xl font-bold tracking-tight text-stone-900 dark:text-slate-100">
              {placedCount}
              {!isQuickMode && typeof requestedCount === 'number' && (
                <span className="ml-1 text-xs font-normal text-stone-400 dark:text-slate-500">
                  / {requestedCount}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-stone-200/50 bg-stone-50/70 px-3 py-2.5 text-stone-900 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100">
            <div
              data-i18n="common.metrics.sheetsNeeded"
              title={t('common.metrics.sheetsNeeded')}
              className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-slate-400"
            >
              <FileStack className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-slate-500" />
              <span className="truncate">{t('common.metrics.sheetsNeeded')}</span>
            </div>
            <div className="mt-0.5 font-mono text-xl font-bold tracking-tight text-stone-900 dark:text-slate-100">
              {sheetsCount}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenPricingModal}
            title={t('common.pricingTitle')}
            data-i18n-title="common.pricingTitle"
            data-i18n="common.pricing"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/80 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 shadow-xs transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-[#18243C] dark:hover:text-white"
          >
            <Receipt className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="whitespace-nowrap">{t('common.pricing')}</span>
          </button>

          <button
            type="button"
            onClick={handleExportSvg}
            disabled={!activeLayout || activeLayout.placedItems.length === 0}
            data-i18n="common.exportSvg"
            title="Baixar arquivo vetorial SVG em escala real 1:1 (mm) para CorelDRAW ou Illustrator"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/80 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 shadow-xs transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-[#18243C] dark:hover:text-white"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{t('common.exportSvg')}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!activeLayout}
            data-i18n="common.printPdf"
            title="Imprimir folha ou salvar como PDF"
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-medium text-stone-50 shadow-xs transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white"
          >
            <Printer className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{t('common.printPdf')}</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Row */}
      {hasPricingConfigured && pricingCalculation && (
        <div className="border-t border-stone-100 pt-3 dark:border-[#1E2B45]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-slate-200">
              <Coins className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span data-i18n="common.metrics.financialSimulation">
                {t('common.metrics.financialSimulation')}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenPricingModal}
              data-i18n="common.metrics.adjustValues"
              className="text-[11px] font-medium text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors underline-offset-2 hover:underline"
            >
              {t('common.metrics.adjustValues')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {/* Preço Sugerido (Venda) */}
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3.5 py-2.5 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                <span
                  data-i18n="common.metrics.suggestedPrice"
                  className="flex items-center gap-1.5 truncate"
                >
                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                  {t('common.metrics.suggestedPrice')}
                </span>
                {pricingConfig && (
                  <span className="shrink-0 rounded-full bg-emerald-100/90 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    +{pricingConfig.markupPercent}%
                  </span>
                )}
              </div>
              <div className="mt-0.5 font-mono text-xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">
                {formatCurrency(pricingCalculation.suggestedTotalPrice, pricingCalculation.currency)}
              </div>
              <div className="mt-0.5 text-[10px] text-emerald-700/90 dark:text-emerald-400 truncate">
                {placedCount > 0 ? (
                  <>
                    <strong>{formatCurrency(pricingCalculation.unitPrice, pricingCalculation.currency)}</strong> / {t('common.units.unitShortUn')}
                  </>
                ) : (
                  'Valor total do pedido'
                )}
              </div>
            </div>

            {/* Custo Total de Produção */}
            <div className="rounded-xl border border-stone-200/50 bg-stone-50/70 px-3.5 py-2.5 text-stone-900 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 dark:text-slate-400">
                <Receipt className="h-3.5 w-3.5 text-stone-400 dark:text-slate-500 shrink-0" />
                <span data-i18n="common.metrics.productionCost" className="truncate">
                  {t('common.metrics.productionCost')}
                </span>
              </div>
              <div className="mt-0.5 font-mono text-xl font-bold tracking-tight text-stone-900 dark:text-slate-100">
                {formatCurrency(pricingCalculation.totalProductionCost, pricingCalculation.currency)}
              </div>
              <div className="mt-0.5 text-[10px] text-stone-400 dark:text-slate-500 truncate">
                {t('common.metrics.paper', { cost: formatCurrency(pricingCalculation.rawMaterialCost, pricingCalculation.currency) })} • {t('common.metrics.clicks', { cost: formatCurrency(pricingCalculation.totalClickCost, pricingCalculation.currency) })}
              </div>
            </div>

            {/* Custo / Preço Unitário */}
            <div className="rounded-xl border border-stone-200/50 bg-stone-50/70 px-3.5 py-2.5 text-stone-900 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 dark:text-slate-400">
                <Layers className="h-3.5 w-3.5 text-stone-400 dark:text-slate-500 shrink-0" />
                <span data-i18n="common.metrics.unitCost" className="truncate">
                  {t('common.metrics.unitCost')}
                </span>
              </div>
              <div className="mt-0.5 font-mono text-xl font-bold tracking-tight text-stone-900 dark:text-slate-100">
                {placedCount > 0
                  ? formatCurrency(pricingCalculation.unitCost, pricingCalculation.currency)
                  : '—'}
              </div>
              <div className="mt-0.5 text-[10px] text-stone-400 dark:text-slate-500 truncate">
                {placedCount > 0 ? (
                  <>{t('common.metrics.unitPrice', { price: formatCurrency(pricingCalculation.unitPrice, pricingCalculation.currency) })}</>
                ) : (
                  'Sem peças acomodadas'
                )}
              </div>
            </div>

            {/* Valor do Desperdício em Aparas */}
            <div className="rounded-xl border border-rose-200/60 bg-rose-50/40 px-3.5 py-2.5 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-700 dark:text-rose-400">
                <Trash2 className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                <span data-i18n="common.metrics.wasteCost" className="truncate">
                  {t('common.metrics.wasteCost')}
                </span>
              </div>
              <div className="mt-0.5 font-mono text-xl font-bold tracking-tight text-rose-900 dark:text-rose-100">
                {formatCurrency(pricingCalculation.wasteCostValue, pricingCalculation.currency)}
              </div>
              <div
                data-i18n="alerts.paperUnutilized"
                className="mt-0.5 text-[10px] text-rose-600/90 dark:text-rose-400 truncate"
              >
                {t('alerts.paperUnutilized', { percent: formatNumber(wastePercent, 1) })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
