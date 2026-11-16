export type Language = 'pt-BR' | 'en';

export type TranslationParams = Record<string, string | number | boolean | null | undefined>;

export type TranslationDomain = 'nav' | 'forms' | 'tables' | 'modals' | 'alerts' | 'common';

export interface NavTranslations {
  title: string;
  subtitle: string;
  documentTitle: string;
  metaDescription: string;
  quickMode: string;
  multiMode: string;
  toggleThemeLight: string;
  toggleThemeDark: string;
  lightMode: string;
  darkMode: string;
  selectLanguage: string;
  langPt: string;
  langEn: string;
  langPtLabel: string;
  langEnLabel: string;
  guillotine: string;
  requireGuillotine: string;
}

export interface FormsTranslations {
  sheetConfig: {
    title: string;
    unitTooltip: string;
    presetLabel: string;
    customCategory: string;
    customOption: string;
    mySavedFormats: string;
    deletePresetTitle: string;
    deletePreset: string;
    width: string;
    height: string;
    flipOrientationTitle: string;
    portrait: string;
    landscape: string;
    portraitLong: string;
    landscapeLong: string;
    usableArea: string;
    usableAreaTitle: string;
    saveFormat: string;
    saveFormatTitle: string;
    saveCustomTitle: string;
    presetNamePlaceholder: string;
    cancel: string;
    saveToMenu: string;
    invalidDimensions: string;
    grainDirection: string;
    grainLong: string;
    grainLongDesc: string;
    grainShort: string;
    grainShortDesc: string;
    grainHelper: string;
    marginLabel: string;
    marginTooltip: string;
    spacingLabel: string;
    spacingTooltip: string;
    categories: {
      digitalSra: string;
      isoA: string;
      offsetBrasil: string;
      isoB: string;
      usaOther: string;
      savedFormats: string;
      all: string;
    };
    presetNames: {
      OFFSET_66X96: string;
      OFFSET_48X66: string;
      OFFSET_64X88: string;
      OFFSET_70X100: string;
      OFFSET_CARTAO_77X110: string;
      US_LETTER: string;
      US_LEGAL: string;
      US_TABLOID: string;
    };
  };
  quick: {
    title: string;
    widthLabel: string;
    heightLabel: string;
    presetsLabel: string;
    selectPresetPlaceholder: string;
    whichSheetToBuy: string;
    comparisonTitle: string;
    normalTitle: string;
    normalSubtext: string;
    rotatedTitle: string;
    rotatedSubtext: string;
    mixedTitle: string;
    mixedBadge: string;
    mixedSubtextCombined: string;
    mixedSubtextBest: string;
    winnerBadge: string;
    elementsCount: string;
    elementSingle: string;
    elementLargerThanUsable: string;
    elementNamePlaceholder: string;
    elementNameLabel: string;
    samplePresetLabels: {
      businessCard: string;
      squareSticker: string;
      flyerA6: string;
      productTag: string;
    };
  };
  items: {
    title: string;
    add: string;
    addPresetLabel: string;
    namePlaceholder: string;
    allowRotation: string;
    allowRotationTitle: string;
    remove: string;
    unplacedWarning: string;
    width: string;
    height: string;
    quantity: string;
    emptyDescription: string;
    defaultElementName: string;
    samplePresets: {
      businessCard: string;
      squareSticker: string;
      flyerA6: string;
      productTag: string;
    };
    defaultNames: {
      businessCard: string;
      brandSticker: string;
      genericElement: string;
      graphicElement: string;
    };
  };
}

export interface TablesTranslations {
  guillotine: {
    step: string;
    direction: string;
    rulerPosition: string;
    cutSpan: string;
    operatorInstruction: string;
    horizontal: string;
    vertical: string;
    stepCutDescHorizontal: string;
    stepCutDescVertical: string;
  };
  recommender: {
    rankingTitle: string;
    formatDimensions: string;
    piecesPerSheet: string;
    yield: string;
    totalCost: string;
    unitCost: string;
    action: string;
    apply: string;
    current: string;
    sheetsNeeded: string;
    wasteLabel: string;
    category: string;
    scrap: string;
    sheetsShort: string;
  };
}

