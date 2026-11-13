import type {
  GuillotineAnalysis,
  GuillotineCutStep,
  PlacedItem,
  SheetLayout,
} from '../types/optimizer';

const EPS = 1e-4;

interface BlockBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Block {
  bounds: BlockBounds;
  items: PlacedItem[];
}

interface ValidCut {
  direction: 'horizontal' | 'vertical';
  coordinate: number;
  part1Items: PlacedItem[];
  part2Items: PlacedItem[];
  part1Bounds: BlockBounds;
  part2Bounds: BlockBounds;
  balance: number;
}

interface CutTreeNode {
  step: {
    direction: 'horizontal' | 'vertical';
    coordinateMm: number;
    cutStartMm: number;
    cutEndMm: number;
    blockBounds: BlockBounds;
  };
  hasMixedRotations: boolean;
  child1: CutTreeNode | null;
  child2: CutTreeNode | null;
}

/**
 * Format a human-readable description in Portuguese for a guillotine cut step.
 * Example: "1º Corte Horizontal em Y = 150.0 mm (de X = 5.0 a 292.0 mm)"
 */
export function formatCutDescription(
  stepNumber: number,
  direction: 'horizontal' | 'vertical',
  coordinateMm: number,
  cutStartMm: number,
  cutEndMm: number,
): string {
  const coordAxis = direction === 'horizontal' ? 'Y' : 'X';
  const spanAxis = direction === 'horizontal' ? 'X' : 'Y';
  const dirName = direction === 'horizontal' ? 'Horizontal' : 'Vertical';
  return `${stepNumber}º Corte ${dirName} em ${coordAxis} = ${coordinateMm.toFixed(1)} mm (de ${spanAxis} = ${cutStartMm.toFixed(1)} a ${cutEndMm.toFixed(1)} mm)`;
}

/**
 * Collect candidate coordinates strictly inside (minBound, maxBound), sorted and deduplicated.
 */
function collectCandidates(values: number[], minBound: number, maxBound: number): number[] {
  const filtered = values.filter((v) => v > minBound + EPS && v < maxBound - EPS);
  filtered.sort((a, b) => a - b);
  const result: number[] = [];
  for (const val of filtered) {
    if (result.length === 0 || Math.abs(val - result[result.length - 1]) > EPS) {
      result.push(val);
    }
  }
  return result;
}

/**
 * Determines whether a horizontal cut at `y` intersects the interior of `item`.
 */
function isSlicedHorizontal(item: PlacedItem, y: number): boolean {
  return item.y + EPS < y && y < item.y + item.height - EPS;
}

/**
 * Determines whether a vertical cut at `x` intersects the interior of `item`.
 */
function isSlicedVertical(item: PlacedItem, x: number): boolean {
  return item.x + EPS < x && x < item.x + item.width - EPS;
}

/**
 * Find all valid straight cuts that divide items in `block` into two non-empty subsets
 * without intersecting any item.
 */
