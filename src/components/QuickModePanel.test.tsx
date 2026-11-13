import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { computeQuickYield } from '../engine/packer';
import { DEFAULT_SHEET_CONFIG, SAMPLE_ELEMENT_PRESETS } from '../constants/sheets';
import { QuickModePanel } from './QuickModePanel';

describe('QuickModePanel component', () => {
  const comparison = computeQuickYield(DEFAULT_SHEET_CONFIG, 90, 50, 'Cartão de Visita', '#2563eb');

  it('renders quick mode panel with element inputs, presets dropdown, comparison cards, and recommender button', () => {
    const onOpenRecommender = vi.fn();

    const html = renderToStaticMarkup(
      <QuickModePanel
        itemWidthMm={90}
        itemHeightMm={50}
        itemName="Cartão de Visita"
        unit="mm"
        comparison={comparison}
        activeStrategy="mixed"
        onItemChange={vi.fn()}
        onSelectStrategy={vi.fn()}
        onOpenRecommender={onOpenRecommender}
      />
    );

    // Form inputs & labels
    expect(html).toContain('Cálculo Rápido (Quantos Cabem?)');
    expect(html).toContain('Largura do Elemento (mm)');
    expect(html).toContain('Altura do Elemento (mm)');

    // Format presets dropdown & label
    expect(html).toContain('Formatos comuns da gráfica:');
    expect(html).toContain('id="quick-format-preset-select"');
    expect(html).toContain('Selecionar formato comum...');
    for (const preset of SAMPLE_ELEMENT_PRESETS) {
      expect(html).toContain(preset.label);
    }
    expect(html).toContain('Cartão de Visita (90 × 50 mm)');

    // Recommender button
    expect(html).toContain('Qual Folha Comprar?');

    // Comparison strategy cards
    expect(html).toContain('Comparativo de Aproveitamento');
    expect(html).toContain('Normal (0°)');
    expect(html).toContain('Rotacionado (90°)');
    expect(html).toContain('Misto Máximo');
  });

  it('selects the matching preset option when width and height match', () => {
    const html = renderToStaticMarkup(
      <QuickModePanel
        itemWidthMm={90}
        itemHeightMm={50}
        itemName="Cartão de Visita"
        unit="mm"
        comparison={comparison}
        activeStrategy="mixed"
        onItemChange={vi.fn()}
        onSelectStrategy={vi.fn()}
      />
    );

    expect(html).toContain('<option value="Cartão de Visita (90 × 50 mm)" selected=""');
  });

  it('selects the placeholder option when dimensions do not match any preset', () => {
    const html = renderToStaticMarkup(
      <QuickModePanel
        itemWidthMm={123}
        itemHeightMm={456}
        itemName="Custom Piece"
        unit="mm"
        comparison={comparison}
        activeStrategy="mixed"
        onItemChange={vi.fn()}
        onSelectStrategy={vi.fn()}
      />
    );

    expect(html).toContain('<option value="" selected=""');
    expect(html).not.toContain('<option value="Cartão de Visita (90 × 50 mm)" selected=""');
  });

  it('invokes onItemChange with the selected preset dimensions and name when an option is selected', () => {
    const onItemChange = vi.fn();
    const tree = QuickModePanel({
      itemWidthMm: 90,
      itemHeightMm: 50,
      itemName: 'Cartão de Visita',
      unit: 'mm',
      comparison,
      activeStrategy: 'mixed',
      onItemChange,
      onSelectStrategy: vi.fn(),
    });

    // Helper to find the select in the JSX element tree
    const findSelect = (node: any): any => {
      if (!node) return null;
      if (node.type === 'select') return node;
      if (Array.isArray(node)) {
        for (const item of node) {
          const found = findSelect(item);
          if (found) return found;
        }
      }
      if (node.props?.children) {
        return findSelect(node.props.children);
      }
      return null;
    };

    const select = findSelect(tree);
    expect(select).not.toBeNull();
    expect(select.props.id).toBe('quick-format-preset-select');

    // Select Panfleto A6 preset
    select.props.onChange({
      target: { value: 'Panfleto A6 (105 × 148 mm)' },
    });

    expect(onItemChange).toHaveBeenCalledWith(105, 148, 'Panfleto A6');

    // Selecting placeholder should not invoke onItemChange
    onItemChange.mockClear();
    select.props.onChange({
      target: { value: '' },
    });
    expect(onItemChange).not.toHaveBeenCalled();
  });

  it('does not render recommender button when onOpenRecommender is omitted', () => {
    const html = renderToStaticMarkup(
      <QuickModePanel
        itemWidthMm={90}
        itemHeightMm={50}
        itemName="Cartão de Visita"
        unit="mm"
        comparison={comparison}
        activeStrategy="mixed"
        onItemChange={vi.fn()}
        onSelectStrategy={vi.fn()}
      />
    );

    expect(html).not.toContain('Qual Folha Comprar?');
  });
});
