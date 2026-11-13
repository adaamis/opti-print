import { ITEM_COLORS } from '../constants/sheets';
import type {
  ItemSpec,
  PackingResult,
  PlacedItem,
  QuickComparison,
  QuickStrategy,
  QuickStrategyResult,
  SheetConfig,
  SheetLayout,
  UnplacedItem,
} from '../types/optimizer';

const EPS = 1e-6;
const MAX_SHEETS = 500;

interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RawPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
}

interface ExpandedItem {
  itemId: string;
  name: string;
  widthMm: number;
  heightMm: number;
  color: string;
  allowRotation: boolean;
}

interface SheetBin {
  sheetNumber: number;
  freeRects: FreeRect[];
  placedItems: PlacedItem[];
  usedAreaMm2: number;
}

function sanitizePositive(value: number, fallback = 0): number {
  if (!Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return value;
}

/**
 * Computes how many segments of length `itemLen` fit inside `regionLen`
 * with `spacing` gap between adjacent segments.
 */
export function fitCountInLength(regionLen: number, itemLen: number, spacing: number): number {
  if (
    !Number.isFinite(regionLen) ||
    !Number.isFinite(itemLen) ||
    !Number.isFinite(spacing) ||
    itemLen <= 0 ||
    regionLen + EPS < itemLen
  ) {
    return 0;
  }
  const safeSpacing = Math.max(0, spacing);
  return Math.floor((regionLen + safeSpacing + EPS) / (itemLen + safeSpacing));
}

function createSheetLayout(
  sheetNumber: number,
  sheet: SheetConfig,
  placedItems: PlacedItem[],
): SheetLayout {
  const widthMm = sanitizePositive(sheet.widthMm);
  const heightMm = sanitizePositive(sheet.heightMm);
  const marginMm = sanitizePositive(sheet.marginMm);
  const spacingMm = sanitizePositive(sheet.spacingMm);
  const usableW = Math.max(0, widthMm - 2 * marginMm);
  const usableH = Math.max(0, heightMm - 2 * marginMm);
  const totalAreaMm2 = widthMm * heightMm;
  const usableAreaMm2 = usableW * usableH;
  const usedAreaMm2 = placedItems.reduce((sum, item) => sum + item.width * item.height, 0);
  const utilizationPercent = totalAreaMm2 > 0 ? (usedAreaMm2 / totalAreaMm2) * 100 : 0;
  const wastePercent = totalAreaMm2 > 0 ? Math.max(0, 100 - utilizationPercent) : 100;

  return {
    sheetNumber,
    widthMm,
    heightMm,
    marginMm,
    spacingMm,
    placedItems,
    usedAreaMm2,
    usableAreaMm2,
    totalAreaMm2,
    utilizationPercent,
    wastePercent,
    grainDirection: sheet.grainDirection || 'long',
  };
}

function fillUniformGrid(
  startX: number,
  startY: number,
  regionW: number,
  regionH: number,
  cellW: number,
  cellH: number,
  spacing: number,
  rotated: boolean,
): RawPlacement[] {
  const cols = fitCountInLength(regionW, cellW, spacing);
  const rows = fitCountInLength(regionH, cellH, spacing);
  if (cols <= 0 || rows <= 0) {
    return [];
  }

  const placements: RawPlacement[] = [];
  for (let r = 0; r < rows; r++) {
    const y = startY + r * (cellH + spacing);
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (cellW + spacing);
      placements.push({
        x,
        y,
        width: cellW,
        height: cellH,
        rotated,
      });
    }
  }
  return placements;
}

/**
 * Fills a sub-strip with the best single-orientation grid (or primary + leftover strip).
 */