function findValidCuts(block: Block): ValidCut[] {
  const cuts: ValidCut[] = [];
  const { x, y, width, height } = block.bounds;

  // 1. Horizontal Candidate Cuts: top/bottom coordinates of items within the block
  const rawYCandidates: number[] = [];
  for (const it of block.items) {
    rawYCandidates.push(it.y, it.y + it.height);
  }
  const yCandidates = collectCandidates(rawYCandidates, y, y + height);

  for (const cutY of yCandidates) {
    // Check if any item interior is intersected
    let slicesAny = false;
    for (const it of block.items) {
      if (isSlicedHorizontal(it, cutY)) {
        slicesAny = true;
        break;
      }
    }
    if (slicesAny) continue;

    const topItems = block.items.filter((it) => it.y + it.height <= cutY + EPS);
    const bottomItems = block.items.filter((it) => it.y >= cutY - EPS);

    if (
      topItems.length > 0 &&
      bottomItems.length > 0 &&
      topItems.length + bottomItems.length === block.items.length
    ) {
      const balance = Math.min(topItems.length, bottomItems.length) /
        Math.max(topItems.length, bottomItems.length);

      cuts.push({
        direction: 'horizontal',
        coordinate: cutY,
        part1Items: topItems,
        part2Items: bottomItems,
        part1Bounds: {
          x,
          y,
          width,
          height: cutY - y,
        },
        part2Bounds: {
          x,
          y: cutY,
          width,
          height: y + height - cutY,
        },
        balance,
      });
    }
  }

  // 2. Vertical Candidate Cuts: left/right coordinates of items within the block
  const rawXCandidates: number[] = [];
  for (const it of block.items) {
    rawXCandidates.push(it.x, it.x + it.width);
  }
  const xCandidates = collectCandidates(rawXCandidates, x, x + width);

  for (const cutX of xCandidates) {
    let slicesAny = false;
    for (const it of block.items) {
      if (isSlicedVertical(it, cutX)) {
        slicesAny = true;
        break;
      }
    }
    if (slicesAny) continue;

    const leftItems = block.items.filter((it) => it.x + it.width <= cutX + EPS);
    const rightItems = block.items.filter((it) => it.x >= cutX - EPS);

    if (
      leftItems.length > 0 &&
      rightItems.length > 0 &&
      leftItems.length + rightItems.length === block.items.length
    ) {
      const balance = Math.min(leftItems.length, rightItems.length) /
        Math.max(leftItems.length, rightItems.length);

      cuts.push({
        direction: 'vertical',
        coordinate: cutX,
        part1Items: leftItems,
        part2Items: rightItems,
        part1Bounds: {
          x,
          y,
          width: cutX - x,
          height,
        },
        part2Bounds: {
          x: cutX,
          y,
          width: x + width - cutX,
          height,
        },
        balance,
      });
    }
  }

  // Prioritize cuts:
  // 1. Balance (more balanced cuts first)
  // 2. Direction (horizontal preferred over vertical on ties, standard print strip cutting)
  // 3. Lower coordinate first
  cuts.sort((a, b) => {
    if (Math.abs(a.balance - b.balance) > 0.05) {
      return b.balance - a.balance;
    }
    if (a.direction !== b.direction) {
      return a.direction === 'horizontal' ? -1 : 1;
    }
    return a.coordinate - b.coordinate;
  });

  return cuts;
}

/**
 * Recursively partitions `block` using XY-cut tree search with backtracking.
 */
function solveXYCutTree(block: Block): CutTreeNode | null {
  if (block.items.length <= 1) {
    return null; // leaf node: item already isolated
  }

  const candidateCuts = findValidCuts(block);
  if (candidateCuts.length === 0) {
    return null; // Dead end: block cannot be partitioned
  }

  const hasMixedRotations =
    block.items.some((it) => it.rotated) && block.items.some((it) => !it.rotated);

  for (const cut of candidateCuts) {
    const child1Block: Block = {
      bounds: cut.part1Bounds,
      items: cut.part1Items,
    };
    const child2Block: Block = {
      bounds: cut.part2Bounds,
      items: cut.part2Items,
    };

    let leftTree: CutTreeNode | null = null;
    if (child1Block.items.length > 1) {
      leftTree = solveXYCutTree(child1Block);
      if (!leftTree) {
        continue; // backtrack
      }
    }

    let rightTree: CutTreeNode | null = null;
    if (child2Block.items.length > 1) {
      rightTree = solveXYCutTree(child2Block);
      if (!rightTree) {
        continue; // backtrack
      }
    }

    return {
      step: {
        direction: cut.direction,
        coordinateMm: cut.coordinate,
        cutStartMm: cut.direction === 'horizontal' ? block.bounds.x : block.bounds.y,
        cutEndMm:
          cut.direction === 'horizontal'
            ? block.bounds.x + block.bounds.width
            : block.bounds.y + block.bounds.height,
        blockBounds: { ...block.bounds },
      },
      hasMixedRotations,
      child1: leftTree,
      child2: rightTree,
    };
  }

  return null;
}

/**
 * Flattens the XY-cut tree into a sequential list of steps with step numbers and descriptions.
 */
