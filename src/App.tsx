import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Layers, Moon, Sun, Zap } from 'lucide-react';
import { GuillotineModal } from './components/GuillotineModal';
import { ItemListPanel } from './components/ItemListPanel';
import { MetricsBar } from './components/MetricsBar';
import { PricingModal } from './components/PricingModal';
import { QuickModePanel } from './components/QuickModePanel';
import { SheetConfigPanel } from './components/SheetConfigPanel';
import { SheetVisualizer } from './components/SheetVisualizer';
import { SubstrateRecommenderModal } from './components/SubstrateRecommenderModal';
import { DEFAULT_MULTI_ITEMS, DEFAULT_SHEET_CONFIG, ITEM_COLORS } from './constants/sheets';
import { analyzeGuillotineCuts } from './engine/guillotine';
import { computeQuickYield, packItems } from './engine/packer';
import { calculatePricing } from './engine/pricing';
import type {
  AppMode,
  ItemSpec,
  PlacedItem,
  PricingConfig,
  QuickStrategy,
  SheetConfig,
  SheetLayout,
  Unit,
} from './types/optimizer';
import {
  loadSavedPricingConfig,
  resetPricingConfig,
  savePricingConfig,
} from './utils/pricingStorage';
import {
  applyTheme,
  getStoredTheme,
  setStoredTheme,
  toggleTheme,
  type Theme,
} from './utils/theme';

