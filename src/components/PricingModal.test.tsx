import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PRICING_CONFIG } from '../utils/pricingStorage';
import { PricingModal } from './PricingModal';

describe('PricingModal component', () => {
  it('returns null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <PricingModal
        isOpen={false}
        onClose={vi.fn()}
        config={DEFAULT_PRICING_CONFIG}
        onSave={vi.fn()}
      />
    );
    expect(html).toBe('');
  });

  it('renders modal dialog with form fields, live preview, and action buttons when open', () => {
    const html = renderToStaticMarkup(
      <PricingModal
        isOpen={true}
        onClose={vi.fn()}
        config={DEFAULT_PRICING_CONFIG}
        onSave={vi.fn()}
        sheetsCount={5}
        placedCount={50}
        wastePercent={12.5}
      />
    );

    // Dialog structure & accessibility
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Custos &amp; Precificação de Impressão');

    // Config fields
    expect(html).toContain('id="pricing-cost-per-sheet"');
    expect(html).toContain('id="pricing-click-cost"');
    expect(html).toContain('id="pricing-fixed-cost"');
    expect(html).toContain('id="pricing-markup-percent"');
    expect(html).toContain('id="pricing-currency"');

    // Live breakdown preview
    expect(html).toContain('Prévia do Orçamento em Tempo Real');
    expect(html).toContain('Custo do Substrato');
    expect(html).toContain('Custo de Impressão');
    expect(html).toContain('Custo Total de Produção:');
    expect(html).toContain('Margem de Lucro (+40%):');
    expect(html).toContain('Preço Final Sugerido:');
    expect(html).toContain('Valor Desperdiçado em Aparas (12,5%):');
    expect(html).toContain('Custo Unitário:');
    expect(html).toContain('Preço Unitário:');

    // Action buttons
    expect(html).toContain('Salvar Configurações');
    expect(html).toContain('Restaurar Padrões');
    expect(html).toContain('Fechar');
  });

  it('renders with 0 sheets using baseline 1-sheet simulation fallback', () => {
    const html = renderToStaticMarkup(
      <PricingModal
        isOpen={true}
        onClose={vi.fn()}
        config={{ ...DEFAULT_PRICING_CONFIG, markupPercent: 50 }}
        onSave={vi.fn()}
        sheetsCount={0}
        placedCount={0}
        wastePercent={0}
      />
    );

    expect(html).toContain('Simulação base (1 folha)');
    expect(html).toContain('Margem de Lucro (+50%):');
  });
});
