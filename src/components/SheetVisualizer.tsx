import React, { useMemo, useRef, useState } from 'react';
import {
  Crosshair,
  Eye,
  Info,
  Layers,
  PinOff,
  RotateCw,
  Scissors,
  SquareDashed,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { analyzeGuillotineCuts } from '../engine/guillotine';
import type { GuillotineAnalysis, PlacedItem, SheetLayout, Unit } from '../types/optimizer';
import { formatDim } from '../utils/units';

export interface SheetVisualizerProps {
  layouts: SheetLayout[];
  activeSheetIndex: number;
  onSelectSheet: (index: number) => void;
  unit: Unit;
  initialShowCropMarks?: boolean;
  initialShowBleed?: boolean;
  showCropMarks?: boolean;
  showBleed?: boolean;
  onToggleCropMarks?: (show: boolean) => void;
  onToggleBleed?: (show: boolean) => void;
  guillotineAnalysis?: GuillotineAnalysis | null;
  onOpenGuillotineModal?: () => void;
  initialShowGuillotineCuts?: boolean;
  showGuillotineCuts?: boolean;
  onToggleGuillotineCuts?: (show: boolean) => void;
  guillotineRequired?: boolean;
  onToggleGuillotineRequired?: (required: boolean) => void;
  onItemPinChange?: (item: PlacedItem, isPinned: boolean) => void;
  onItemMove?: (item: PlacedItem, newX: number, newY: number) => void;
  onResetPins?: () => void;
}

export const SheetVisualizer: React.FC<SheetVisualizerProps> = ({
  layouts,
  activeSheetIndex,
  onSelectSheet,
  unit,
  initialShowCropMarks = true,
  initialShowBleed = true,
  showCropMarks: controlledShowCropMarks,
  showBleed: controlledShowBleed,
  onToggleCropMarks,
  onToggleBleed,
  guillotineAnalysis,
  onOpenGuillotineModal,
  initialShowGuillotineCuts = false,
  showGuillotineCuts: controlledShowGuillotineCuts,
  onToggleGuillotineCuts,
  guillotineRequired,
  onToggleGuillotineRequired,
  onItemPinChange,
  onItemMove,
  onResetPins,
}) => {
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [internalShowCropMarks, setInternalShowCropMarks] = useState<boolean>(initialShowCropMarks);
  const [internalShowBleed, setInternalShowBleed] = useState<boolean>(initialShowBleed);
  const [internalShowGuillotineCuts, setInternalShowGuillotineCuts] = useState<boolean>(initialShowGuillotineCuts);
  const [hoveredItem, setHoveredItem] = useState<PlacedItem | null>(null);

  // Dragging state
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingItem, setDraggingItem] = useState<PlacedItem | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; y: number } | null>(null);

  const showCropMarks = controlledShowCropMarks ?? internalShowCropMarks;
  const showBleed = controlledShowBleed ?? internalShowBleed;
  const showGuillotineCuts = controlledShowGuillotineCuts ?? internalShowGuillotineCuts;

  const handleToggleCropMarks = () => {
    const next = !showCropMarks;
    setInternalShowCropMarks(next);
    onToggleCropMarks?.(next);
  };

  const handleToggleBleed = () => {
    const next = !showBleed;
    setInternalShowBleed(next);
    onToggleBleed?.(next);
  };

  const handleToggleGuillotineCuts = () => {
    const next = !showGuillotineCuts;
    setInternalShowGuillotineCuts(next);
    onToggleGuillotineCuts?.(next);
  };

  const activeLayout = layouts[activeSheetIndex] || layouts[0] || null;

  const resolvedGuillotineAnalysis = useMemo(() => {
    if (guillotineAnalysis !== undefined) return guillotineAnalysis;
    return activeLayout ? analyzeGuillotineCuts(activeLayout) : null;
  }, [guillotineAnalysis, activeLayout]);

  const pinnedItemsCount = useMemo(() => {
    if (!activeLayout) return 0;
    return activeLayout.placedItems.filter((it) => it.isPinned).length;
  }, [activeLayout]);

  const handleZoom = (delta: number) => {
    setZoomPercent((prev) => Math.min(250, Math.max(40, prev + delta)));
  };

  const handleResetZoom = () => {
    setZoomPercent(100);
  };

  // Drag handlers
  const handleItemPointerDown = (item: PlacedItem, e: React.PointerEvent) => {
    e.stopPropagation();
    if (!svgRef.current) return;
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const svgX = inv.a * e.clientX + inv.c * e.clientY + inv.e;
    const svgY = inv.b * e.clientX + inv.d * e.clientY + inv.f;

    setDraggingItem(item);
    setDragOffset({
      x: svgX - item.x,
      y: svgY - item.y,
    });
    setDragCurrentPos({ x: item.x, y: item.y });
  };

  const handleSvgPointerMove = (e: React.PointerEvent) => {
    if (!draggingItem || !svgRef.current || !activeLayout) return;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const svgX = inv.a * e.clientX + inv.c * e.clientY + inv.e;
    const svgY = inv.b * e.clientX + inv.d * e.clientY + inv.f;

    let targetX = svgX - dragOffset.x;
    let targetY = svgY - dragOffset.y;

    // Clamp within sheet margins
    const margin = activeLayout.marginMm;
    const minX = margin;
    const minY = margin;
    const maxX = Math.max(minX, activeLayout.widthMm - margin - draggingItem.width);
    const maxY = Math.max(minY, activeLayout.heightMm - margin - draggingItem.height);

    targetX = Math.max(minX, Math.min(maxX, targetX));
    targetY = Math.max(minY, Math.min(maxY, targetY));

    setDragCurrentPos({ x: targetX, y: targetY });
  };

  const handleSvgPointerUp = (e: React.PointerEvent) => {
    if (!draggingItem) return;
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    if (dragCurrentPos) {
      // Only trigger if actually moved or pinning requested
      const dist = Math.hypot(dragCurrentPos.x - draggingItem.x, dragCurrentPos.y - draggingItem.y);
      if (dist > 1) {
        onItemMove?.(draggingItem, dragCurrentPos.x, dragCurrentPos.y);
      } else if (!draggingItem.isPinned) {
        onItemPinChange?.(draggingItem, true);
      }
    }

    setDraggingItem(null);
    setDragCurrentPos(null);
  };

  const handleSvgPointerCancel = () => {
    setDraggingItem(null);
    setDragCurrentPos(null);
  };

  if (!activeLayout) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-[#F7F7F5] p-8 text-center text-stone-500 shadow-xs dark:border-[#1E2B45] dark:bg-[#070B14] dark:text-slate-400">
        <Layers className="mb-2 h-10 w-10 text-stone-400 stroke-1 dark:text-slate-500" />
        <h3 className="font-semibold text-stone-800 dark:text-slate-100">Nenhuma folha gerada</h3>
        <p className="mt-1 max-w-sm text-xs text-stone-400 font-light dark:text-slate-500">
          Configure as medidas da folha e adicione pelo menos um elemento válido para visualizar
          o arranjo de corte.
        </p>
      </div>
    );
  }

  const w = activeLayout.widthMm;
  const h = activeLayout.heightMm;
  const margin = activeLayout.marginMm;
  const usableW = Math.max(0, w - 2 * margin);
  const usableH = Math.max(0, h - 2 * margin);

  const isShortGrain = activeLayout.grainDirection === 'short';
  const grainLabel = isShortGrain ? 'Fibra: Curta ↔' : 'Fibra: Longa ↕';
  const grainX = Math.max(2, w - Math.max(margin, 2) - 42);
  const grainY = Math.max(5, margin > 0 ? margin + 3.2 : 5);
  const arrowX = grainX + 28;
  const arrowY = grainY - 0.8;

  const arrowPath = isShortGrain
    ? `M ${(arrowX - 3.5).toFixed(2)} ${arrowY.toFixed(2)} L ${(arrowX + 3.5).toFixed(2)} ${arrowY.toFixed(2)} M ${(arrowX - 2).toFixed(2)} ${(arrowY - 1).toFixed(2)} L ${(arrowX - 3.5).toFixed(2)} ${arrowY.toFixed(2)} L ${(arrowX - 2).toFixed(2)} ${(arrowY + 1).toFixed(2)} M ${(arrowX + 2).toFixed(2)} ${(arrowY - 1).toFixed(2)} L ${(arrowX + 3.5).toFixed(2)} ${arrowY.toFixed(2)} L ${(arrowX + 2).toFixed(2)} ${(arrowY + 1).toFixed(2)}`
    : `M ${arrowX.toFixed(2)} ${(arrowY - 3.5).toFixed(2)} L ${arrowX.toFixed(2)} ${(arrowY + 3.5).toFixed(2)} M ${(arrowX - 1).toFixed(2)} ${(arrowY - 2).toFixed(2)} L ${arrowX.toFixed(2)} ${(arrowY - 3.5).toFixed(2)} L ${(arrowX + 1).toFixed(2)} ${(arrowY - 2).toFixed(2)} M ${(arrowX - 1).toFixed(2)} ${(arrowY + 2).toFixed(2)} L ${arrowX.toFixed(2)} ${(arrowY + 3.5).toFixed(2)} L ${(arrowX + 1).toFixed(2)} ${(arrowY + 2).toFixed(2)}`;

  return (
    <div className="flex flex-col rounded-3xl border border-stone-200/70 bg-white shadow-xs overflow-hidden dark:border-[#1E2B45] dark:bg-[#111A2E]">
      {/* Top Toolbar: Sheet tabs & Canvas controls */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2.5 border-b border-stone-200/60 bg-stone-50/60 px-5 py-3 dark:border-[#1E2B45] dark:bg-[#111A2E]">
        {/* Pagination tabs (multi-sheet) & Guillotine status */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto py-0.5">
          {layouts.length > 1 ? (
            layouts.map((layout, idx) => {
              const active = idx === activeSheetIndex;
              return (
                <button
                  key={layout.sheetNumber}
                  type="button"
                  onClick={() => onSelectSheet(idx)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-stone-900 text-white shadow-xs dark:bg-[#18243C] dark:text-white'
                      : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/70 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300 dark:hover:bg-[#18243C]'
                  }`}
                >
                  <span>Folha {layout.sheetNumber}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      active
                        ? 'bg-stone-800 text-stone-300 dark:bg-[#233252] dark:text-slate-200'
                        : 'bg-stone-100 text-stone-500 dark:bg-[#18243C] dark:text-slate-400'
                    }`}
                  >
                    {layout.placedItems.length}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-slate-300">
              <span className="inline-flex h-2 w-2 rounded-full bg-teal-600" />
              Folha 1 de 1 ({activeLayout.placedItems.length} peças)
            </div>
          )}

          {/* Reset Pins Button (if any items are pinned) */}
          {pinnedItemsCount > 0 && onResetPins && (
            <button
              type="button"
              data-testid="unpin-all-btn"
              onClick={onResetPins}
              title="Desafixar todos os elementos e retornar ao arranjo automático"
              className="inline-flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60"
            >
              <PinOff className="h-3 w-3" />
              Desafixar Todos ({pinnedItemsCount})
            </button>
          )}

          {/* Guillotine Viability Badge & Modal Trigger */}
          {resolvedGuillotineAnalysis && (
            <div
              data-testid="guillotine-top-status"
              className="inline-flex items-center gap-1.5 pl-1"
            >
              <div className="h-3.5 w-px bg-stone-200 mx-0.5 dark:bg-slate-700" />
              {resolvedGuillotineAnalysis.isGuillotineCuttable ? (
                <span
                  data-testid="guillotine-viability-badge"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Guilhotinável ({resolvedGuillotineAnalysis.totalCutsNeeded}{' '}
                  {resolvedGuillotineAnalysis.totalCutsNeeded === 1 ? 'corte' : 'cortes'})
                </span>
              ) : (
                <span
                  data-testid="guillotine-viability-badge"
                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/70 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Não Guilhotinável (Pinwheel)
                </span>
              )}
              {onOpenGuillotineModal && (
                <button
                  type="button"
                  data-testid="open-guillotine-modal-btn"
                  onClick={onOpenGuillotineModal}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors cursor-pointer whitespace-nowrap dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Ver Passo a Passo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Display Toggles & Zoom */}
        <div className="flex items-center gap-1.5">
          {/* Require Guillotine Cut Toggle */}
          {onToggleGuillotineRequired && (
            <label
              data-testid="toggle-guillotine-required"
              title="Exigir corte de guilhotina linear de ponta a ponta (garante cortes retos de ponta a ponta sem fatiar peças adjacentes)"
              className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium border cursor-pointer select-none transition-colors ${
                (guillotineRequired ?? true)
                  ? 'bg-amber-50/80 text-amber-900 border-amber-300 dark:border-amber-700/70 dark:bg-amber-950/50 dark:text-amber-200'
                  : 'bg-white text-stone-500 border-stone-200/70 hover:bg-stone-50 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-400 dark:hover:bg-[#18243C]'
              }`}
            >
              <input
                type="checkbox"
                data-testid="guillotine-required-checkbox"
                checked={guillotineRequired ?? true}
                onChange={(e) => onToggleGuillotineRequired(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`h-2 w-2 rounded-full transition-colors ${
                  (guillotineRequired ?? true) ? 'bg-amber-500' : 'bg-stone-300 dark:bg-slate-600'
                }`}
              />
              <span className="whitespace-nowrap">Exigir Guilhotina</span>
            </label>
          )}

          <button
            type="button"
            onClick={handleToggleGuillotineCuts}
            data-testid="toggle-guillotine-cuts-btn"
            title="Alternar visualização das linhas e números dos cortes sequenciais de guilhotina"
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              showGuillotineCuts
                ? 'bg-indigo-50/80 text-indigo-700 border border-indigo-200 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'bg-white text-stone-600 border border-stone-200/70 hover:bg-stone-50 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300 dark:hover:bg-[#18243C]'
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            Guilhotina
          </button>

          <button
            type="button"
            onClick={() => setShowCutGuides(!showCutGuides)}
            title="Alternar visibilidade das guias de corte e margem de pinça"
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-colors ${
              showCutGuides
                ? 'bg-teal-50/70 text-teal-800 border border-teal-200 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                : 'bg-white text-stone-600 border border-stone-200/70 hover:bg-stone-50 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300 dark:hover:bg-[#18243C]'
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            Guias de Corte
          </button>

          <button
            type="button"
            onClick={handleToggleCropMarks}
            title="Alternar cruzetas de corte profissionais (offset 2mm, comprimento 4mm)"
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-colors ${
              showCropMarks
                ? 'bg-teal-50/70 text-teal-800 border border-teal-200 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                : 'bg-white text-stone-600 border border-stone-200/70 hover:bg-stone-50 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300 dark:hover:bg-[#18243C]'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            Cruzetas
          </button>

          <button
            type="button"
            onClick={handleToggleBleed}
            title="Alternar linhas de sangria externa (2mm)"
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-colors ${
              showBleed
                ? 'bg-teal-50/70 text-teal-800 border border-teal-200 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                : 'bg-white text-stone-600 border border-stone-200/70 hover:bg-stone-50 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300 dark:hover:bg-[#18243C]'
            }`}
          >
            <SquareDashed className="h-3.5 w-3.5" />
            Sangria
          </button>

          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            title="Alternar etiquetas com nome e medidas nos elementos"
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-colors ${
              showLabels
                ? 'bg-teal-50/70 text-teal-800 border border-teal-200 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                : 'bg-white text-stone-600 border border-stone-200/70 hover:bg-stone-50 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300 dark:hover:bg-[#18243C]'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Etiquetas
          </button>

          <div className="h-4 w-px bg-stone-200 mx-1 dark:bg-slate-700" />

          {/* Zoom controls */}
          <div className="inline-flex items-center rounded-full border border-stone-200/80 bg-white/90 backdrop-blur-md shadow-xs px-1 py-0.5 dark:border-[#1E2B45] dark:bg-[#0D1527]">
            <button
              type="button"
              onClick={() => handleZoom(-15)}
              title="Reduzir zoom"
              className="p-1 text-stone-600 hover:bg-stone-100 rounded-full transition-colors dark:text-slate-300 dark:hover:bg-[#18243C]"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Restaurar tamanho padrão (100%)"
              className="px-2 py-0.5 font-mono text-[11px] font-medium text-stone-700 hover:bg-stone-100 rounded-full transition-colors dark:text-slate-200 dark:hover:bg-[#18243C]"
            >
              {zoomPercent}%
            </button>
            <button
              type="button"
              onClick={() => handleZoom(15)}
              title="Aumentar zoom"
              className="p-1 text-stone-600 hover:bg-stone-100 rounded-full transition-colors dark:text-slate-300 dark:hover:bg-[#18243C]"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="print-area relative flex min-h-[500px] flex-1 items-center justify-center overflow-auto bg-[#F7F7F5] p-6 sm:p-8 dark:bg-[#0A0F1D]">
        <div
          className="transition-transform duration-150"
          style={{ transform: `scale(${zoomPercent / 100})`, transformOrigin: 'center center' }}
        >
          {/* Scaled Sheet Paper Card */}
          <div
            className="print-sheet-svg print-sheet-wrapper relative mx-auto bg-white rounded-xs shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] border border-stone-200/80 dark:bg-[#121B2D] dark:border-transparent dark:shadow-2xl dark:shadow-black/70 dark:ring-1 dark:ring-[#2B3B5C] transition-transform duration-100 ease-out origin-center"
            style={{
              width: `${Math.min(760, (w / Math.max(w, h)) * 760)}px`,
              aspectRatio: `${w} / ${h}`,
            }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${w} ${h}`}
              className={`h-full w-full select-none ${draggingItem ? 'cursor-grabbing' : 'cursor-default'}`}
              xmlns="http://www.w3.org/2000/svg"
              onPointerMove={handleSvgPointerMove}
              onPointerUp={handleSvgPointerUp}
              onPointerCancel={handleSvgPointerCancel}
            >
              {/* Outer paper background */}
              <rect
                x="0"
                y="0"
                width={w}
                height={h}
                fill="#ffffff"
                className="fill-white dark:fill-[#121B2D]"
              />

              {/* Printable Area / Margin Guide */}
              {showCutGuides && margin > 0 && (
                <g id="visual-margin-guide">
                  <rect
                    x={margin}
                    y={margin}
                    width={usableW}
                    height={usableH}
                    fill="none"
                    stroke="#a8a29e"
                    className="dark:stroke-slate-500"
                    strokeWidth="0.3"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={margin + 1}
                    y={margin + 3}
                    fontSize="2.4"
                    fill="#a8a29e"
                    className="dark:fill-slate-400"
                    fontFamily="sans-serif"
                  >
                    Área Útil ({formatDim(usableW, unit, false)} × {formatDim(usableH, unit)})
                  </text>
                </g>
              )}

              {/* Paper Grain Direction (Sentido da Fibra) watermark / margin notation */}
              <g
                id="visual-grain-direction"
                data-testid="visual-grain-direction"
                className="pointer-events-none select-none"
              >
                <text
                  x={grainX.toFixed(2)}
                  y={grainY.toFixed(2)}
                  fontSize="2.4"
                  fontFamily="sans-serif"
                  fill="#94a3b8"
                >
                  {grainLabel}
                </text>
                <path
                  d={arrowPath}
                  stroke="#94a3b8"
                  strokeWidth="0.25"
                  fill="none"
                />
              </g>

              {/* Bleed Guide Layer (Sangria de 2mm) */}
              {showBleed && (
                <g id="visual-bleed-layer" data-testid="visual-bleed-layer" className="pointer-events-none">
                  {activeLayout.placedItems.map((item) => (
                    <rect
                      key={`bleed-${item.index}-${item.x}-${item.y}`}
                      data-testid="bleed-rect"
                      x={item.x - 2}
                      y={item.y - 2}
                      width={item.width + 4}
                      height={item.height + 4}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="0.2"
                      strokeDasharray="2,2"
                    />
                  ))}
                </g>
              )}

              {/* Placed Items */}
              <g id="visual-items">
                {activeLayout.placedItems.map((item) => {
                  const isBeingDragged = draggingItem?.index === item.index && draggingItem.sheetNumber === item.sheetNumber;
                  const currentX = isBeingDragged && dragCurrentPos ? dragCurrentPos.x : item.x;
                  const currentY = isBeingDragged && dragCurrentPos ? dragCurrentPos.y : item.y;
                  const isHovered = hoveredItem?.index === item.index;
                  const isPinned = Boolean(item.isPinned);
                  const fontSize = Math.max(
                    2.4,
                    Math.min(5.2, Math.min(item.width, item.height) * 0.14),
                  );

                  return (
                    <g
                      key={`item-${item.index}-${item.x}-${item.y}`}
                      data-testid={`placed-item-${item.index}`}
                      onPointerDown={(e) => handleItemPointerDown(item, e)}
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`transition-opacity ${isBeingDragged ? 'cursor-grabbing opacity-90' : 'cursor-grab'}`}
                    >
                      {/* Item Fill */}
                      <rect
                        x={currentX}
                        y={currentY}
                        width={item.width}
                        height={item.height}
                        fill={item.color}
                        fillOpacity={isBeingDragged ? 0.6 : isHovered ? 0.45 : 0.28}
                        stroke={isBeingDragged ? '#f59e0b' : isHovered ? '#38bdf8' : isPinned ? '#d97706' : item.color}
                        strokeWidth={isBeingDragged ? 0.8 : isHovered ? 0.6 : isPinned ? 0.5 : 0.35}
                        rx="0.4"
                      />

                      {/* Precise Cut Outline */}
                      {showCutGuides && (
                        <rect
                          x={currentX}
                          y={currentY}
                          width={item.width}
                          height={item.height}
                          fill="none"
                          stroke={isPinned ? '#d97706' : '#1c1917'}
                          className={isPinned ? 'stroke-amber-600 dark:stroke-amber-400' : 'dark:stroke-slate-300'}
                          strokeWidth="0.15"
                        />
                      )}

                      {/* Pinned Badge / Icon */}
                      {isPinned && (
                        <g
                          data-testid={`item-pinned-badge-${item.index}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemPinChange?.(item, false);
                          }}
                          className="cursor-pointer"
                        >
                          <rect
                            x={currentX + 1}
                            y={currentY + 1}
                            width="5.5"
                            height="4"
                            rx="0.6"
                            fill="#d97706"
                          />
                          <text
                            x={currentX + 3.75}
                            y={currentY + 3.6}
                            fontSize="2.4"
                            fontFamily="sans-serif"
                            fontWeight="bold"
                            fill="#ffffff"
                            textAnchor="middle"
                          >
                            📌
                          </text>
                        </g>
                      )}

                      {/* 90° Badge */}
                      {item.rotated && (
                        <g>
                          <rect
                            x={currentX + item.width - 5.5}
                            y={currentY + 0.8}
                            width="4.8"
                            height="3.4"
                            rx="0.6"
                            fill="#1c1917"
                            className="dark:fill-slate-700"
                          />
                          <text
                            x={currentX + item.width - 3.1}
                            y={currentY + 3.1}
                            fontSize="2"
                            fontFamily="sans-serif"
                            fontWeight="bold"
                            fill="#ffffff"
                            className="dark:fill-slate-100"
                            textAnchor="middle"
                          >
                            90°
                          </text>
                        </g>
                      )}

                      {/* Item Labels */}
                      {showLabels && (
                        <>
                          {item.width > 22 && item.height > 16 ? (
                            <>
                              <text
                                x={currentX + item.width / 2}
                                y={currentY + item.height / 2 - fontSize * 0.4}
                                fontSize={fontSize}
                                fontFamily="sans-serif"
                                fontWeight="600"
                                fill="#1c1917"
                                className="dark:fill-slate-100"
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                #{item.index} {item.name}
                              </text>
                              <text
                                x={currentX + item.width / 2}
                                y={currentY + item.height / 2 + fontSize * 0.8}
                                fontSize={fontSize * 0.75}
                                fontFamily="sans-serif"
                                fill="#78716c"
                                className="dark:fill-slate-300"
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                {item.width}×{item.height}mm
                              </text>
                            </>
                          ) : (
                            <text
                              x={currentX + item.width / 2}
                              y={currentY + item.height / 2}
                              fontSize={fontSize}
                              fontFamily="sans-serif"
                              fontWeight="600"
                              fill="#1c1917"
                              className="dark:fill-slate-100"
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              #{item.index}
                            </text>
                          )}
                        </>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Crop Marks / Cruzetas de Corte (offset 2mm, length 4mm) */}
              {showCropMarks && (
                <g
                  id="visual-crop-marks"
                  data-testid="visual-crop-marks"
                  stroke="#0f172a"
                  strokeWidth="0.25"
                  className="pointer-events-none dark:stroke-slate-400"
                >
                  {activeLayout.placedItems.map((item) => {
                    const xL = item.x;
                    const xR = item.x + item.width;
                    const yT = item.y;
                    const yB = item.y + item.height;
                    const o = 2;
                    const L = 4;

                    return (
                      <g
                        key={`crop-${item.index}-${item.x}-${item.y}`}
                        data-testid="crop-mark-group"
                        className="crop-mark-group"
                      >
                        {/* Top-Left */}
                        <line x1={xL} y1={yT - o - L} x2={xL} y2={yT - o} />
                        <line x1={xL - o - L} y1={yT} x2={xL - o} y2={yT} />
                        {/* Top-Right */}
                        <line x1={xR} y1={yT - o - L} x2={xR} y2={yT - o} />
                        <line x1={xR + o} y1={yT} x2={xR + o + L} y2={yT} />
                        {/* Bottom-Left */}
                        <line x1={xL} y1={yB + o} x2={xL} y2={yB + o + L} />
                        <line x1={xL - o - L} y1={yB} x2={xL - o} y2={yB} />
                        {/* Bottom-Right */}
                        <line x1={xR} y1={yB + o} x2={xR} y2={yB + o + L} />
                        <line x1={xR + o} y1={yB} x2={xR + o + L} y2={yB} />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Feature #5: Guillotine Cuts Overlay Layer */}
              {showGuillotineCuts && resolvedGuillotineAnalysis && resolvedGuillotineAnalysis.steps.length > 0 && (
                <g
                  id="visual-guillotine-cuts"
                  data-testid="visual-guillotine-cuts"
                  className="pointer-events-none select-none"
                >
                  {resolvedGuillotineAnalysis.steps.map((step) => {
                    const isHoriz = step.direction === 'horizontal';
                    const x1 = isHoriz ? step.cutStartMm : step.coordinateMm;
                    const y1 = isHoriz ? step.coordinateMm : step.cutStartMm;
                    const x2 = isHoriz ? step.cutEndMm : step.coordinateMm;
                    const y2 = isHoriz ? step.coordinateMm : step.cutEndMm;
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const badgeRadius = 2.4;

                    return (
                      <g
                        key={`guillotine-cut-${step.stepNumber}`}
                        data-testid="guillotine-cut-step"
                        className="guillotine-cut-step"
                      >
                        {/* Straight line for the guillotine slice */}
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#6366f1"
                          strokeWidth="0.4"
                          strokeDasharray="3,2"
                        />

                        {/* Numbered circular badge at the midpoint of the cut line */}
                        <circle
                          cx={midX}
                          cy={midY}
                          r={badgeRadius}
                          fill="#6366f1"
                          stroke="#ffffff"
                          strokeWidth="0.3"
                        />
                        <text
                          x={midX}
                          y={midY}
                          fontSize="2.1"
                          fontFamily="sans-serif"
                          fontWeight="bold"
                          fill="#ffffff"
                          textAnchor="middle"
                          dominantBaseline="central"
                        >
                          {step.stepNumber}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Footer Info / Hover Tooltip */}
      {/* Bottom Info Bar: Sheet specs & Live inspector tooltip */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/60 bg-stone-50/60 px-5 py-2.5 text-xs text-stone-500 dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-stone-800 dark:text-slate-200">
            Dimensões da Folha: {formatDim(w, unit, false)} × {formatDim(h, unit)}
          </span>
          <span className="text-stone-300 dark:text-slate-600">•</span>
          <span>Margem: {formatDim(margin, unit)}</span>
          <span className="text-stone-300 dark:text-slate-600">•</span>
          <span>Espaçamento: {formatDim(activeLayout.spacingMm, unit)}</span>
          <span className="text-stone-300 dark:text-slate-600">•</span>
          <span
            data-testid="footer-grain-direction"
            className="font-medium text-stone-700 dark:text-slate-300"
            title={
              isShortGrain
                ? 'Sentido da Fibra: Curta (paralela ao lado menor)'
                : 'Sentido da Fibra: Longa (paralela ao lado maior)'
            }
          >
            {grainLabel}
          </span>
          {(showCropMarks || showBleed) && (
            <>
              <span className="text-stone-300 dark:text-slate-600">•</span>
              <span
                data-testid="guides-badge"
                className="inline-flex items-center gap-1 rounded-md bg-stone-200/60 border border-stone-300/40 px-2 py-0.5 font-sans font-medium text-[11px] text-stone-700 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300"
              >
                {[
                  showCropMarks ? 'Cruzetas (4mm / offset 2mm)' : null,
                  showBleed ? 'Sangria (2mm)' : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </>
          )}
          {resolvedGuillotineAnalysis && (
            <>
              <span className="text-stone-300 dark:text-slate-600">•</span>
              <button
                type="button"
                data-testid="footer-guillotine-status"
                onClick={onOpenGuillotineModal}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-sans font-medium text-[11px] text-indigo-700 bg-indigo-50/70 border border-indigo-200/50 hover:bg-indigo-100 transition-colors cursor-pointer dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/60"
                title="Abrir sequenciador detalhado de cortes de guilhotina"
              >
                <Scissors className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                {resolvedGuillotineAnalysis.isGuillotineCuttable
                  ? `Guilhotina: ${resolvedGuillotineAnalysis.totalCutsNeeded} ${resolvedGuillotineAnalysis.totalCutsNeeded === 1 ? 'corte' : 'cortes'}`
                  : 'Guilhotina: Não viável (Pinwheel)'}
                {onOpenGuillotineModal && (
                  <span className="underline ml-0.5 font-normal text-indigo-800 dark:text-indigo-300">
                    Passo a Passo
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {hoveredItem ? (
          <div className="inline-flex items-center gap-2 font-mono text-xs text-stone-900 dark:text-slate-100">
            <span className="font-semibold">
              #{hoveredItem.index} {hoveredItem.name}:
            </span>
            <span>
              {hoveredItem.width} × {hoveredItem.height} mm
            </span>
            {hoveredItem.rotated && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-stone-200/60 border border-stone-300/40 px-1.5 py-0.5 font-sans font-medium text-[10px] text-stone-800 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-200">
                <RotateCw className="h-2.5 w-2.5" /> 90°
              </span>
            )}
            <span className="text-stone-400 dark:text-slate-500">
              (X: {hoveredItem.x.toFixed(1)}, Y: {hoveredItem.y.toFixed(1)})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-light dark:text-slate-500">
            <Info className="h-3 w-3" />
            Passe o mouse sobre um elemento para inspecionar medidas exatas
          </div>
        )}
      </div>
    </div>
  );
};
