import type { TablesTranslations } from '../../types';

export const tables: TablesTranslations = {
  guillotine: {
    step: 'Step',
    direction: 'Direction',
    rulerPosition: 'Ruler Position',
    cutSpan: 'Cut Span',
    operatorInstruction: 'Technical Operator Instruction',
    horizontal: 'Horizontal ↔',
    vertical: 'Vertical ↕',
    stepCutDescHorizontal: 'Cut #{step}: Horizontal cut at Y = {coord} mm (from X = {start} to {end} mm)',
    stepCutDescVertical: 'Cut #{step}: Vertical cut at X = {coord} mm (from Y = {start} to {end} mm)',
  },
  recommender: {
    rankingTitle: 'Analyzed Formats Ranking',
    formatDimensions: 'Format & Dimensions',
    piecesPerSheet: 'Pieces / Sheet',
    yield: 'Yield',
    totalCost: 'Total Cost',
    unitCost: 'Unit Cost',
    action: 'Action',
    apply: 'Apply',
    current: 'Current',
    sheetsNeeded: '{count} sheets',
    wasteLabel: '{percent}% waste',
    category: 'Category',
    scrap: 'Scrap',
    sheetsShort: 'shts',
  },
};
