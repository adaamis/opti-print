import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetLanguageForTesting, setLanguage } from '../i18n';
import type { PricingConfig } from '../types/optimizer';
import { DEFAULT_PRICING_CONFIG } from '../utils/pricingStorage';
import { SubstrateRecommenderModal } from './SubstrateRecommenderModal';

describe('SubstrateRecommenderModal component', () => {
  beforeEach(() => {
    resetLanguageForTesting('pt-BR');
  });

  afterEach(() => {
    resetLanguageForTesting('pt-BR');
  });

  const defaultPricing: PricingConfig = {
    costPerSheet: 1.5,
    clickCost: 0.35,
    otherFixedCosts: 10.0,
    markupPercent: 40.0,
    currency: 'BRL',
  };

  it('returns null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <SubstrateRecommenderModal
        isOpen={false}
        onClose={vi.fn()}
        itemWidthMm={90}
        itemHeightMm={50}
        itemName="Cartão de Visita"
        marginMm={5}
        spacingMm={2}
        pricingConfig={defaultPricing}
        onApplyPreset={vi.fn()}
      />
    );
    expect(html).toBe('');
  });

  it('renders complete accessible modal dialog with header, controls, champion card, and ranking table when open', () => {
    const html = renderToStaticMarkup(
      <SubstrateRecommenderModal
        isOpen={true}
        onClose={vi.fn()}
        itemWidthMm={90}
        itemHeightMm={50}
        itemName="Cartão de Visita"
        marginMm={5}
        spacingMm={2}
        currentPresetId="A3"
        pricingConfig={defaultPricing}
        onApplyPreset={vi.fn()}
      />
    );

    // Dialog structure & accessibility
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Recomendação e Comparação de Qual Folha Comprar');
    expect(html).toContain('Otimizador Inteligente');

    // Item specifications in header subtitle
    expect(html).toContain('Cartão de Visita');
    expect(html).toContain('90 × 50 mm');
    expect(html).toContain('Margem: 5 mm');
    expect(html).toContain('Sangria/Espaçamento: 2 mm');

    // Run quantity controls & pills
    expect(html).toContain('Tiragem do Trabalho (Peças Finais)');
    expect(html).toContain('id="recommender-target-qty"');
    expect(html).toContain('+250');
    expect(html).toContain('+500');
    expect(html).toContain('+1.000');
    expect(html).toContain('+2.500');
    expect(html).toContain('+5.000');

    // Category filter pills
    expect(html).toContain('Filtrar por Categoria de Substrato');
    expect(html).toContain('Todos');
    expect(html).toContain('Digital / SRA');
    expect(html).toContain('Série ISO A');
    expect(html).toContain('Gráfica Offset (Brasil)');
    expect(html).toContain('Formatos Salvos');

    // #1 Champion Card
    expect(html).toContain('Melhor Escolha (#1)');
    expect(html).toContain('Aplicar Formato');
    expect(html).toContain('Folhas Necessárias');
    expect(html).toContain('Peças por Folha');
    expect(html).toContain('Aproveitamento Útil');
    expect(html).toContain('Custo de Produção');

    // Ranked Comparison Table
    expect(html).toContain('Ranking de Formatos Analisados');
    expect(html).toContain('Formato &amp; Dimensões');
    expect(html).toContain('Peças / Folha');
    expect(html).toContain('Aproveitamento');
    expect(html).toContain('Custo Total');
    expect(html).toContain('Custo Unitário');

    // Shows "Atual" badge for current preset A3
    expect(html).toContain('Atual');

    // Action button
    expect(html).toContain('Aplicar');
    expect(html).toContain('Fechar');
  });

  it('renders gracefully with 0 cost pricing config (sheet count ranking fallback)', () => {
    const zeroPricing: PricingConfig = {
      ...DEFAULT_PRICING_CONFIG,
      costPerSheet: 0,
      clickCost: 0,
      otherFixedCosts: 0,
    };

    const html = renderToStaticMarkup(
      <SubstrateRecommenderModal
        isOpen={true}
        onClose={vi.fn()}
        itemWidthMm={90}
        itemHeightMm={50}
        itemName="Tag Simples"
        marginMm={5}
        spacingMm={2}
        pricingConfig={zeroPricing}
        onApplyPreset={vi.fn()}
      />
    );

    expect(html).toContain('Recomendação e Comparação de Qual Folha Comprar');
    expect(html).toContain('Melhor Escolha (#1)');
    expect(html).toContain('Ordenado por menor número de folhas');
    expect(html).toContain('Economia');
    expect(html).toContain('Ótimo');
  });

  it('displays empty state alert when item exceeds all sheet dimensions', () => {
    const html = renderToStaticMarkup(
      <SubstrateRecommenderModal
        isOpen={true}
        onClose={vi.fn()}
        itemWidthMm={5000}
        itemHeightMm={5000}
        itemName="Painel Gigante"
        marginMm={5}
        spacingMm={2}
        pricingConfig={defaultPricing}
        onApplyPreset={vi.fn()}
      />
    );

    expect(html).toContain('Nenhum formato viável encontrado');
    expect(html).toContain('5000 × 5000 mm');
    expect(html).not.toContain('Melhor Escolha (#1)');
  });

  it('renders all categories, presets, and KPIs in English when active language is en', () => {
    setLanguage('en');

    const html = renderToStaticMarkup(
      <SubstrateRecommenderModal
        isOpen={true}
        onClose={vi.fn()}
        itemWidthMm={90}
        itemHeightMm={50}
        itemName="Cartão de Visita"
        marginMm={5}
        spacingMm={2}
        currentPresetId="A3"
        pricingConfig={defaultPricing}
        onApplyPreset={vi.fn()}
      />
    );

    // English item name & subtitle specs
    expect(html).toContain('Business Card');
    expect(html).toContain('Item:');
    expect(html).toContain('Margin: 5 mm');
    expect(html).toContain('Bleed/Spacing: 2 mm');

    // English category pills
    expect(html).toContain('All');
    expect(html).toContain('ISO Series A');
    expect(html).toContain('Commercial Offset (Brazil)');
    expect(html).toContain('Saved Formats');

    // English champion card & KPIs
    expect(html).toContain('Best Choice (#1)');
    expect(html).toContain('shts');
    expect(html).toContain('Layout:');
    expect(html).toContain('Residual scrap:');

    // English table headers
    expect(html).toContain('Category');
    expect(html).toContain('Scrap');
  });
});