function fillBestSubRegion(
  startX: number,
  startY: number,
  regionW: number,
  regionH: number,
  prefW: number,
  prefH: number,
  prefRot: boolean,
  altW: number,
  altH: number,
  altRot: boolean,
  spacing: number,
): RawPlacement[] {
  if (regionW <= EPS || regionH <= EPS) {
    return [];
  }

  const prefCols = fitCountInLength(regionW, prefW, spacing);
  const prefRows = fitCountInLength(regionH, prefH, spacing);
  const prefCount = prefCols * prefRows;

  const altCols = fitCountInLength(regionW, altW, spacing);
  const altRows = fitCountInLength(regionH, altH, spacing);
  const altCount = altCols * altRows;

  if (prefCount === 0 && altCount === 0) {
    return [];
  }

  if (prefCount >= altCount) {
    return fillUniformGrid(startX, startY, regionW, regionH, prefW, prefH, spacing, prefRot);
  }
  return fillUniformGrid(startX, startY, regionW, regionH, altW, altH, spacing, altRot);
}

function toPlacedItems(
  raw: RawPlacement[],
  name: string,
  color: string,
  itemId = 'quick-item',
): PlacedItem[] {
  return raw.map((p, idx) => ({
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
    rotated: p.rotated,
    itemId,
    name,
    color,
    index: idx + 1,
  }));
}

interface MixedCandidate {
  total: number;
  normalCount: number;
  rotatedCount: number;
  orientationChanges: number;
  placements: RawPlacement[];
}

function buildMixedCandidate(placements: RawPlacement[]): MixedCandidate {
  let normalCount = 0;
  let rotatedCount = 0;
  for (const p of placements) {
    if (p.rotated) rotatedCount++;
    else normalCount++;
  }
  const orientationChanges = normalCount > 0 && rotatedCount > 0 ? 1 : 0;
  return {
    total: placements.length,
    normalCount,
    rotatedCount,
    orientationChanges,
    placements,
  };
}

function isBetterCandidate(a: MixedCandidate, b: MixedCandidate | null): boolean {
  if (!b) return true;
  if (a.total !== b.total) return a.total > b.total;
  // Prefer uniform orientation if total count is identical
  if (a.orientationChanges !== b.orientationChanges) {
    return a.orientationChanges < b.orientationChanges;
  }
  return a.normalCount > b.normalCount;
}

/**
 * Evaluates Quick Yield Mode ("Quantos cabem?") for a single element dimension:
 * - Normal (0 deg)
 * - Rotated (90 deg)
 * - Mixed (exhaustive guillotine vertical/horizontal splits combining 0 deg and 90 deg)
 */
