import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { calculatePricing } from '../engine/pricing';
import type { SheetLayout } from '../types/optimizer';
import { DEFAULT_PRICING_CONFIG } from '../utils/pricingStorage';
import { MetricsBar } from './MetricsBar';

const mockLayout: SheetLayout = {
  sheetNumber: 1,
  widthMm: 320,
  heightMm: 450,
  marginMm: 5,
  spacingMm: 2,
  placedItems: [
    {
      x: 5,
      y: 5,
      width: 90,
      height: 50,
      rotated: false,
      itemId: 'card-1',
      name: 'Cartão',
      color: '#0d9488',
      index: 0,
    },
  ],
  usedAreaMm2: 4500,
  usableAreaMm2: 136400,
  totalAreaMm2: 144000,
  utilizationPercent: 85.5,
  wastePercent: 14.5,
};

describe('MetricsBar component', () => {
  it('renders primary KPI cards and action buttons including Precificação', () => {
    const html = renderToStaticMarkup(
      <MetricsBar
        utilizationPercent={85.5}
        wastePercent={14.5}
        placedCount={24}
        requestedCount={50}
        sheetsCount={3}
        activeLayout={mockLayout}
        isQuickMode={false}
        onOpenPricingModal={vi.fn()}
      />
    );

    // Primary KPIs
    expect(html).toContain('Aproveitamento');
    expect(html).toContain('85,5%');
    expect(html).toContain('Desperdício / Sobra');
    expect(html).toContain('14,5%');
    expect(html).toContain('Peças Acomodadas');
    expect(html).toContain('24');
    expect(html).toContain('/ 50');
    expect(html).toContain('Folhas Necessárias');
    expect(html).toContain('3');

    // Buttons
    expect(html).toContain('Precificação');
    expect(html).toContain('Exportar SVG (1:1)');
    expect(html).toContain('Imprimir / PDF');

    // Financial row should not appear if no pricingConfig is passed
    expect(html).not.toContain('Simulação Financeira &amp; Orçamento');
  });

  it('renders financial metrics row when pricing is configured', () => {
    const pricingCalculation = calculatePricing({
      totalSheets: 3,
      placedCount: 24,
      wastePercent: 14.5,
      config: DEFAULT_PRICING_CONFIG,
    });

    const html = renderToStaticMarkup(
      <MetricsBar
        utilizationPercent={85.5}
        wastePercent={14.5}
        placedCount={24}
        requestedCount={50}
        sheetsCount={3}
        activeLayout={mockLayout}
        isQuickMode={false}
        pricingCalculation={pricingCalculation}
        pricingConfig={DEFAULT_PRICING_CONFIG}
        onOpenPricingModal={vi.fn()}
      />
    );

    // Financial row header
    expect(html).toContain('Simulação Financeira &amp; Orçamento');
    expect(html).toContain('Ajustar valores');

    // Financial cards
    expect(html).toContain('Preço Sugerido');
    expect(html).toContain('+40%');
    expect(html).toContain('Custo de Produção');
    expect(html).toContain('Custo Unitário');
    expect(html).toContain('Perda em Aparas');
  });

  it('hides financial metrics row when all pricing costs are zero', () => {
    const zeroPricingConfig = {
      costPerSheet: 0,
      clickCost: 0,
      otherFixedCosts: 0,
      markupPercent: 40,
      currency: 'BRL' as const,
    };

    const zeroCalc = calculatePricing({
      totalSheets: 3,
      placedCount: 24,
      wastePercent: 14.5,
      config: zeroPricingConfig,
    });

    const html = renderToStaticMarkup(
      <MetricsBar
        utilizationPercent={85.5}
        wastePercent={14.5}
        placedCount={24}
        sheetsCount={3}
        activeLayout={mockLayout}
        isQuickMode={true}
        pricingCalculation={zeroCalc}
        pricingConfig={zeroPricingConfig}
        onOpenPricingModal={vi.fn()}
      />
    );

    expect(html).toContain('Precificação');
    expect(html).not.toContain('Simulação Financeira &amp; Orçamento');
  });
});
