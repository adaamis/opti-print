import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Check,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { calculatePricing, roundCurrency } from '../engine/pricing';
import type { CurrencyCode, PricingConfig } from '../types/optimizer';
import { DEFAULT_PRICING_CONFIG, formatCurrency } from '../utils/pricingStorage';
import { formatNumber } from '../utils/units';

export interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PricingConfig;
  onSave: (config: PricingConfig) => void;
  onReset?: () => void;
  sheetsCount?: number;
  placedCount?: number;
  wastePercent?: number;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onReset,
  sheetsCount = 0,
  placedCount = 0,
  wastePercent = 0,
}) => {
  // Draft form state maintained in string format for natural numeric input editing
  const [costPerSheetStr, setCostPerSheetStr] = useState<string>(String(config.costPerSheet));
  const [clickCostStr, setClickCostStr] = useState<string>(String(config.clickCost));
  const [otherFixedCostsStr, setOtherFixedCostsStr] = useState<string>(String(config.otherFixedCosts));
  const [markupPercentStr, setMarkupPercentStr] = useState<string>(String(config.markupPercent));
  const [currency, setCurrency] = useState<CurrencyCode>(config.currency);

  // Sync draft form state when modal opens or incoming config changes
  useEffect(() => {
    if (isOpen) {
      setCostPerSheetStr(String(config.costPerSheet));
      setClickCostStr(String(config.clickCost));
      setOtherFixedCostsStr(String(config.otherFixedCosts));
      setMarkupPercentStr(String(config.markupPercent));
      setCurrency(config.currency);
    }
  }, [isOpen, config]);

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

  // Derive parsed draft config
  const draftConfig: PricingConfig = useMemo(() => {
    return {
      costPerSheet: Math.max(0, parseFloat(costPerSheetStr) || 0),
      clickCost: Math.max(0, parseFloat(clickCostStr) || 0),
      otherFixedCosts: Math.max(0, parseFloat(otherFixedCostsStr) || 0),
      markupPercent: Math.max(0, parseFloat(markupPercentStr) || 0),
      currency,
    };
  }, [costPerSheetStr, clickCostStr, otherFixedCostsStr, markupPercentStr, currency]);

  // Compute live breakdown preview (uses current job stats or fallback simulation if no sheets)
  const isJobActive = sheetsCount > 0;
  const simSheets = isJobActive ? sheetsCount : 1;
  const simPlaced = isJobActive ? placedCount : 1;
  const simWaste = isJobActive ? wastePercent : 0;

  const preview = useMemo(() => {
    return calculatePricing({
      totalSheets: simSheets,
      placedCount: simPlaced,
      wastePercent: simWaste,
      config: draftConfig,
    });
  }, [simSheets, simPlaced, simWaste, draftConfig]);

  const profitAmount = roundCurrency(preview.suggestedTotalPrice - preview.totalProductionCost);

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';

  const handleResetDefaults = () => {
    setCostPerSheetStr(String(DEFAULT_PRICING_CONFIG.costPerSheet));
    setClickCostStr(String(DEFAULT_PRICING_CONFIG.clickCost));
    setOtherFixedCostsStr(String(DEFAULT_PRICING_CONFIG.otherFixedCosts));
    setMarkupPercentStr(String(DEFAULT_PRICING_CONFIG.markupPercent));
    setCurrency(DEFAULT_PRICING_CONFIG.currency);
    if (onReset) {
      onReset();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(draftConfig);
    onClose();
  };

  if (!isOpen) return null;

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
        aria-labelledby="pricing-modal-title"
        className="relative my-8 w-full max-w-2xl rounded-2xl border border-stone-200/80 bg-white p-6 shadow-2xl overflow-hidden dark:border-[#1E2B45] dark:bg-[#111A2E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4 dark:border-[#1E2B45]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="pricing-modal-title"
                className="text-base font-semibold tracking-tight text-stone-900 sm:text-lg dark:text-slate-100"
              >
                Custos & Precificação de Impressão
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Configure os custos unitários de produção e a margem comercial para orçamentos automáticos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors dark:text-slate-400 dark:hover:bg-[#18243C] dark:hover:text-slate-200"
            aria-label="Fechar modal de precificação"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="mt-5 space-y-6">
          {/* Inputs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-slate-400">
                Parâmetros de Custo & Margem
              </span>
              <div className="w-40">
                <label htmlFor="pricing-currency" className="sr-only">
                  Moeda
                </label>
                <select
                  id="pricing-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full rounded-xl border border-stone-200/80 bg-stone-50/70 px-2.5 py-1.5 text-xs font-medium text-stone-900 shadow-xs focus:border-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100 dark:focus:border-teal-400 dark:focus:bg-[#0D1527]"
                >
                  <option value="BRL">BRL (R$) — Real</option>
                  <option value="USD">USD ($) — Dólar</option>
                  <option value="EUR">EUR (€) — Euro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Custo da Folha */}
              <div className="space-y-1">
                <label
                  htmlFor="pricing-cost-per-sheet"
                  className="flex items-center justify-between text-xs font-medium text-stone-700 dark:text-slate-300"
                >
                  <span>Custo da Folha (Substrato)</span>
                  <span className="text-[11px] font-normal text-stone-400 dark:text-slate-500">por folha inteira</span>
                </label>
                <div className="relative rounded-xl border border-stone-200/80 bg-stone-50/50 shadow-xs focus-within:border-stone-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:focus-within:border-teal-400 dark:focus-within:bg-[#0D1527]">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-stone-400 dark:text-slate-500">
                    {currencySymbol}
                  </span>
                  <input
                    id="pricing-cost-per-sheet"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={costPerSheetStr}
                    onChange={(e) => setCostPerSheetStr(e.target.value)}
                    className="w-full rounded-xl bg-transparent py-2 pl-9 pr-3 text-xs font-medium text-stone-900 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Custo do Clique / Impressão */}
              <div className="space-y-1">
                <label
                  htmlFor="pricing-click-cost"
                  className="flex items-center justify-between text-xs font-medium text-stone-700 dark:text-slate-300"
                >
                  <span>Custo de Impressão (Clique)</span>
                  <span className="text-[11px] font-normal text-stone-400 dark:text-slate-500">tinta/toner por folha</span>
                </label>
                <div className="relative rounded-xl border border-stone-200/80 bg-stone-50/50 shadow-xs focus-within:border-stone-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:focus-within:border-teal-400 dark:focus-within:bg-[#0D1527]">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-stone-400 dark:text-slate-500">
                    {currencySymbol}
                  </span>
                  <input
                    id="pricing-click-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={clickCostStr}
                    onChange={(e) => setClickCostStr(e.target.value)}
                    className="w-full rounded-xl bg-transparent py-2 pl-9 pr-3 text-xs font-medium text-stone-900 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Custos Fixos / Acabamento */}
              <div className="space-y-1">
                <label
                  htmlFor="pricing-fixed-cost"
                  className="flex items-center justify-between text-xs font-medium text-stone-700 dark:text-slate-300"
                >
                  <span>Custos Fixos / Acabamento</span>
                  <span className="text-[11px] font-normal text-stone-400 dark:text-slate-500">corte, vinco, refile</span>
                </label>
                <div className="relative rounded-xl border border-stone-200/80 bg-stone-50/50 shadow-xs focus-within:border-stone-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:focus-within:border-teal-400 dark:focus-within:bg-[#0D1527]">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-stone-400 dark:text-slate-500">
                    {currencySymbol}
                  </span>
                  <input
                    id="pricing-fixed-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={otherFixedCostsStr}
                    onChange={(e) => setOtherFixedCostsStr(e.target.value)}
                    className="w-full rounded-xl bg-transparent py-2 pl-9 pr-3 text-xs font-medium text-stone-900 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Margem de Lucro / Markup */}
              <div className="space-y-1">
                <label
                  htmlFor="pricing-markup-percent"
                  className="flex items-center justify-between text-xs font-medium text-stone-700 dark:text-slate-300"
                >
                  <span>Margem de Lucro (Markup)</span>
                  <span className="text-[11px] font-normal text-stone-400 dark:text-slate-500">sobre custo total</span>
                </label>
                <div className="relative rounded-xl border border-stone-200/80 bg-stone-50/50 shadow-xs focus-within:border-stone-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:focus-within:border-teal-400 dark:focus-within:bg-[#0D1527]">
                  <input
                    id="pricing-markup-percent"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="40"
                    value={markupPercentStr}
                    onChange={(e) => setMarkupPercentStr(e.target.value)}
                    className="w-full rounded-xl bg-transparent py-2 pl-3 pr-8 text-xs font-medium text-stone-900 focus:outline-none dark:text-slate-100"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-stone-400 dark:text-slate-500">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Breakdown Preview */}
          <div className="rounded-xl border border-stone-200/70 bg-stone-50/60 p-4 dark:border-[#1E2B45] dark:bg-[#0D1527]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-slate-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Prévia do Orçamento em Tempo Real</span>
              </div>
              <span className="rounded-full bg-stone-200/70 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-[#18243C] dark:text-slate-300">
                {isJobActive
                  ? `${simSheets} ${simSheets === 1 ? 'folha' : 'folhas'} • ${simPlaced} ${simPlaced === 1 ? 'peça' : 'peças'} • ${formatNumber(simWaste, 1)}% aparas`
                  : 'Simulação base (1 folha)'}
              </span>
            </div>

            {/* Breakdown List */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-stone-600 dark:text-slate-400">
                <span>Custo do Substrato ({simSheets}x {currencySymbol} {formatNumber(draftConfig.costPerSheet, 2)}):</span>
                <span className="font-mono font-medium text-stone-800 dark:text-slate-200">
                  {formatCurrency(preview.rawMaterialCost, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-600 dark:text-slate-400">
                <span>Custo de Impressão ({simSheets}x {currencySymbol} {formatNumber(draftConfig.clickCost, 2)}):</span>
                <span className="font-mono font-medium text-stone-800 dark:text-slate-200">
                  {formatCurrency(preview.totalClickCost, currency)}
                </span>
              </div>

              {draftConfig.otherFixedCosts > 0 && (
                <div className="flex items-center justify-between text-stone-600 dark:text-slate-400">
                  <span>Custos Fixos / Acabamento:</span>
                  <span className="font-mono font-medium text-stone-800 dark:text-slate-200">
                    {formatCurrency(draftConfig.otherFixedCosts, currency)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-stone-200/60 pt-1.5 font-medium text-stone-900 dark:border-[#1E2B45] dark:text-slate-100">
                <span>Custo Total de Produção:</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(preview.totalProductionCost, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Margem de Lucro (+{draftConfig.markupPercent}%):
                </span>
                <span className="font-mono font-semibold">
                  +{formatCurrency(profitAmount, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-emerald-100/70 px-2.5 py-2 text-emerald-950 font-semibold text-sm dark:bg-emerald-950/60 dark:text-emerald-200">
                <span>Preço Final Sugerido:</span>
                <span className="font-mono text-base font-bold text-emerald-900 dark:text-emerald-100">
                  {formatCurrency(preview.suggestedTotalPrice, currency)}
                </span>
              </div>

              {/* Scrap waste cost */}
              <div className="flex items-center justify-between text-[11px] text-rose-700 pt-0.5 dark:text-rose-400">
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-rose-500 dark:text-rose-400" />
                  Valor Desperdiçado em Aparas ({formatNumber(simWaste, 1)}%):
                </span>
                <span className="font-mono font-medium">
                  {formatCurrency(preview.wasteCostValue, currency)}
                </span>
              </div>

              {/* Unit metrics if pieces placed */}
              {simPlaced > 0 && (
                <div className="flex items-center justify-between border-t border-stone-200/40 pt-1.5 text-[11px] text-stone-500 dark:border-[#1E2B45] dark:text-slate-400">
                  <span>Custo Unitário: <strong className="text-stone-700 dark:text-slate-200">{formatCurrency(preview.unitCost, currency)}</strong></span>
                  <span>Preço Unitário: <strong className="text-emerald-700 dark:text-emerald-400">{formatCurrency(preview.unitPrice, currency)} / un</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/80 bg-white px-3.5 py-2 text-xs font-medium text-stone-600 shadow-xs hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 transition-colors dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-[#18243C] dark:hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar Padrões
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-stone-200/80 bg-white px-4 py-2 text-xs font-medium text-stone-700 shadow-xs hover:bg-stone-50 transition-colors dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300 dark:hover:bg-[#18243C] dark:hover:text-white"
              >
                Fechar
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-stone-50 shadow-xs hover:bg-stone-800 transition-colors dark:bg-teal-700 dark:hover:bg-teal-600 dark:text-white"
              >
                <Check className="h-4 w-4" />
                Salvar Configurações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