export function computeQuickYield(
  sheet: SheetConfig,
  itemWidthMm: number,
  itemHeightMm: number,
  itemName = 'Elemento',
  itemColor = ITEM_COLORS[0],
): QuickComparison {
  const widthMm = sanitizePositive(sheet.widthMm);
  const heightMm = sanitizePositive(sheet.heightMm);
  const marginMm = sanitizePositive(sheet.marginMm);
  const spacingMm = sanitizePositive(sheet.spacingMm);
  const usableW = Math.max(0, widthMm - 2 * marginMm);
  const usableH = Math.max(0, heightMm - 2 * marginMm);

  const w0 = Number.isFinite(itemWidthMm) && itemWidthMm > 0 ? itemWidthMm : 0;
  const h0 = Number.isFinite(itemHeightMm) && itemHeightMm > 0 ? itemHeightMm : 0;
  const w90 = h0;
  const h90 = w0;

  const canFitNormal = w0 > 0 && h0 > 0 && w0 <= usableW + EPS && h0 <= usableH + EPS;
  const canFitRotated = w90 > 0 && h90 > 0 && w90 <= usableW + EPS && h90 <= usableH + EPS;
  const itemFits = canFitNormal || canFitRotated;

  const originX = marginMm;
  const originY = marginMm;

  const normalRaw = canFitNormal
    ? fillUniformGrid(originX, originY, usableW, usableH, w0, h0, spacingMm, false)
    : [];
  const rotatedRaw = canFitRotated
    ? fillUniformGrid(originX, originY, usableW, usableH, w90, h90, spacingMm, true)
    : [];

  let bestMixed: MixedCandidate | null = null;

  if (itemFits) {
    // Evaluate both primary orientations (0 deg as main block, and 90 deg as main block)
    const variants: Array<{
      mainW: number;
      mainH: number;
      mainRot: boolean;
      altW: number;
      altH: number;
      altRot: boolean;
    }> = [
      { mainW: w0, mainH: h0, mainRot: false, altW: w90, altH: h90, altRot: true },
      { mainW: w90, mainH: h90, mainRot: true, altW: w0, altH: h0, altRot: false },
    ];

    for (const v of variants) {
      const maxCols = fitCountInLength(usableW, v.mainW, spacingMm);
      const maxRows = fitCountInLength(usableH, v.mainH, spacingMm);

      // 1. Vertical guillotine splits: iterate over all 0 <= mainCols <= maxCols
      for (let mainCols = 0; mainCols <= maxCols; mainCols++) {
        if (mainCols === 0) {
          const rightOnly = fillUniformGrid(
            originX,
            originY,
            usableW,
            usableH,
            v.altW,
            v.altH,
            spacingMm,
            v.altRot,
          );
          const cand = buildMixedCandidate(rightOnly);
          if (isBetterCandidate(cand, bestMixed)) bestMixed = cand;
          continue;
        }

        const usedMainW = mainCols * v.mainW + (mainCols - 1) * spacingMm;
        const usedMainH = maxRows > 0 ? maxRows * v.mainH + (maxRows - 1) * spacingMm : 0;

        const mainPlacements = fillUniformGrid(
          originX,
          originY,
          usedMainW,
          usableH,
          v.mainW,
          v.mainH,
          spacingMm,
          v.mainRot,
        );

        // Right strip (full usable height)
        const rightX = originX + usedMainW + spacingMm;
        const rightW = usableW - usedMainW - spacingMm;
        const rightPlacements = fillBestSubRegion(
          rightX,
          originY,
          rightW,
          usableH,
          v.altW,
          v.altH,
          v.altRot,
          v.mainW,
          v.mainH,
          v.mainRot,
          spacingMm,
        );

        // Optional remaining bottom strip under the main block
        const bottomY = originY + usedMainH + spacingMm;
        const bottomH = usableH - usedMainH - spacingMm;
        const bottomPlacements =
          maxRows > 0
            ? fillBestSubRegion(
                originX,
                bottomY,
                usedMainW,
                bottomH,
                v.altW,
                v.altH,
                v.altRot,
                v.mainW,
                v.mainH,
                v.mainRot,
                spacingMm,
              )
            : [];

        const cand = buildMixedCandidate([
          ...mainPlacements,
          ...rightPlacements,
          ...bottomPlacements,
        ]);
        if (isBetterCandidate(cand, bestMixed)) bestMixed = cand;
      }

      // 2. Horizontal guillotine splits: iterate over all 0 <= mainRows <= maxRows
      for (let mainRows = 0; mainRows <= maxRows; mainRows++) {
        if (mainRows === 0) {
          const bottomOnly = fillUniformGrid(
            originX,
            originY,
            usableW,
            usableH,
            v.altW,
            v.altH,
            spacingMm,
            v.altRot,
          );
          const cand = buildMixedCandidate(bottomOnly);
          if (isBetterCandidate(cand, bestMixed)) bestMixed = cand;
          continue;
        }

        const usedMainH = mainRows * v.mainH + (mainRows - 1) * spacingMm;
        const usedMainW = maxCols > 0 ? maxCols * v.mainW + (maxCols - 1) * spacingMm : 0;

        const mainPlacements = fillUniformGrid(
          originX,
          originY,
          usableW,
          usedMainH,
          v.mainW,
          v.mainH,
          spacingMm,
          v.mainRot,
        );

        // Bottom strip (full usable width)
        const bottomY = originY + usedMainH + spacingMm;
        const bottomH = usableH - usedMainH - spacingMm;
        const bottomPlacements = fillBestSubRegion(
          originX,
          bottomY,
          usableW,
          bottomH,
          v.altW,
          v.altH,
          v.altRot,
          v.mainW,
          v.mainH,
          v.mainRot,
          spacingMm,
        );

        // Optional remaining right-top strip beside the main block
        const rightX = originX + usedMainW + spacingMm;
        const rightW = usableW - usedMainW - spacingMm;
        const rightPlacements =
          maxCols > 0
            ? fillBestSubRegion(
                rightX,
                originY,
                rightW,
                usedMainH,
                v.altW,
                v.altH,
                v.altRot,
                v.mainW,
                v.mainH,
                v.mainRot,
                spacingMm,
              )
            : [];

        const cand = buildMixedCandidate([
          ...mainPlacements,
          ...bottomPlacements,
          ...rightPlacements,
        ]);
        if (isBetterCandidate(cand, bestMixed)) bestMixed = cand;
      }
    }
  }

  const finalMixed = bestMixed ?? buildMixedCandidate([]);

  const buildStrategyResult = (
    strategy: QuickStrategy,
    label: string,
    placements: RawPlacement[],
  ): QuickStrategyResult => {
    const placed = toPlacedItems(placements, itemName, itemColor);
    const layout = createSheetLayout(1, sheet, placed);
    let normalCount = 0;
    let rotatedCount = 0;
    for (const p of placed) {
      if (p.rotated) rotatedCount++;
      else normalCount++;
    }
    return {
      strategy,
      label,
      count: placed.length,
      normalCount,
      rotatedCount,
      utilizationPercent: layout.utilizationPercent,
      wastePercent: layout.wastePercent,
      layout,
    };
  };

  const normal = buildStrategyResult('normal', 'Normal (0°)', normalRaw);
  const rotated = buildStrategyResult('rotated', 'Rotacionado (90°)', rotatedRaw);
  const mixed = buildStrategyResult('mixed', 'Misto (0° + 90°)', finalMixed.placements);

  const maxUniform = Math.max(normal.count, rotated.count);
  let bestStrategy: QuickStrategy = 'normal';
  if (mixed.count > maxUniform) {
    bestStrategy = 'mixed';
  } else if (rotated.count > normal.count) {
    bestStrategy = 'rotated';
  }

  const extraFromMixed = Math.max(0, mixed.count - maxUniform);

  return {
    normal,
    rotated,
    mixed,
    bestStrategy,
    extraFromMixed,
    itemFits,
  };
}

