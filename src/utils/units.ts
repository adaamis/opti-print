import type { Unit } from '../types/optimizer';

export function toMm(value: number, unit: Unit): number {
  if (!Number.isFinite(value)) return 0;
  return unit === 'cm' ? value * 10 : value;
}

export function fromMm(valueMm: number, unit: Unit): number {
  if (!Number.isFinite(valueMm)) return 0;
  const raw = unit === 'cm' ? valueMm / 10 : valueMm;
  return Math.round(raw * 100) / 100;
}

export function formatNumber(value: number, maxDecimals = 1): string {
  if (!Number.isFinite(value)) return '0';
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(value * factor) / factor;
  return rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

export function formatDim(valueMm: number, unit: Unit, includeUnit = true): string {
  const converted = fromMm(valueMm, unit);
  const formatted = formatNumber(converted, unit === 'cm' ? 2 : 1);
  return includeUnit ? `${formatted} ${unit}` : formatted;
}