function flattenCutSteps(tree: CutTreeNode | null): {
  steps: GuillotineCutStep[];
  mixedRotationCutsCount: number;
} {
  if (!tree) {
    return { steps: [], mixedRotationCutsCount: 0 };
  }

  const steps: GuillotineCutStep[] = [];
  let stepNumber = 1;
  let mixedRotationCutsCount = 0;

  function traverse(node: CutTreeNode) {
    if (node.hasMixedRotations) {
      mixedRotationCutsCount++;
    }

    const desc = formatCutDescription(
      stepNumber,
      node.step.direction,
      node.step.coordinateMm,
      node.step.cutStartMm,
      node.step.cutEndMm,
    );

    steps.push({
      stepNumber: stepNumber++,
      direction: node.step.direction,
      coordinateMm: node.step.coordinateMm,
      cutStartMm: node.step.cutStartMm,
      cutEndMm: node.step.cutEndMm,
      blockBounds: node.step.blockBounds,
      description: desc,
    });

    if (node.child1) {
      traverse(node.child1);
    }
    if (node.child2) {
      traverse(node.child2);
    }
  }

  traverse(tree);
  return { steps, mixedRotationCutsCount };
}

/**
 * Determines efficiency rating based on cuts and layout structure.
 */
function determineEfficiencyRating(
  isCuttable: boolean,
  items: PlacedItem[],
  mixedRotationCutsCount: number,
): 'ideal' | 'moderate' | 'complex' | 'non-guillotine' {
  if (!isCuttable) {
    return 'non-guillotine';
  }
  if (items.length <= 1) {
    return 'ideal';
  }

  const hasRotated = items.some((it) => it.rotated);
  const hasNonRotated = items.some((it) => !it.rotated);
  const hasMixedRotations = hasRotated && hasNonRotated;

  if (!hasMixedRotations) {
    return 'ideal';
  }

  // In standard mixed nesting, items are grouped into separate blocks (e.g. 1 primary cut)
  if (mixedRotationCutsCount <= 2) {
    return 'moderate';
  }

  // Interleaved / alternating rotations requiring many rotation changes
  return 'complex';
}

/**
 * Computes the root block enclosing all placed items on the sheet.
 */
function getRootBlock(layout: SheetLayout): Block {
  const items = layout.placedItems;
  if (items.length === 0) {
    return {
      bounds: { x: 0, y: 0, width: layout.widthMm, height: layout.heightMm },
      items: [],
    };
  }

  const minX = Math.min(...items.map((it) => it.x));
  const minY = Math.min(...items.map((it) => it.y));
  const maxX = Math.max(...items.map((it) => it.x + it.width));
  const maxY = Math.max(...items.map((it) => it.y + it.height));

  return {
    bounds: {
      x: minX,
      y: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
    },
    items,
  };
}

/**
 * Main engine entry point: Analyze guillotine cut feasibility and step-by-step sequence.
 */
export function analyzeGuillotineCuts(layout: SheetLayout): GuillotineAnalysis {
  const items = layout.placedItems ?? [];

  // Edge case: Empty placed items
  if (items.length === 0) {
    return {
      isGuillotineCuttable: true,
      totalCutsNeeded: 0,
      steps: [],
      efficiencyRating: 'ideal',
      message: 'Nenhum item posicionado na folha.',
    };
  }

  // Edge case: Single placed item
  if (items.length === 1) {
    return {
      isGuillotineCuttable: true,
      totalCutsNeeded: 0,
      steps: [],
      efficiencyRating: 'ideal',
      message: 'Item único na folha. Nenhum corte de separação necessário.',
    };
  }

  const rootBlock = getRootBlock(layout);
  const tree = solveXYCutTree(rootBlock);

  if (!tree) {
    return {
      isGuillotineCuttable: false,
      totalCutsNeeded: 0,
      steps: [],
      efficiencyRating: 'non-guillotine',
      message:
        'Layout não guilhotinável. Padrão entrelaçado (pinwheel/interlock) detectado — requer corte manual ou mesa de corte (plotter).',
    };
  }

  const { steps, mixedRotationCutsCount } = flattenCutSteps(tree);
  const totalCutsNeeded = steps.length;
  const efficiencyRating = determineEfficiencyRating(true, items, mixedRotationCutsCount);

  const plural = totalCutsNeeded > 1;
  const message = `Layout 100% guilhotinável em ${totalCutsNeeded} corte${plural ? 's' : ''} linear${plural ? 'es' : ''} sequencia${plural ? 'is' : 'l'}.`;

  return {
    isGuillotineCuttable: true,
    totalCutsNeeded,
    steps,
    efficiencyRating,
    message,
  };
}