function rectsOverlap(a: FreeRect, b: FreeRect): boolean {
  return (
    a.x < b.x + b.width - EPS &&
    a.x + a.width > b.x + EPS &&
    a.y < b.y + b.height - EPS &&
    a.y + a.height > b.y + EPS
  );
}

function isContained(inner: FreeRect, outer: FreeRect): boolean {
  return (
    inner.x >= outer.x - EPS &&
    inner.y >= outer.y - EPS &&
    inner.x + inner.width <= outer.x + outer.width + EPS &&
    inner.y + inner.height <= outer.y + outer.height + EPS
  );
}

function splitAndPruneFreeRects(freeRects: FreeRect[], placed: FreeRect): FreeRect[] {
  const next: FreeRect[] = [];

  for (const fr of freeRects) {
    if (!rectsOverlap(fr, placed)) {
      next.push(fr);
      continue;
    }

    // Left split
    if (placed.x > fr.x + EPS) {
      next.push({
        x: fr.x,
        y: fr.y,
        width: placed.x - fr.x,
        height: fr.height,
      });
    }
    // Right split
    if (placed.x + placed.width < fr.x + fr.width - EPS) {
      next.push({
        x: placed.x + placed.width,
        y: fr.y,
        width: fr.x + fr.width - (placed.x + placed.width),
        height: fr.height,
      });
    }
    // Top split
    if (placed.y > fr.y + EPS) {
      next.push({
        x: fr.x,
        y: fr.y,
        width: fr.width,
        height: placed.y - fr.y,
      });
    }
    // Bottom split
    if (placed.y + placed.height < fr.y + fr.height - EPS) {
      next.push({
        x: fr.x,
        y: placed.y + placed.height,
        width: fr.width,
        height: fr.y + fr.height - (placed.y + placed.height),
      });
    }
  }

  const valid = next.filter((r) => r.width > EPS && r.height > EPS);
  const pruned: FreeRect[] = [];

  for (let i = 0; i < valid.length; i++) {
    let contained = false;
    for (let j = 0; j < valid.length; j++) {
      if (i !== j && isContained(valid[i], valid[j])) {
        contained = true;
        break;
      }
    }
    if (!contained) {
      pruned.push(valid[i]);
    }
  }

  return pruned;
}

