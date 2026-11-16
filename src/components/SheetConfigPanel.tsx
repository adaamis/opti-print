import React, { useState } from 'react';
import {
  ArrowLeftRight,
  BookmarkCheck,
  BookmarkPlus,
  Compass,
  FileText,
  Info,
  Maximize2,
  Ruler,
  Trash2,
} from 'lucide-react';
import { SHEET_PRESET_GROUPS } from '../constants/sheets';
import {
  getLocalizedCategory,
  getLocalizedSheetPresetName,
  useTranslation,
} from '../i18n';
import type { SheetConfig, Unit } from '../types/optimizer';
import {
  deleteCustomPreset,
  findPresetById,
  loadSavedCustomPresets,
  saveCustomPreset,
} from '../utils/customPresets';
import { formatDim, fromMm, toMm } from '../utils/units';

interface SheetConfigPanelProps {
  sheet: SheetConfig;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
  onChange: (next: SheetConfig) => void;
}

export const SheetConfigPanel: React.FC<SheetConfigPanelProps> = ({
  sheet,
  unit,
  onUnitChange,
  onChange,
}) => {
  const { t, language } = useTranslation();
  const [customPresets, setCustomPresets] = useState(() => loadSavedCustomPresets());
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Determine currently selected custom preset, if any
  const selectedCustomPreset = customPresets.find((p) => p.id === sheet.presetId);

  // Safe dropdown value (falls back to CUSTOM if ID is unknown)
  const isKnownId =
    sheet.presetId === 'CUSTOM' || Boolean(findPresetById(sheet.presetId, customPresets));
  const currentSelectValue = isKnownId ? sheet.presetId : 'CUSTOM';

  const handleSelectPreset = (nextId: string) => {
    if (nextId === 'CUSTOM') {
      onChange({ ...sheet, presetId: 'CUSTOM' });
      return;
    }

    const preset = findPresetById(nextId, customPresets);
    if (!preset) {
      onChange({ ...sheet, presetId: 'CUSTOM' });
      return;
    }

    const isLandscape = sheet.orientation === 'landscape';
    const minDim = Math.min(preset.widthMm, preset.heightMm);
    const maxDim = Math.max(preset.widthMm, preset.heightMm);
    const nextW = isLandscape ? maxDim : minDim;
    const nextH = isLandscape ? minDim : maxDim;

    onChange({
      ...sheet,
      presetId: nextId,
      widthMm: nextW,
      heightMm: nextH,
      grainDirection: preset.grainDirection ?? sheet.grainDirection ?? 'long',
    });
  };

  const handleToggleOrientation = () => {
    const nextOrientation = sheet.orientation === 'portrait' ? 'landscape' : 'portrait';
    onChange({
      ...sheet,
      orientation: nextOrientation,
      widthMm: sheet.heightMm,
      heightMm: sheet.widthMm,
    });
  };

  const handleDimensionChange = (field: 'widthMm' | 'heightMm', rawValue: string) => {
    const parsed = parseFloat(rawValue);
    const valueMm = Number.isFinite(parsed) && parsed >= 0 ? toMm(parsed, unit) : 0;
    const nextWidth = field === 'widthMm' ? valueMm : sheet.widthMm;
    const nextHeight = field === 'heightMm' ? valueMm : sheet.heightMm;
    onChange({
      ...sheet,
      presetId: 'CUSTOM',
      widthMm: nextWidth,
      heightMm: nextHeight,
      orientation: nextWidth > nextHeight ? 'landscape' : 'portrait',
    });
  };

  const handleMarginOrSpacing = (field: 'marginMm' | 'spacingMm', rawValue: string) => {
    const parsed = parseFloat(rawValue);
    const valueMm = Number.isFinite(parsed) && parsed >= 0 ? toMm(parsed, unit) : 0;
    onChange({
      ...sheet,
      [field]: valueMm,
    });
  };

  const handleStartSaveCustom = () => {
    setIsSavingCustom(true);
    setSaveError(null);
    setCustomNameInput('');
  };

  const handleSaveCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (sheet.widthMm <= 0 || sheet.heightMm <= 0) {
      setSaveError(t('forms.sheetConfig.invalidDimensions'));
      return;
    }

    const created = saveCustomPreset({
      name: customNameInput,
      widthMm: sheet.widthMm,
      heightMm: sheet.heightMm,
    });

    const refreshed = loadSavedCustomPresets();
    setCustomPresets(refreshed);
    setIsSavingCustom(false);
    setCustomNameInput('');
    setSaveError(null);

    // Automatically select the newly created preset
    onChange({
      ...sheet,
      presetId: created.id,
    });
  };

  const handleDeleteSavedPreset = (id: string) => {
    const updated = deleteCustomPreset(id);
    setCustomPresets(updated);
    if (sheet.presetId === id) {
      onChange({
        ...sheet,
        presetId: 'CUSTOM',
      });
    }
  };

  const usableW = Math.max(0, sheet.widthMm - 2 * sheet.marginMm);
  const usableH = Math.max(0, sheet.heightMm - 2 * sheet.marginMm);
  const step = unit === 'cm' ? '0.1' : '1';
  const grainDirection = sheet.grainDirection ?? 'long';

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-xs dark:border-[#1E2B45] dark:bg-[#111A2E]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-stone-700 dark:text-slate-300" />
          <h2
            data-i18n="forms.sheetConfig.title"
            className="text-sm font-semibold tracking-tight text-stone-900 dark:text-slate-100"
          >
            {t('forms.sheetConfig.title')}
          </h2>
        </div>

        {/* Unit switcher */}
        <div
          className="inline-flex rounded-full border border-stone-200/60 bg-stone-100/70 p-0.5 text-xs font-medium dark:border-[#1E2B45] dark:bg-[#0D1527]"
          title={t('forms.sheetConfig.unitTooltip')}
          data-i18n-title="forms.sheetConfig.unitTooltip"
        >
          <button
            type="button"
            onClick={() => onUnitChange('mm')}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              unit === 'mm'
                ? 'bg-white text-stone-900 shadow-xs dark:bg-[#18243C] dark:text-white'
                : 'text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            mm
          </button>
          <button
            type="button"
            onClick={() => onUnitChange('cm')}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              unit === 'cm'
                ? 'bg-white text-stone-900 shadow-xs dark:bg-[#18243C] dark:text-white'
                : 'text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            cm
          </button>
        </div>
      </div>

      {/* Preset Dropdown Select */}
      <div className="mb-4 space-y-2">
        <label
          htmlFor="sheet-preset-select"
          data-i18n="forms.sheetConfig.presetLabel"
          className="block text-xs font-medium text-stone-600 dark:text-slate-300"
        >
          {t('forms.sheetConfig.presetLabel')}
        </label>

        <select
          id="sheet-preset-select"
          value={currentSelectValue}
          onChange={(e) => handleSelectPreset(e.target.value)}
          className="w-full rounded-xl border border-stone-200/70 bg-stone-50/40 px-3 py-2 text-xs font-medium text-stone-900 shadow-xs focus:border-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100 dark:focus:border-teal-400 dark:focus:bg-[#0D1527]"
        >
          <optgroup label={t('forms.sheetConfig.customCategory')}>
            <option value="CUSTOM">{t('forms.sheetConfig.customOption')}</option>
          </optgroup>

          {customPresets.length > 0 && (
            <optgroup label={t('forms.sheetConfig.mySavedFormats')}>
              {customPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.description})
                </option>
              ))}
            </optgroup>
          )}

          {SHEET_PRESET_GROUPS.map((group) => (
            <optgroup
              key={group.category}
              label={getLocalizedCategory(group.category, language)}
            >
              {group.items.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {getLocalizedSheetPresetName(preset.id, preset.name, language)} — {preset.description}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Selected Custom Preset Badge & Action */}
        {selectedCustomPreset && (
          <div className="flex items-center justify-between rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-center gap-1.5 truncate">
              <BookmarkCheck className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate font-medium">
                {selectedCustomPreset.name} ({selectedCustomPreset.description})
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleDeleteSavedPreset(selectedCustomPreset.id)}
              className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors"
              title={t('forms.sheetConfig.deletePresetTitle')}
              data-i18n-title="forms.sheetConfig.deletePresetTitle"
              data-i18n="forms.sheetConfig.deletePreset"
            >
              <Trash2 className="h-3 w-3" />
              {t('forms.sheetConfig.deletePreset')}
            </button>
          </div>
        )}
      </div>

      {/* Sheet dimensions & orientation */}
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div>
          <label
            data-i18n="forms.sheetConfig.width"
            className="mb-1 block text-xs font-medium text-stone-500 dark:text-slate-400"
          >
            {t('forms.sheetConfig.width', { unit })}
          </label>
          <input
            type="number"
            min="1"
            step={step}
            value={fromMm(sheet.widthMm, unit) || ''}
            onChange={(e) => handleDimensionChange('widthMm', e.target.value)}
            className="w-full rounded-xl border border-stone-200/70 bg-stone-50/40 px-3 py-2 text-sm font-medium text-stone-900 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100 dark:focus:border-teal-400 dark:focus:bg-[#0D1527]"
          />
        </div>

        <button
          type="button"
          onClick={handleToggleOrientation}
          title={t('forms.sheetConfig.flipOrientationTitle', {
            orientation:
              sheet.orientation === 'portrait'
                ? t('forms.sheetConfig.portrait')
                : t('forms.sheetConfig.landscape'),
          })}
          data-i18n-title="forms.sheetConfig.flipOrientationTitle"
          className="mb-0.5 flex h-9.5 items-center justify-center rounded-xl border border-stone-200/70 bg-stone-50/50 px-2.5 text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-100 hover:text-stone-900 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-[#18243C] dark:hover:text-white"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>

        <div>
          <label
            data-i18n="forms.sheetConfig.height"
            className="mb-1 block text-xs font-medium text-stone-500 dark:text-slate-400"
          >
            {t('forms.sheetConfig.height', { unit })}
          </label>
          <input
            type="number"
            min="1"
            step={step}
            value={fromMm(sheet.heightMm, unit) || ''}
            onChange={(e) => handleDimensionChange('heightMm', e.target.value)}
            className="w-full rounded-xl border border-stone-200/70 bg-stone-50/40 px-3 py-2 text-sm font-medium text-stone-900 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100 dark:focus:border-teal-400 dark:focus:bg-[#0D1527]"
          />
        </div>
      </div>

      {/* Orientation pill + usable info */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-stone-200/50 bg-stone-50/50 px-3 py-2 text-xs text-stone-600 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300">
        <span
          data-i18n={
            sheet.orientation === 'portrait'
              ? 'forms.sheetConfig.portraitLong'
              : 'forms.sheetConfig.landscapeLong'
          }
          className="inline-flex items-center gap-1.5 font-medium"
        >
          <Maximize2 className="h-3.5 w-3.5 text-stone-400 dark:text-slate-400" />
          {sheet.orientation === 'portrait'
            ? t('forms.sheetConfig.portraitLong')
            : t('forms.sheetConfig.landscapeLong')}
        </span>
        <span
          className="font-mono text-[11px] text-stone-500 dark:text-slate-400"
          title={t('forms.sheetConfig.usableAreaTitle')}
          data-i18n-title="forms.sheetConfig.usableAreaTitle"
        >
          {t('forms.sheetConfig.usableArea', {
            width: formatDim(usableW, unit, false),
            height: formatDim(usableH, unit),
          })}
        </span>
      </div>

      {/* Save current format button / inline form */}
      {!isSavingCustom ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleStartSaveCustom}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-3.5 py-2.5 text-xs font-medium text-stone-50 shadow-xs transition-colors hover:bg-stone-800 cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white"
            title={t('forms.sheetConfig.saveFormatTitle')}
            data-i18n-title="forms.sheetConfig.saveFormatTitle"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span data-i18n="forms.sheetConfig.saveFormat">{t('forms.sheetConfig.saveFormat')}</span>
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSaveCustomSubmit}
          className="mb-4 rounded-xl border border-stone-200/80 bg-stone-50/70 p-3 space-y-2.5 text-xs dark:border-[#1E2B45] dark:bg-[#0D1527]"
        >
          <div className="flex items-center justify-between">
            <span
              data-i18n="forms.sheetConfig.saveCustomTitle"
              className="font-medium text-stone-900 dark:text-slate-100"
            >
              {t('forms.sheetConfig.saveCustomTitle')}
            </span>
            <span className="font-mono text-[11px] text-stone-500 dark:text-slate-400">
              {formatDim(sheet.widthMm, unit, false)} × {formatDim(sheet.heightMm, unit)}
            </span>
          </div>

          <input
            type="text"
            placeholder={t('forms.sheetConfig.presetNamePlaceholder')}
            data-i18n-placeholder="forms.sheetConfig.presetNamePlaceholder"
            value={customNameInput}
            onChange={(e) => {
              setCustomNameInput(e.target.value);
              if (saveError) setSaveError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsSavingCustom(false);
                setSaveError(null);
              }
            }}
            className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-slate-100 dark:focus:border-teal-400"
            autoFocus
          />

          {saveError && <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{saveError}</p>}

          <div className="flex justify-end gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setIsSavingCustom(false);
                setSaveError(null);
              }}
              data-i18n="forms.sheetConfig.cancel"
              className="rounded-lg px-2.5 py-1 text-stone-500 hover:bg-stone-200/60 dark:text-slate-400 dark:hover:bg-[#18243C] dark:hover:text-slate-200 transition-colors"
            >
              {t('forms.sheetConfig.cancel')}
            </button>
            <button
              type="submit"
              data-i18n="forms.sheetConfig.saveToMenu"
              className="rounded-lg bg-stone-900 px-3 py-1 font-medium text-stone-50 shadow-xs hover:bg-stone-800 dark:bg-teal-700 dark:hover:bg-teal-600 dark:text-white transition-colors"
            >
              {t('forms.sheetConfig.saveToMenu')}
            </button>
          </div>
        </form>
      )}

      {/* Paper Grain Direction (Sentido da Fibra do Papel) */}
      <div className="mb-4 space-y-1.5">
        <label
          data-i18n="forms.sheetConfig.grainDirection"
          className="flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-slate-300"
        >
          <Compass className="h-3.5 w-3.5 text-stone-500 dark:text-slate-400" />
          {t('forms.sheetConfig.grainDirection')}
        </label>

        <div
          role="group"
          aria-label={t('forms.sheetConfig.grainDirection')}
          data-i18n-aria-label="forms.sheetConfig.grainDirection"
          className="grid grid-cols-2 gap-1 rounded-xl border border-stone-200/70 bg-stone-100/70 p-1 text-xs dark:border-[#1E2B45] dark:bg-[#0D1527]"
        >
          <button
            type="button"
            data-testid="grain-long-btn"
            aria-pressed={grainDirection === 'long'}
            onClick={() => onChange({ ...sheet, grainDirection: 'long' })}
            className={`flex flex-col items-center justify-center rounded-lg py-1.5 px-2 transition-all ${
              grainDirection === 'long'
                ? 'bg-white text-stone-900 shadow-xs font-semibold dark:bg-[#18243C] dark:text-white'
                : 'text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span data-i18n="forms.sheetConfig.grainLong">{t('forms.sheetConfig.grainLong')}</span>
            <span
              data-i18n="forms.sheetConfig.grainLongDesc"
              className="text-[10px] font-normal text-stone-400 dark:text-slate-500"
            >
              {t('forms.sheetConfig.grainLongDesc')}
            </span>
          </button>
          <button
            type="button"
            data-testid="grain-short-btn"
            aria-pressed={grainDirection === 'short'}
            onClick={() => onChange({ ...sheet, grainDirection: 'short' })}
            className={`flex flex-col items-center justify-center rounded-lg py-1.5 px-2 transition-all ${
              grainDirection === 'short'
                ? 'bg-white text-stone-900 shadow-xs font-semibold dark:bg-[#18243C] dark:text-white'
                : 'text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span data-i18n="forms.sheetConfig.grainShort">{t('forms.sheetConfig.grainShort')}</span>
            <span
              data-i18n="forms.sheetConfig.grainShortDesc"
              className="text-[10px] font-normal text-stone-400 dark:text-slate-500"
            >
              {t('forms.sheetConfig.grainShortDesc')}
            </span>
          </button>
        </div>

        <p
          data-i18n="forms.sheetConfig.grainHelper"
          className="text-[11px] font-light text-stone-400 dark:text-slate-500"
        >
          {t('forms.sheetConfig.grainHelper')}
        </p>
      </div>

      {/* Margin & Spacing */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label
            data-i18n="forms.sheetConfig.marginLabel"
            className="mb-1 flex items-center gap-1 text-xs font-medium text-stone-500 dark:text-slate-400"
            title={t('forms.sheetConfig.marginTooltip')}
            data-i18n-title="forms.sheetConfig.marginTooltip"
          >
            <Ruler className="h-3 w-3 text-stone-400 dark:text-slate-500" />
            {t('forms.sheetConfig.marginLabel', { unit })}
            <Info className="h-3 w-3 text-stone-400 dark:text-slate-500" />
          </label>
          <input
            type="number"
            min="0"
            step={step}
            value={fromMm(sheet.marginMm, unit)}
            onChange={(e) => handleMarginOrSpacing('marginMm', e.target.value)}
            className="w-full rounded-xl border border-stone-200/70 bg-stone-50/40 px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100 dark:focus:border-teal-400 dark:focus:bg-[#0D1527]"
          />
        </div>

        <div>
          <label
            data-i18n="forms.sheetConfig.spacingLabel"
            className="mb-1 flex items-center gap-1 text-xs font-medium text-stone-500 dark:text-slate-400"
            title={t('forms.sheetConfig.spacingTooltip')}
            data-i18n-title="forms.sheetConfig.spacingTooltip"
          >
            {t('forms.sheetConfig.spacingLabel', { unit })}
            <Info className="h-3 w-3 text-stone-400 dark:text-slate-500" />
          </label>
          <input
            type="number"
            min="0"
            step={step}
            value={fromMm(sheet.spacingMm, unit)}
            onChange={(e) => handleMarginOrSpacing('spacingMm', e.target.value)}
            className="w-full rounded-xl border border-stone-200/70 bg-stone-50/40 px-3 py-2 text-sm text-stone-900 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-100 dark:focus:border-teal-400 dark:focus:bg-[#0D1527]"
          />
        </div>
      </div>
    </section>
  );
};
