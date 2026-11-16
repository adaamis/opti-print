import type { TablesTranslations } from '../../types';

export const tables: TablesTranslations = {
  guillotine: {
    step: 'Passo',
    direction: 'Sentido',
    rulerPosition: 'Posição da Régua',
    cutSpan: 'Extensão do Corte',
    operatorInstruction: 'Instrução Técnica ao Operador',
    horizontal: 'Horizontal ↔',
    vertical: 'Vertical ↕',
    stepCutDescHorizontal: '{step}º Corte Horizontal em Y = {coord} mm (de X = {start} a {end} mm)',
    stepCutDescVertical: '{step}º Corte Vertical em X = {coord} mm (de Y = {start} a {end} mm)',
  },
  recommender: {
    rankingTitle: 'Ranking de Formatos Analisados',
    formatDimensions: 'Formato & Dimensões',
    piecesPerSheet: 'Peças / Folha',
    yield: 'Aproveitamento',
    totalCost: 'Custo Total',
    unitCost: 'Custo Unitário',
    action: 'Ação',
    apply: 'Aplicar',
    current: 'Atual',
    sheetsNeeded: '{count} folhas',
    wasteLabel: '{percent}% sobra',
    category: 'Categoria',
    scrap: 'Apara',
    sheetsShort: 'fls',
  },
};