interface CandidatePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  inflatedW: number;
  inflatedH: number;
  rotated: boolean;
  shortSideFit: number;
  longSideFit: number;
}

function findBestPlacementBSSF(
  freeRects: FreeRect[],
  itemW: number,
  itemH: number,
  spacing: number,
  allowRotation: boolean,
): CandidatePlacement | null {
  let best: CandidatePlacement | null = null;

  const orientations: Array<{ w: number; h: number; rotated: boolean }> = [
    { w: itemW, h: itemH, rotated: false },
  ];
  if (allowRotation && Math.abs(itemW - itemH) > EPS) {
    orientations.push({ w: itemH, h: itemW, rotated: true });
  }

  for (const fr of freeRects) {
    for (const ori of orientations) {
      const inflatedW = ori.w + spacing;
      const inflatedH = ori.h + spacing;

      if (inflatedW <= fr.width + EPS && inflatedH <= fr.height + EPS) {
        const leftoverH = Math.abs(fr.width - inflatedW);
        const leftoverV = Math.abs(fr.height - inflatedH);
        const shortSideFit = Math.min(leftoverH, leftoverV);
        const longSideFit = Math.max(leftoverH, leftoverV);

        if (
          !best ||
          shortSideFit < best.shortSideFit - EPS ||
          (Math.abs(shortSideFit - best.shortSideFit) <= EPS &&
            (longSideFit < best.longSideFit - EPS ||
              (Math.abs(longSideFit - best.longSideFit) <= EPS &&
                (fr.y < best.y - EPS ||
                  (Math.abs(fr.y - best.y) <= EPS && fr.x < best.x - EPS)))))
        ) {
          best = {
            x: fr.x,
            y: fr.y,
            width: ori.w,
            height: ori.h,
            inflatedW,
            inflatedH,
            rotated: ori.rotated,
            shortSideFit,
            longSideFit,
          };
        }
      }
    }
  }

  return best;
}

type SortStrategy = 'area' | 'maxSide' | 'height';

function sortExpandedItems(items: ExpandedItem[], strategy: SortStrategy): ExpandedItem[] {
  return [...items].sort((a, b) => {
    const areaA = a.widthMm * a.heightMm;
    const areaB = b.widthMm * b.heightMm;
    const maxA = Math.max(a.widthMm, a.heightMm);
    const maxB = Math.max(b.widthMm, b.heightMm);

    if (strategy === 'area') {
      if (Math.abs(areaB - areaA) > EPS) return areaB - areaA;
      if (Math.abs(maxB - maxA) > EPS) return maxB - maxA;
      return b.heightMm - a.heightMm;
    }
    if (strategy === 'maxSide') {
      if (Math.abs(maxB - maxA) > EPS) return maxB - maxA;
      if (Math.abs(areaB - areaA) > EPS) return areaB - areaA;
      return b.heightMm - a.heightMm;
    }
    // height
    if (Math.abs(b.heightMm - a.heightMm) > EPS) return b.heightMm - a.heightMm;
    if (Math.abs(b.widthMm - a.widthMm) > EPS) return b.widthMm - a.widthMm;
    return areaB - areaA;
  });
}

