import { getDictionary, getLanguage } from './i18n';
import type { Language } from './types';

const CURRENCY_LOCALES: Record<string, Record<Language, string>> = {
  BRL: { 'pt-BR': 'pt-BR', en: 'en-US' },
  USD: { 'pt-BR': 'pt-BR', en: 'en-US' },
  EUR: { 'pt-BR': 'pt-BR', en: 'en-US' },
};

/**
 * Formats a number with localized decimal separators (pt-BR = "," vs en = ".")
 */
export function formatNumber(value: number, maxDecimals = 1, locale?: Language): string {
  if (!Number.isFinite(value)) return '0';
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(value * factor) / factor;
  const currentLang = locale || getLanguage();
  const intlLocale = currentLang === 'en' ? 'en-US' : 'pt-BR';

  return rounded.toLocaleString(intlLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Formats a currency value respecting the active language and target currency.
 */
export function formatCurrency(
  value: number,
  currency: string = 'BRL',
  locale?: Language
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const activeLang = locale || getLanguage();
  const targetCurrency = currency.toUpperCase();
  const intlLocale =
    CURRENCY_LOCALES[targetCurrency]?.[activeLang] ||
    (activeLang === 'en' ? 'en-US' : 'pt-BR');

  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: targetCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

/**
 * Pluralizes words based on count.
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return Math.abs(count) === 1 ? singular : plural;
}

/**
 * Normalizes and localizes standard paper and substrate categories.
 */
export function getLocalizedCategory(category: string, lang?: Language): string {
  if (!category || typeof category !== 'string') return category || '';
  const currentLang = lang || getLanguage();
  const catDict = getDictionary(currentLang).forms.sheetConfig.categories;

  const normalized = category
    .replace(/[\u{1F300}-\u{1F9FF}]|⭐|💡/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  if (normalized === 'todos' || normalized === 'all') {
    return catDict.all;
  }
  if (
    normalized === 'digital / sra' ||
    normalized === 'digital' ||
    normalized === 'sra'
  ) {
    return catDict.digitalSra;
  }
  if (
    normalized === 'série iso a' ||
    normalized === 'serie iso a' ||
    normalized === 'iso series a' ||
    normalized === 'iso a'
  ) {
    return catDict.isoA;
  }
  if (
    normalized === 'série iso b' ||
    normalized === 'serie iso b' ||
    normalized === 'iso series b' ||
    normalized === 'iso b'
  ) {
    return catDict.isoB;
  }
  if (
    normalized.includes('offset') ||
    normalized.includes('grafica offset') ||
    normalized.includes('gráfica offset') ||
    normalized.includes('commercial offset')
  ) {
    return catDict.offsetBrasil;
  }
  if (
    normalized === 'eua / outros' ||
    normalized === 'us / others' ||
    normalized === 'usa' ||
    normalized === 'us' ||
    normalized === 'eua'
  ) {
    return catDict.usaOther;
  }
  if (normalized.includes('salvo') || normalized.includes('saved')) {
    return catDict.savedFormats;
  }

  return category;
}

/**
 * Localizes sheet preset names (e.g. Offset or US sizes), falling back to defaultName.
 */
export function getLocalizedSheetPresetName(
  presetId: string,
  defaultName: string,
  lang?: Language
): string {
  const currentLang = lang || getLanguage();
  const presetNames = getDictionary(currentLang).forms.sheetConfig.presetNames;
  const key = presetId as keyof typeof presetNames;

  if (key in presetNames && presetNames[key]) {
    return presetNames[key];
  }

  return defaultName;
}

const PRESET_ITEM_NAME_PAIRS: Array<{ 'pt-BR': string; en: string }> = [
  { 'pt-BR': 'Cartão de Visita', en: 'Business Card' },
  { 'pt-BR': 'Adesivo 7×7', en: 'Sticker 7×7' },
  { 'pt-BR': 'Panfleto A6', en: 'Flyer A6' },
  { 'pt-BR': 'Tag Produto', en: 'Product Tag' },
  { 'pt-BR': 'Adesivo Marca', en: 'Brand Sticker' },
  { 'pt-BR': 'Elemento Gráfico', en: 'Graphic Element' },
  { 'pt-BR': 'Elemento', en: 'Element' },
];

/**
 * Bidirectionally localizes default preset item names and Element N patterns.
 * Custom user-defined names are returned untouched.
 */
export function getLocalizedPresetItemName(name: string, lang?: Language): string {
  if (!name || typeof name !== 'string') return name || '';
  const currentLang = lang || getLanguage();
  const trimmed = name.trim();

  const elementMatch = trimmed.match(/^(?:Elemento|Element)\s+(\d+)$/i);
  if (elementMatch) {
    const idx = elementMatch[1];
    return currentLang === 'en' ? `Element ${idx}` : `Elemento ${idx}`;
  }

  const match = PRESET_ITEM_NAME_PAIRS.find(
    (pair) =>
      pair['pt-BR'].toLowerCase() === trimmed.toLowerCase() ||
      pair.en.toLowerCase() === trimmed.toLowerCase()
  );

  if (match) {
    return match[currentLang];
  }

  return name;
}

/**
 * Formats sample element preset dropdown labels according to active language.
 */
export function getLocalizedSamplePresetLabel(
  preset: { label: string; name: string; widthMm: number; heightMm: number },
  lang?: Language
): string {
  const currentLang = lang || getLanguage();
  const labels = getDictionary(currentLang).forms.quick.samplePresetLabels;
  const nameLower = (preset.name || '').toLowerCase();
  const labelLower = (preset.label || '').toLowerCase();

  if (
    nameLower.includes('cartão') ||
    nameLower.includes('business card') ||
    labelLower.includes('cartão') ||
    labelLower.includes('business card')
  ) {
    return labels.businessCard;
  }
  if (
    nameLower.includes('7×7') ||
    nameLower.includes('adesivo quadrado') ||
    nameLower.includes('square sticker') ||
    labelLower.includes('quadrado') ||
    labelLower.includes('square')
  ) {
    return labels.squareSticker;
  }
  if (nameLower.includes('a6') || labelLower.includes('a6')) {
    return labels.flyerA6;
  }
  if (
    nameLower.includes('tag') ||
    nameLower.includes('etiqueta') ||
    labelLower.includes('tag') ||
    labelLower.includes('etiqueta') ||
    labelLower.includes('label')
  ) {
    return labels.productTag;
  }

  return `${getLocalizedPresetItemName(preset.name, currentLang)} (${preset.widthMm} × ${preset.heightMm} mm)`;
}