export interface ModalsTranslations {
  pricing: {
    title: string;
    subtitle: string;
    costPerSheet: string;
    costPerSheetHelp: string;
    clickCost: string;
    clickCostHelp: string;
    fixedCost: string;
    fixedCostHelp: string;
    markupPercent: string;
    markupPercentHelp: string;
    currency: string;
    previewTitle: string;
    rawMaterialCost: string;
    totalClickCost: string;
    fixedCostItem: string;
    totalProductionCost: string;
    profitMarkup: string;
    suggestedTotalPrice: string;
    wasteCost: string;
    unitCost: string;
    unitPrice: string;
    unitSuffix: string;
    save: string;
    reset: string;
    close: string;
    baseSimulation: string;
    productionNotice: string;
  };
  recommender: {
    title: string;
    badge: string;
    itemSpecs: string;
    runQuantityTitle: string;
    customQtyPlaceholder: string;
    filterCategoryTitle: string;
    categoryAll: string;
    categoryDigital: string;
    categoryIso: string;
    categoryOffset: string;
    categorySaved: string;
    championTitle: string;
    applyFormat: string;
    sheetsNeeded: string;
    piecesPerSheet: string;
    usableYield: string;
    productionCost: string;
    totalProductionCost: string;
    economyNotice: string;
    sheetsFallbackNotice: string;
    pricingCostInfo: string;
    noViableFound: string;
    noViableDesc: string;
    close: string;
    apply: string;
    morePieces: string;
    economy: string;
    optimal: string;
    currentFormat: string;
    unitSuffix: string;
    layoutPrefix: string;
    residualScrapPrefix: string;
    lowestConsumption: string;
    showAllCategories: string;
    itemLabel: string;
    marginLabel: string;
    spacingLabel: string;
    runQuantitySubtitle: string;
    addQuantityTitle: string;
    excessWaste: string;
    graphicElement: string;
    customSavedEmptyDesc: string;
    exceedsPrintableDesc: string;
  };
  guillotine: {
    title: string;
    sheetInfo: string;
    cuttableTitle: string;
    linearCutsCount: string;
    singleLinearCut: string;
    idealEfficiency: string;
    moderateEfficiency: string;
    complexEfficiency: string;
    nonCuttableTitle: string;
    pinwheelBadge: string;
    pinwheelDesc: string;
    solutionsTitle: string;
    solution1: string;
    solution2: string;
    solution3: string;
    singleItemTitle: string;
    singleItemDesc: string;
    printInstructions: string;
    close: string;
    idealDesc: string;
    moderateDesc: string;
    complexDesc: string;
    nonCuttableDesc: string;
  };
}

export interface AlertsTranslations {
  unplacedBannerTitle: string;
  unplacedBannerItem: string;
  deletePresetConfirm: string;
  storageError: string;
  resetPricingConfirm: string;
  paperUnutilized: string;
}

export interface CommonTranslations {
  save: string;
  cancel: string;
  close: string;
  delete: string;
  apply: string;
  edit: string;
  print: string;
  exportSvg: string;
  printPdf: string;
  pricing: string;
  pricingTitle: string;
  zoomIn: string;
  zoomOut: string;
  inspectTooltip: string;
  stepByStep: string;
  sheetPagination: string;
  units: {
    mm: string;
    cm: string;
    pieces: string;
    piece: string;
    sheets: string;
    sheet: string;
    cuts: string;
    cut: string;
    steps: string;
    step: string;
    unitShort: string;
    unitShortUn: string;
  };
  metrics: {
    yield: string;
    waste: string;
    piecesAccommodated: string;
    piecesPerSheet: string;
    sheetsNeeded: string;
    financialSimulation: string;
    adjustValues: string;
    suggestedPrice: string;
    productionCost: string;
    paper: string;
    clicks: string;
    fixed: string;
    unitCost: string;
    unitPrice: string;
    wasteCost: string;
    wasteValue: string;
  };
  visualizer: {
    noSheetGenerated: string;
    configureSheetPrompt: string;
    cutGuides: string;
    cropMarks: string;
    bleed: string;
    labels: string;
    guillotine: string;
    unpinAll: string;
    resetZoom: string;
    sheetDimensions: string;
    margin: string;
    spacing: string;
    sheetNumber: string;
    cuttableBadge: string;
    cuttableSingleBadge: string;
    nonCuttableBadge: string;
    guillotineStatusFooter: string;
    guillotineStatusSingleFooter: string;
    guillotineStatusNonCuttableFooter: string;
    seeStepByStep: string;
    guidesBadgeCropOnly: string;
    guidesBadgeBleedOnly: string;
    guidesBadgeBoth: string;
    grainLong: string;
    grainShort: string;
    guillotineRequiredTooltip: string;
    guillotineRequiredActive: string;
    guillotineRequiredOptional: string;
  };
  svg: {
    title: string;
    desc: string;
    grainMetaLong: string;
    grainMetaShort: string;
    marginGuide: string;
    grainLabelLong: string;
    grainLabelShort: string;
  };
}

export interface LocaleDictionary {
  nav: NavTranslations;
  forms: FormsTranslations;
  tables: TablesTranslations;
  modals: ModalsTranslations;
  alerts: AlertsTranslations;
  common: CommonTranslations;
}
