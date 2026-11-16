import React, { useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Printer,
  Scissors,
  X,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import type { GuillotineAnalysis, SheetLayout } from '../types/optimizer';

export interface GuillotineModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: GuillotineAnalysis | null;
  sheetLayout: SheetLayout | null;
}

export const GuillotineModal: React.FC<GuillotineModalProps> = ({
  isOpen,
  onClose,
  analysis,
  sheetLayout,
}) => {
  const { t, language } = useTranslation();
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

  if (!isOpen) return null;

  const isCuttable = analysis?.isGuillotineCuttable ?? false;
  const steps = analysis?.steps ?? [];
  const totalCuts = analysis?.totalCutsNeeded ?? 0;
  const rating = analysis?.efficiencyRating ?? 'ideal';

  const getEfficiencyConfig = () => {
    switch (rating) {
      case 'ideal':
        return {
          label: t('modals.guillotine.idealEfficiency'),
          description: t('modals.guillotine.idealDesc'),
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'moderate':
        return {
          label: t('modals.guillotine.moderateEfficiency'),
          description: t('modals.guillotine.moderateDesc'),
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'complex':
        return {
          label: t('modals.guillotine.complexEfficiency'),
          description: t('modals.guillotine.complexDesc'),
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'non-guillotine':
      default:
        return {
          label: t('common.visualizer.nonCuttableBadge'),
          description: t('modals.guillotine.nonCuttableDesc'),
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        };
    }
  };

  const efficiency = getEfficiencyConfig();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs overflow-y-auto dark:bg-black/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guillotine-modal-title"
        className="relative my-8 flex w-full max-w-4xl max-h-[90vh] flex-col rounded-2xl border border-stone-200/80 bg-white p-6 shadow-2xl overflow-hidden dark:border-[#1E2B45] dark:bg-[#111A2E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4 dark:border-[#1E2B45]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="guillotine-modal-title"
                  data-i18n="modals.guillotine.title"
                  className="text-base font-semibold tracking-tight text-stone-900 sm:text-lg dark:text-slate-100"
                >
                  {t('modals.guillotine.title')}
                </h2>
                {sheetLayout && (
                  <span
                    data-i18n="modals.guillotine.sheetInfo"
                    className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-600 dark:border dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300"
                  >
                    {t('modals.guillotine.sheetInfo', {
                      number: sheetLayout.sheetNumber,
                      width: sheetLayout.widthMm,
                      height: sheetLayout.heightMm,
                    })}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-light mt-0.5 dark:text-slate-400">
                {language === 'pt-BR'
                  ? 'Plano operacional de corte sequencial linear de ponta a ponta para o operador da guilhotina.'
                  : 'End-to-end sequential linear cut operational plan for the guillotine operator.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors dark:text-slate-400 dark:hover:bg-[#18243C] dark:hover:text-slate-200"
            aria-label={t('modals.guillotine.close')}
            data-i18n-aria-label="modals.guillotine.close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Status Banner */}
          {isCuttable ? (
            <div
              data-testid="guillotine-status-banner-success"
              className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 dark:text-emerald-400" />
                  <span
                    data-i18n="modals.guillotine.cuttableTitle"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white shadow-xs"
                  >
                    {t('modals.guillotine.cuttableTitle')}
                  </span>
                  <span
                    data-testid="guillotine-efficiency-badge"
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${efficiency.badgeClass}`}
                  >
                    {efficiency.label}
                  </span>
                </div>

                <div className="font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  {totalCuts}{' '}
                  {totalCuts === 1
                    ? t('modals.guillotine.singleLinearCut')
                    : t('modals.guillotine.linearCutsCount', { count: totalCuts })}
                </div>
              </div>

              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                {analysis?.message} {efficiency.description}
              </p>
            </div>
          ) : (
            <div
              data-testid="guillotine-status-banner-warning"
              className="rounded-xl border border-rose-200/80 bg-rose-50/80 p-4 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 dark:text-rose-400" />
                <span
                  data-i18n="modals.guillotine.nonCuttableTitle"
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-0.5 text-xs font-semibold text-white shadow-xs"
                >
                  {t('modals.guillotine.nonCuttableTitle')}
                </span>
                <span
                  data-i18n="modals.guillotine.pinwheelBadge"
                  className="inline-flex items-center rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  {t('modals.guillotine.pinwheelBadge')}
                </span>
              </div>

              <div className="mt-2 text-xs text-rose-800 space-y-1 dark:text-rose-300">
                <p className="font-medium">
                  {analysis?.message ?? t('modals.guillotine.pinwheelDesc')}
                </p>
                <p className="text-rose-700 dark:text-rose-400">
                  {language === 'pt-BR'
                    ? 'Nenhum corte linear reto contínuo de borda a borda é viável sem invadir outras peças da folha.'
                    : 'No continuous edge-to-edge straight linear cut is feasible without cutting into other sheet elements.'}
                </p>
                <div className="mt-2 rounded-lg bg-white/70 p-3 border border-rose-200/60 text-stone-700 dark:border-rose-900/60 dark:bg-[#0D1527] dark:text-slate-300">
                  <span
                    data-i18n="modals.guillotine.solutionsTitle"
                    className="font-semibold text-stone-900 block mb-1 dark:text-slate-100"
                  >
                    {t('modals.guillotine.solutionsTitle')}
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-stone-600 dark:text-slate-400">
                    <li data-i18n="modals.guillotine.solution1">{t('modals.guillotine.solution1')}</li>
                    <li data-i18n="modals.guillotine.solution2">{t('modals.guillotine.solution2')}</li>
                    <li data-i18n="modals.guillotine.solution3">{t('modals.guillotine.solution3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Steps Timeline / Table */}
          {isCuttable && steps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-slate-300">
                    {language === 'pt-BR' ? 'Ordem dos Cortes na Régua da Guilhotina' : 'Cut Order on Guillotine Ruler'}
                  </h3>
                  <p className="text-[11px] text-stone-400 dark:text-slate-500">
                    {language === 'pt-BR'
                      ? 'Posicione o esquadro da guilhotina na coordenada indicada e execute os cortes na sequência numérica.'
                      : 'Position the guillotine gauge at the indicated coordinate and perform cuts in numerical sequence.'}
                  </p>
                </div>
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 font-mono text-xs font-medium text-stone-600 dark:border dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300">
                  {steps.length} {steps.length === 1 ? t('common.units.step') : t('common.units.steps')}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-stone-200/70 bg-white dark:border-[#1E2B45] dark:bg-[#0D1527]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50/80 text-[11px] font-semibold text-stone-600 uppercase tracking-wider border-b border-stone-200/70 dark:border-[#1E2B45] dark:bg-[#090E1A] dark:text-slate-400">
                    <tr>
                      <th scope="col" data-i18n="tables.guillotine.step" className="px-3.5 py-2.5 w-14 text-center">
                        {t('tables.guillotine.step')}
                      </th>
                      <th scope="col" data-i18n="tables.guillotine.direction" className="px-3 py-2.5 w-28">
                        {t('tables.guillotine.direction')}
                      </th>
                      <th scope="col" data-i18n="tables.guillotine.rulerPosition" className="px-3 py-2.5 w-36">
                        {t('tables.guillotine.rulerPosition')}
                      </th>
                      <th scope="col" data-i18n="tables.guillotine.cutSpan" className="px-3 py-2.5 w-48">
                        {t('tables.guillotine.cutSpan')}
                      </th>
                      <th scope="col" data-i18n="tables.guillotine.operatorInstruction" className="px-3.5 py-2.5">
                        {t('tables.guillotine.operatorInstruction')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-[#1E2B45]">
                    {steps.map((step) => {
                      const isHoriz = step.direction === 'horizontal';
                      const coordAxis = isHoriz ? 'Y' : 'X';
                      const spanAxis = isHoriz ? 'X' : 'Y';
                      const cutLength = Math.abs(step.cutEndMm - step.cutStartMm);
                      const stepDesc = language === 'pt-BR'
                        ? step.description
                        : (isHoriz
                            ? t('tables.guillotine.stepCutDescHorizontal', {
                                step: step.stepNumber,
                                coord: step.coordinateMm.toFixed(1),
                                start: step.cutStartMm.toFixed(1),
                                end: step.cutEndMm.toFixed(1),
                              })
                            : t('tables.guillotine.stepCutDescVertical', {
                                step: step.stepNumber,
                                coord: step.coordinateMm.toFixed(1),
                                start: step.cutStartMm.toFixed(1),
                                end: step.cutEndMm.toFixed(1),
                              }));

                      return (
                        <tr
                          key={step.stepNumber}
                          data-testid="guillotine-step-row"
                          className="hover:bg-stone-50/60 transition-colors dark:hover:bg-[#141F36]"
                        >
                          {/* Step Badge */}
                          <td className="px-3.5 py-2.5 text-center">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-mono text-xs font-bold text-white shadow-xs">
                              {step.stepNumber}
                            </span>
                          </td>

                          {/* Direction */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {isHoriz ? (
                              <span
                                data-i18n="tables.guillotine.horizontal"
                                className="inline-flex items-center gap-1 rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300"
                              >
                                {t('tables.guillotine.horizontal')}
                              </span>
                            ) : (
                              <span
                                data-i18n="tables.guillotine.vertical"
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300"
                              >
                                {t('tables.guillotine.vertical')}
                              </span>
                            )}
                          </td>

                          {/* Ruler Blade Position */}
                          <td className="px-3 py-2.5 whitespace-nowrap font-mono">
                            <span className="rounded-md bg-stone-100 px-2 py-0.5 font-semibold text-stone-900 border border-stone-200/50 dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-slate-100">
                              {coordAxis} = {step.coordinateMm.toFixed(1)} mm
                            </span>
                          </td>

                          {/* Cut Span */}
                          <td className="px-3 py-2.5 whitespace-nowrap text-stone-600 font-mono text-[11px] dark:text-slate-300">
                            <span>
                              {spanAxis}: {step.cutStartMm.toFixed(1)} → {step.cutEndMm.toFixed(1)} mm
                            </span>
                            <span className="ml-1 text-[10px] text-stone-400 dark:text-slate-500">
                              ({cutLength.toFixed(1)} mm)
                            </span>
                          </td>

                          {/* Technical Description */}
                          <td className="px-3.5 py-2.5 text-stone-800 dark:text-slate-200">
                            <div className="font-medium text-xs text-stone-900 dark:text-slate-100">
                              {stepDesc}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5 dark:text-slate-500">
                              {language === 'pt-BR' ? 'Bloco' : 'Block'}: {step.blockBounds.width.toFixed(1)} × {step.blockBounds.height.toFixed(1)} mm ({language === 'pt-BR' ? 'em' : 'at'} X={step.blockBounds.x.toFixed(1)}, Y={step.blockBounds.y.toFixed(1)})
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty / 1-item note when cuttable but 0 cuts needed */}
          {isCuttable && steps.length === 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300">
              <Info className="h-5 w-5 text-stone-400 shrink-0 dark:text-slate-500" />
              <div>
                <p data-i18n="modals.guillotine.singleItemTitle" className="font-semibold text-stone-800 dark:text-slate-100">
                  {t('modals.guillotine.singleItemTitle')}
                </p>
                <p data-i18n="modals.guillotine.singleItemDesc" className="mt-0.5 text-stone-500 dark:text-slate-400">
                  {analysis?.message ?? t('modals.guillotine.singleItemDesc')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4 dark:border-[#1E2B45]">
          <div className="text-[11px] text-stone-400 flex items-center gap-1.5 dark:text-slate-500">
            <Info className="h-3.5 w-3.5 text-stone-400 dark:text-slate-500" />
            <span>
              {language === 'pt-BR'
                ? 'Mantenha o esquadro da guilhotina aferido a 90° e lâmina afiada para precisão milimétrica.'
                : 'Keep the guillotine gauge calibrated at 90° and blade sharp for millimeter accuracy.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              data-testid="print-guillotine-instructions-btn"
              data-i18n="modals.guillotine.printInstructions"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/80 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 shadow-xs transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 cursor-pointer dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-[#18243C] dark:hover:text-white"
            >
              <Printer className="h-4 w-4 text-stone-500 dark:text-slate-400" />
              {t('modals.guillotine.printInstructions')}
            </button>

            <button
              type="button"
              onClick={onClose}
              data-testid="close-guillotine-modal-btn"
              data-i18n="modals.guillotine.close"
              className="inline-flex items-center justify-center rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-stone-800 cursor-pointer dark:bg-teal-700 dark:hover:bg-teal-600 dark:text-white"
            >
              {t('modals.guillotine.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