export function App(): React.ReactElement {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [mode, setMode] = useState<AppMode>('quick');
  const [unit, setUnit] = useState<Unit>('mm');
  const [sheet, setSheet] = useState<SheetConfig>(DEFAULT_SHEET_CONFIG);

  useEffect(() => {
    applyTheme(theme);
    setStoredTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => toggleTheme(prev));
  };

  // Quick mode state ("Quantos cabem?")
  const [quickWidthMm, setQuickWidthMm] = useState<number>(90);
  const [quickHeightMm, setQuickHeightMm] = useState<number>(50);
  const [quickName, setQuickName] = useState<string>('Cartão de Visita');
  const [quickStrategy, setQuickStrategy] = useState<QuickStrategy>('mixed');

  // Multi-item mode state
  const [multiItems, setMultiItems] = useState<ItemSpec[]>(DEFAULT_MULTI_ITEMS);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [pinnedItems, setPinnedItems] = useState<PlacedItem[]>([]);

  // Commercial print shop pricing configuration & modal state
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(() => loadSavedPricingConfig());
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);

  // Substrate recommender modal state ("Qual Folha Comprar?")
  const [isRecommenderModalOpen, setIsRecommenderModalOpen] = useState<boolean>(false);

  // Guillotine cut sequencer modal state ("Sequenciador de Cortes")
  const [isGuillotineModalOpen, setIsGuillotineModalOpen] = useState<boolean>(false);

  const handleApplyRecommendedPreset = (presetId: string, widthMm: number, heightMm: number) => {
    setSheet((prev) => ({
      ...prev,
      presetId,
      widthMm,
      heightMm,
      orientation: widthMm > heightMm ? 'landscape' : 'portrait',
    }));
    setIsRecommenderModalOpen(false);
  };

  const handleItemMove = (item: PlacedItem, newX: number, newY: number) => {
    setPinnedItems((prev) => {
      const filtered = prev.filter(
        (p) => !(p.itemId === item.itemId && p.index === item.index && (p.sheetNumber ?? 1) === (item.sheetNumber ?? (activeSheetIndex + 1)))
      );
      return [
        ...filtered,
        {
          ...item,
          x: newX,
          y: newY,
          isPinned: true,
          sheetNumber: item.sheetNumber ?? (activeSheetIndex + 1),
        },
      ];
    });
  };

  const handleItemPinChange = (item: PlacedItem, isPinned: boolean) => {
    setPinnedItems((prev) => {
      const filtered = prev.filter(
        (p) => !(p.itemId === item.itemId && p.index === item.index && (p.sheetNumber ?? 1) === (item.sheetNumber ?? (activeSheetIndex + 1)))
      );
      if (isPinned) {
        return [
          ...filtered,
          {
            ...item,
            isPinned: true,
            sheetNumber: item.sheetNumber ?? (activeSheetIndex + 1),
          },
        ];
      }
      return filtered;
    });
  };

  const handleResetPins = () => {
    setPinnedItems([]);
  };

  // Compute Quick Mode Comparison
  const quickComparison = useMemo(() => {
    return computeQuickYield(sheet, quickWidthMm, quickHeightMm, quickName || 'Peça', ITEM_COLORS[0]);
  }, [sheet, quickWidthMm, quickHeightMm, quickName]);

  // Compute Multi-Item Packing Result
  const multiResult = useMemo(() => {
    return packItems(sheet, multiItems, pinnedItems);
  }, [sheet, multiItems, pinnedItems]);

  // Resolve active layouts and metrics depending on current mode
  const isQuick = mode === 'quick';
  const quickSelectedResult = quickComparison[quickStrategy];

  const activeLayouts: SheetLayout[] = isQuick
    ? [quickSelectedResult.layout]
    : multiResult.sheets;

  const safeSheetIndex =
    activeLayouts.length > 0
      ? Math.min(activeSheetIndex, activeLayouts.length - 1)
      : 0;

  const activeLayout = activeLayouts[safeSheetIndex] ?? null;

  const metrics = isQuick
    ? {
        utilizationPercent: quickSelectedResult.utilizationPercent,
        wastePercent: quickSelectedResult.wastePercent,
        placedCount: quickSelectedResult.count,
        requestedCount: undefined,
        sheetsCount: quickSelectedResult.count > 0 ? 1 : 0,
      }
    : {
        utilizationPercent: multiResult.overallUtilizationPercent,
        wastePercent: multiResult.overallWastePercent,
        placedCount: multiResult.totalPlaced,
        requestedCount: multiResult.totalRequested,
        sheetsCount: multiResult.sheets.length,
      };

  // Compute Guillotine cut feasibility & step-by-step sequence for active sheet
  const guillotineAnalysis = useMemo(() => {
    return activeLayout ? analyzeGuillotineCuts(activeLayout) : null;
  }, [activeLayout]);

  // Compute pricing simulation reactively based on active job metrics
  const pricingCalculation = useMemo(() => {
    return calculatePricing({
      totalSheets: metrics.sheetsCount,
      placedCount: metrics.placedCount,
      wastePercent: metrics.wastePercent,
      config: pricingConfig,
    });
  }, [metrics.sheetsCount, metrics.placedCount, metrics.wastePercent, pricingConfig]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-900 dark:bg-[#0B111E] dark:text-slate-100">
      {/* Top Header */}
      <header className="no-print sticky top-0 z-20 border-b border-stone-200/70 bg-white/80 backdrop-blur-md dark:border-[#1E2B45] dark:bg-[#0B111E]/95">
        <div className="mx-auto flex max-w-[1540px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-stone-900 sm:text-lg dark:text-white">
              OptiPrint
            </h1>
            <p className="text-xs font-light text-stone-400 dark:text-slate-400">
              Estúdio de Imposição & Aproveitamento
            </p>
          </div>

          {/* Right cluster: Mode Switcher & Theme Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Mode Switcher */}
            <div className="inline-flex rounded-full border border-stone-200/50 bg-stone-100/80 p-1 shadow-xs dark:border-[#1E2B45] dark:bg-[#111A2E]/80">
              <button
                type="button"
                onClick={() => setMode('quick')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all sm:text-sm ${
                  mode === 'quick'
                    ? 'bg-white text-stone-900 shadow-xs font-medium dark:bg-[#18243C] dark:text-white'
                    : 'text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Zap
                  className={`h-4 w-4 ${mode === 'quick' ? 'text-amber-500' : 'text-stone-400 dark:text-slate-500'}`}
                />
                Modo Rápido (1 Elemento)
              </button>
              <button
                type="button"
                onClick={() => setMode('multi')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all sm:text-sm ${
                  mode === 'multi'
                    ? 'bg-white text-stone-900 shadow-xs font-medium dark:bg-[#18243C] dark:text-white'
                    : 'text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Layers
                  className={`h-4 w-4 ${mode === 'multi' ? 'text-teal-700 dark:text-teal-400' : 'text-stone-400 dark:text-slate-500'}`}
                />
                Vários Elementos
              </button>
            </div>

            {/* Tinted Dark Mode Toggle */}
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200/80 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-amber-400 dark:hover:bg-[#18243C] dark:hover:text-amber-300 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main 2-Column Workspace */}
      <main className="mx-auto flex max-w-[1540px] flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row lg:items-start">
        {/* Left Sidebar Controls */}
        <aside className="no-print w-full shrink-0 space-y-4 lg:w-[380px]">
          <SheetConfigPanel
            sheet={sheet}
            unit={unit}
            onUnitChange={setUnit}
            onChange={setSheet}
          />

          {isQuick ? (
            <QuickModePanel
              itemWidthMm={quickWidthMm}
              itemHeightMm={quickHeightMm}
              itemName={quickName}
              unit={unit}
              comparison={quickComparison}
              activeStrategy={quickStrategy}
              onItemChange={(w, h, name) => {
                setQuickWidthMm(w);
                setQuickHeightMm(h);
                setQuickName(name);
              }}
              onSelectStrategy={setQuickStrategy}
              onOpenRecommender={() => setIsRecommenderModalOpen(true)}
            />
          ) : (
            <ItemListPanel
              items={multiItems}
              unit={unit}
              unplacedItems={multiResult.unplacedItems}
              onChange={(nextItems) => {
                setMultiItems(nextItems);
                setActiveSheetIndex(0);
              }}
            />
          )}
        </aside>

        {/* Right Canvas & KPIs */}
        <section className="min-w-0 flex-1 space-y-5">
          <MetricsBar
            utilizationPercent={metrics.utilizationPercent}
            wastePercent={metrics.wastePercent}
            placedCount={metrics.placedCount}
            requestedCount={metrics.requestedCount}
            sheetsCount={metrics.sheetsCount}
            activeLayout={activeLayout}
            isQuickMode={isQuick}
            pricingCalculation={pricingCalculation}
            pricingConfig={pricingConfig}
            onOpenPricingModal={() => setIsPricingModalOpen(true)}
          />

          {!isQuick && multiResult.unplacedItems.length > 0 && (
            <div className="no-print flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs text-amber-900 shadow-xs dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold">
                  Alguns elementos não puderam ser acomodados na folha atual:
                </p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-800 dark:text-amber-300">
                  {multiResult.unplacedItems.map((u) => (
                    <li key={`${u.itemId}-${u.reason}`}>
                      <strong>{u.name}</strong> ({u.quantity} un. — {u.widthMm}×{u.heightMm} mm):{' '}
                      {u.reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <SheetVisualizer
            layouts={activeLayouts}
            activeSheetIndex={safeSheetIndex}
            onSelectSheet={setActiveSheetIndex}
            unit={unit}
            guillotineAnalysis={guillotineAnalysis}
            onOpenGuillotineModal={() => setIsGuillotineModalOpen(true)}
            guillotineRequired={sheet.guillotineRequired ?? true}
            onToggleGuillotineRequired={(required) =>
              setSheet((prev) => ({ ...prev, guillotineRequired: required }))
            }
            onItemMove={handleItemMove}
            onItemPinChange={handleItemPinChange}
            onResetPins={handleResetPins}
          />
        </section>
      </main>

      {/* Commercial Pricing & Cost Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        config={pricingConfig}
        onSave={(nextConfig) => {
          savePricingConfig(nextConfig);
          setPricingConfig(nextConfig);
        }}
        onReset={() => {
          const reset = resetPricingConfig();
          setPricingConfig(reset);
        }}
        sheetsCount={metrics.sheetsCount}
        placedCount={metrics.placedCount}
        wastePercent={metrics.wastePercent}
      />

      {/* Substrate Recommender Modal ("Qual Folha Comprar?") */}
      <SubstrateRecommenderModal
        isOpen={isRecommenderModalOpen}
        onClose={() => setIsRecommenderModalOpen(false)}
        itemWidthMm={quickWidthMm}
        itemHeightMm={quickHeightMm}
        itemName={quickName}
        marginMm={sheet.marginMm}
        spacingMm={sheet.spacingMm}
        currentPresetId={sheet.presetId}
        pricingConfig={pricingConfig}
        onApplyPreset={handleApplyRecommendedPreset}
      />

      {/* Guillotine Cut Step-by-Step Sequence Modal */}
      <GuillotineModal
        isOpen={isGuillotineModalOpen}
        onClose={() => setIsGuillotineModalOpen(false)}
        analysis={guillotineAnalysis}
        sheetLayout={activeLayout}
      />
    </div>
  );
}

export default App;
