export type Unit = 'mm' | 'cm';

export type BuiltinSheetPresetId =
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A3_PLUS'
  | 'A4'
  | 'A5'
  | 'A6'
  | 'SRA3'
  | 'SRA4'
  | 'SUPER_B'
  | 'OFFSET_66X96'
  | 'OFFSET_48X66'
  | 'OFFSET_64X88'
  | 'OFFSET_70X100'
  | 'OFFSET_CARTAO_77X110'
  | 'B3'
  | 'B4'
  | 'B5'
  | 'US_LETTER'
  | 'US_LEGAL'
  | 'US_TABLOID'
  | 'CUSTOM';

export type SheetPresetId = BuiltinSheetPresetId | (string & {});

export type Orientation = 'portrait' | 'landscape';

export type GrainDirection = 'long' | 'short';

export type AppMode = 'quick' | 'multi';

export type QuickStrategy = 'normal' | 'rotated' | 'mixed';

export interface SheetPreset {
  id: SheetPresetId;
  name: string;
  description: string;
  widthMm: number;
  heightMm: number;
  category?: string;
  isCustomSaved?: boolean;
  grainDirection?: GrainDirection;
}

export interface SheetConfig {
  presetId: SheetPresetId;
  widthMm: number;
  heightMm: number;
  marginMm: number;
  spacingMm: number;
  orientation: Orientation;
  grainDirection?: GrainDirection;
  guillotineRequired?: boolean;
}

export interface ItemSpec {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  color: string;
  allowRotation: boolean;
}

export interface PlacedItem {
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  itemId: string;
  name: string;
  color: string;
  index: number;
  isPinned?: boolean;
  sheetNumber?: number;
}

export interface PinnedPlacement {
  itemId: string;
  name?: string;
  color?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  sheetNumber?: number;
}

export interface SheetLayout {
  sheetNumber: number;
  widthMm: number;
  heightMm: number;
  marginMm: number;
  spacingMm: number;
  placedItems: PlacedItem[];
  usedAreaMm2: number;
  usableAreaMm2: number;
  totalAreaMm2: number;
  utilizationPercent: number;
  wastePercent: number;
  grainDirection?: GrainDirection;
}

export interface UnplacedItem {
  itemId: string;
  name: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  reason: string;
}

export interface PackingResult {
  sheets: SheetLayout[];
  totalPlaced: number;
  totalRequested: number;
  unplacedItems: UnplacedItem[];
  overallUtilizationPercent: number;
  overallWastePercent: number;
}

export interface QuickStrategyResult {
  strategy: QuickStrategy;
  label: string;
  count: number;
  normalCount: number;
  rotatedCount: number;
  utilizationPercent: number;
  wastePercent: number;
  layout: SheetLayout;
}

export interface QuickComparison {
  normal: QuickStrategyResult;
  rotated: QuickStrategyResult;
  mixed: QuickStrategyResult;
  bestStrategy: QuickStrategy;
  extraFromMixed: number;
  itemFits: boolean;
}

export type CurrencyCode = 'BRL' | 'USD' | 'EUR';

export interface PricingConfig {
  costPerSheet: number;
  clickCost: number;
  otherFixedCosts: number;
  markupPercent: number;
  currency: CurrencyCode;
}

export interface PricingCalculation {
  rawMaterialCost: number;
  totalClickCost: number;
  totalProductionCost: number;
  wasteCostValue: number;
  suggestedTotalPrice: number;
  unitCost: number;
  unitPrice: number;
  currency: CurrencyCode;
}

export interface PricingParams {
  totalSheets: number;
  placedCount: number;
  wastePercent: number;
  config: PricingConfig;
}

export interface SubstrateRecommendation {
  presetId: string;
  presetName: string;
  category: string;
  sheetWidthMm: number;
  sheetHeightMm: number;
  itemsPerSheet: number;
  sheetsNeeded: number;
  totalProduced: number;
  utilizationPercent: number;
  wastePercent: number;
  bestStrategy: QuickStrategy;
  pricing?: PricingCalculation;
  isCustom?: boolean;
  rank: number;
}

export interface RecommenderOptions {
  itemWidthMm: number;
  itemHeightMm: number;
  targetQuantity: number;
  marginMm?: number;
  spacingMm?: number;
  pricingConfig?: PricingConfig;
  presets?: SheetPreset[];
  categoryFilter?: string;
}

export interface SvgExportOptions {
  showCropMarks?: boolean;
  cropMarkLengthMm?: number;  // default 4mm
  cropMarkOffsetMm?: number;  // default 2mm
  showBleed?: boolean;
  bleedMm?: number;          // default 2mm
  showLabels?: boolean;
  showDimensions?: boolean;
}

export interface GuillotineCutStep {
  stepNumber: number;
  direction: 'horizontal' | 'vertical';
  coordinateMm: number;
  cutStartMm: number;
  cutEndMm: number;
  blockBounds: { x: number; y: number; width: number; height: number };
  description: string;
}

export interface GuillotineAnalysis {
  isGuillotineCuttable: boolean;
  totalCutsNeeded: number;
  steps: GuillotineCutStep[];
  efficiencyRating: 'ideal' | 'moderate' | 'complex' | 'non-guillotine';
  message: string;
}




