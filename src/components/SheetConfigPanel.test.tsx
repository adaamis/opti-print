import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SHEET_CONFIG } from '../constants/sheets';
import type { SheetConfig } from '../types/optimizer';
import { SheetConfigPanel } from './SheetConfigPanel';

describe('SheetConfigPanel component', () => {
  const baseConfig: SheetConfig = {
    ...DEFAULT_SHEET_CONFIG,
    grainDirection: 'long',
  };

  it('renders complete configuration panel with dimensions, presets, and controls', () => {
    const html = renderToStaticMarkup(
      <SheetConfigPanel
        sheet={baseConfig}
        unit="mm"
        onUnitChange={vi.fn()}
        onChange={vi.fn()}
      />
    );

    // Header & Unit Switcher
    expect(html).toContain('Configuração da Folha');
    expect(html).toContain('mm');
    expect(html).toContain('cm');

    // Preset selector & Save Formato
    expect(html).toContain('Tamanho da Folha');
    expect(html).toContain('Salvar formato atual');

    // Dimensions & Orientation
    expect(html).toContain('Largura (mm)');
    expect(html).toContain('Altura (mm)');
    expect(html).toContain('Retrato (Vertical)');
    expect(html).toContain('Útil:');

    // Margins & Spacing
    expect(html).toContain('Margem / Pinça (mm)');
    expect(html).toContain('Espaço / Corte (mm)');
  });

  describe('Feature #4: Sentido da Fibra do Papel (Grain Direction)', () => {
    it('renders grain direction control group with label and contextual helper text', () => {
      const html = renderToStaticMarkup(
        <SheetConfigPanel
          sheet={baseConfig}
          unit="mm"
          onUnitChange={vi.fn()}
          onChange={vi.fn()}
        />
      );

      // Label & subtle Compass icon/section
      expect(html).toContain('Sentido da Fibra do Papel');

      // Both options rendered with full descriptions
      expect(html).toContain('Longa ↕');
      expect(html).toContain('(Paralela ao lado maior)');
      expect(html).toContain('Curta ↔');
      expect(html).toContain('(Paralela ao lado menor)');

      // Contextual helper text for binding/folding
      expect(html).toContain(
        'A dobra ou vinco deve acompanhar o sentido da fibra para evitar que o papel rache.'
      );
    });

    it('marks "Longa ↕" as pressed and active when grainDirection is "long"', () => {
      const html = renderToStaticMarkup(
        <SheetConfigPanel
          sheet={{ ...baseConfig, grainDirection: 'long' }}
          unit="mm"
          onUnitChange={vi.fn()}
          onChange={vi.fn()}
        />
      );

      // Check aria-pressed attributes
      expect(html).toMatch(/data-testid="grain-long-btn"[^>]*aria-pressed="true"/);
      expect(html).toMatch(/data-testid="grain-short-btn"[^>]*aria-pressed="false"/);

      // Long button has active styling
      expect(html).toContain('data-testid="grain-long-btn"');
    });

    it('marks "Longa ↕" as default pressed when grainDirection is undefined', () => {
      const { grainDirection, ...configWithoutGrain } = baseConfig;
      const html = renderToStaticMarkup(
        <SheetConfigPanel
          sheet={configWithoutGrain as SheetConfig}
          unit="mm"
          onUnitChange={vi.fn()}
          onChange={vi.fn()}
        />
      );

      expect(html).toMatch(/data-testid="grain-long-btn"[^>]*aria-pressed="true"/);
      expect(html).toMatch(/data-testid="grain-short-btn"[^>]*aria-pressed="false"/);
    });

    it('marks "Curta ↔" as pressed and active when grainDirection is "short"', () => {
      const html = renderToStaticMarkup(
        <SheetConfigPanel
          sheet={{ ...baseConfig, grainDirection: 'short' }}
          unit="mm"
          onUnitChange={vi.fn()}
          onChange={vi.fn()}
        />
      );

      expect(html).toMatch(/data-testid="grain-long-btn"[^>]*aria-pressed="false"/);
      expect(html).toMatch(/data-testid="grain-short-btn"[^>]*aria-pressed="true"/);
    });
  });

  describe('Unit and orientation display', () => {
    it('adapts labels and values when unit is cm', () => {
      const html = renderToStaticMarkup(
        <SheetConfigPanel
          sheet={baseConfig}
          unit="cm"
          onUnitChange={vi.fn()}
          onChange={vi.fn()}
        />
      );

      expect(html).toContain('Largura (cm)');
      expect(html).toContain('Altura (cm)');
      expect(html).toContain('Margem / Pinça (cm)');
      expect(html).toContain('Espaço / Corte (cm)');
    });

    it('displays landscape orientation when width > height', () => {
      const html = renderToStaticMarkup(
        <SheetConfigPanel
          sheet={{
            ...baseConfig,
            widthMm: 420,
            heightMm: 297,
            orientation: 'landscape',
          }}
          unit="mm"
          onUnitChange={vi.fn()}
          onChange={vi.fn()}
        />
      );

      expect(html).toContain('Paisagem (Horizontal)');
    });
  });

  describe('Save current format button', () => {
    it('renders as a full-width black button directly below the orientation indicator', () => {
      const html = renderToStaticMarkup(
        <SheetConfigPanel
          sheet={{
            ...baseConfig,
            orientation: 'landscape',
          }}
          unit="mm"
          onUnitChange={vi.fn()}
          onChange={vi.fn()}
        />
      );

      // Button content & styling
      expect(html).toContain('Salvar formato atual');
      expect(html).toContain('bg-stone-900');
      expect(html).toContain('text-stone-50');
      expect(html).toContain('w-full');

      // Placement: orientation pill appears before the save format button, and grain direction appears after
      const orientationIndex = html.indexOf('Paisagem (Horizontal)');
      const saveButtonIndex = html.indexOf('Salvar formato atual');
      const grainIndex = html.indexOf('Sentido da Fibra do Papel');

      expect(orientationIndex).toBeGreaterThan(-1);
      expect(saveButtonIndex).toBeGreaterThan(orientationIndex);
      expect(grainIndex).toBeGreaterThan(saveButtonIndex);

      // Verify it is not in the Tamanho da Folha header
      const presetHeaderIndex = html.indexOf('Tamanho da Folha');
      const presetSelectIndex = html.indexOf('id="sheet-preset-select"');
      const headerSnippet = html.slice(presetHeaderIndex, presetSelectIndex);
      expect(headerSnippet).not.toContain('Salvar formato atual');
    });
  });
});