function runMaxRectsPacking(
  sortedItems: ExpandedItem[],
  usableW: number,
  usableH: number,
  marginMm: number,
  spacingMm: number,
): { bins: SheetBin[]; overflowed: ExpandedItem[] } {
  const binW = usableW + spacingMm;
  const binH = usableH + spacingMm;
  const bins: SheetBin[] = [];
  const overflowed: ExpandedItem[] = [];

  for (const item of sortedItems) {
    let placed = false;

    // First-Fit across open bins
    for (const bin of bins) {
      const cand = findBestPlacementBSSF(
        bin.freeRects,
        item.widthMm,
        item.heightMm,
        spacingMm,
        item.allowRotation,
      );
      if (cand) {
        bin.freeRects = splitAndPruneFreeRects(bin.freeRects, {
          x: cand.x,
          y: cand.y,
          width: cand.inflatedW,
          height: cand.inflatedH,
        });
        bin.placedItems.push({
          x: marginMm + cand.x,
          y: marginMm + cand.y,
          width: cand.width,
          height: cand.height,
          rotated: cand.rotated,
          itemId: item.itemId,
          name: item.name,
          color: item.color,
          index: bin.placedItems.length + 1,
        });
        bin.usedAreaMm2 += cand.width * cand.height;
        placed = true;
        break;
      }
    }

    if (!placed) {
      if (bins.length >= MAX_SHEETS) {
        overflowed.push(item);
        continue;
      }

      const newBin: SheetBin = {
        sheetNumber: bins.length + 1,
        freeRects: [{ x: 0, y: 0, width: binW, height: binH }],
        placedItems: [],
        usedAreaMm2: 0,
      };
      const cand = findBestPlacementBSSF(
        newBin.freeRects,
        item.widthMm,
        item.heightMm,
        spacingMm,
        item.allowRotation,
      );
      if (cand) {
        newBin.freeRects = splitAndPruneFreeRects(newBin.freeRects, {
          x: cand.x,
          y: cand.y,
          width: cand.inflatedW,
          height: cand.inflatedH,
        });
        newBin.placedItems.push({
          x: marginMm + cand.x,
          y: marginMm + cand.y,
          width: cand.width,
          height: cand.height,
          rotated: cand.rotated,
          itemId: item.itemId,
          name: item.name,
          color: item.color,
          index: 1,
        });
        newBin.usedAreaMm2 += cand.width * cand.height;
        bins.push(newBin);
      } else {
        overflowed.push(item);
      }
    }
  }

  return { bins, overflowed };
}

/**
 * Multi-item multi-sheet packer using MaxRects-BSSF across 1..N sheets.
 * Compares sort heuristics to minimize sheet count and maximize utilization.
 */
export function packItems(sheet: SheetConfig, items: ItemSpec[]): PackingResult {
  const widthMm = sanitizePositive(sheet.widthMm);
  const heightMm = sanitizePositive(sheet.heightMm);
  const marginMm = sanitizePositive(sheet.marginMm);
  const spacingMm = sanitizePositive(sheet.spacingMm);
  const usableW = Math.max(0, widthMm - 2 * marginMm);
  const usableH = Math.max(0, heightMm - 2 * marginMm);

  const unplacedMap = new Map<string, UnplacedItem>();
  const addUnplaced = (item: ItemSpec, qty: number, reason: string) => {
    if (qty <= 0) return;
    const key = `${item.id}::${reason}`;
    const existing = unplacedMap.get(key);
    if (existing) {
      existing.quantity += qty;
    } else {
      unplacedMap.set(key, {
        itemId: item.id,
        name: item.name,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        quantity: qty,
        reason,
      });
    }
  };

  let totalRequested = 0;
  const eligibleExpanded: ExpandedItem[] = [];

  for (const item of items) {
    const qty = Number.isFinite(item.quantity) ? Math.floor(item.quantity) : 0;
    if (qty <= 0) continue;

    totalRequested += qty;

    if (!Number.isFinite(item.widthMm) || !Number.isFinite(item.heightMm) || item.widthMm <= 0 || item.heightMm <= 0) {
      addUnplaced(item, qty, 'Dimensões do elemento inválidas');
      continue;
    }

    if (usableW <= EPS || usableH <= EPS) {
      addUnplaced(item, qty, 'Área útil da folha inválida ou insuficiente');
      continue;
    }

    const fitsNormal = item.widthMm <= usableW + EPS && item.heightMm <= usableH + EPS;
    const fitsRotated =
      item.allowRotation && item.heightMm <= usableW + EPS && item.widthMm <= usableH + EPS;

    if (!fitsNormal && !fitsRotated) {
      addUnplaced(item, qty, 'Elemento maior que a área útil da folha');
      continue;
    }

    for (let i = 0; i < qty; i++) {
      eligibleExpanded.push({
        itemId: item.id,
        name: item.name,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        color: item.color,
        allowRotation: item.allowRotation,
      });
    }
  }

  if (eligibleExpanded.length === 0) {
    return {
      sheets: [],
      totalPlaced: 0,
      totalRequested,
      unplacedItems: Array.from(unplacedMap.values()),
      overallUtilizationPercent: 0,
      overallWastePercent: totalRequested > 0 ? 100 : 0,
    };
  }

  const strategies: SortStrategy[] =
    eligibleExpanded.length > 800 ? ['area'] : ['area', 'maxSide', 'height'];

  let bestRun: { bins: SheetBin[]; overflowed: ExpandedItem[] } | null = null;

  for (const strategy of strategies) {
    const sorted = sortExpandedItems(eligibleExpanded, strategy);
    const result = runMaxRectsPacking(sorted, usableW, usableH, marginMm, spacingMm);

    if (!bestRun) {
      bestRun = result;
      continue;
    }

    if (result.overflowed.length < bestRun.overflowed.length) {
      bestRun = result;
    } else if (result.overflowed.length === bestRun.overflowed.length) {
      if (result.bins.length < bestRun.bins.length) {
        bestRun = result;
      } else if (result.bins.length === bestRun.bins.length && result.bins.length > 0) {
        const lastUsedNew = result.bins[result.bins.length - 1].usedAreaMm2;
        const lastUsedBest = bestRun.bins[bestRun.bins.length - 1].usedAreaMm2;
        if (lastUsedNew > lastUsedBest + EPS) {
          bestRun = result;
        }
      }
    }
  }

  const finalRun = bestRun!;
  for (const over of finalRun.overflowed) {
    const src = items.find((it) => it.id === over.itemId);
    if (src) {
      addUnplaced(src, 1, `Limite máximo de ${MAX_SHEETS} folhas atingido`);
    }
  }

  const sheets: SheetLayout[] = finalRun.bins.map((bin) =>
    createSheetLayout(bin.sheetNumber, sheet, bin.placedItems),
  );

  const totalPlaced = sheets.reduce((sum, s) => sum + s.placedItems.length, 0);
  const totalUsedArea = sheets.reduce((sum, s) => sum + s.usedAreaMm2, 0);
  const totalSheetArea = sheets.reduce((sum, s) => sum + s.totalAreaMm2, 0);
  const overallUtilizationPercent = totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;
  const overallWastePercent = totalSheetArea > 0 ? Math.max(0, 100 - overallUtilizationPercent) : 0;

  return {
    sheets,
    totalPlaced,
    totalRequested,
    unplacedItems: Array.from(unplacedMap.values()),
    overallUtilizationPercent,
    overallWastePercent,
  };
}
