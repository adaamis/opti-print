import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { GuillotineAnalysis, SheetLayout } from '../types/optimizer';
import { GuillotineModal } from './GuillotineModal';

const mockSheetLayout: SheetLayout = {
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
      name: 'Cartão 1',
      color: '#0d9488',
      index: 0,
    },
    {
      x: 97,
      y: 5,
      width: 90,
      height: 50,
      rotated: false,
      itemId: 'card-2',
      name: 'Cartão 2',
      color: '#3b82f6',
      index: 1,
    },
  ],
  usedAreaMm2: 9000,
  usableAreaMm2: 136400,
  totalAreaMm2: 144000,
  utilizationPercent: 88.2,
  wastePercent: 11.8,
};

const mockCuttableAnalysis: GuillotineAnalysis = {
  isGuillotineCuttable: true,
  totalCutsNeeded: 3,
  steps: [
    {
      stepNumber: 1,
      direction: 'horizontal',
      coordinateMm: 150.0,
      cutStartMm: 5.0,
      cutEndMm: 315.0,
      blockBounds: { x: 5, y: 5, width: 310, height: 440 },
      description: '1º Corte Horizontal em Y = 150.0 mm (de X = 5.0 a 315.0 mm)',
    },
    {
      stepNumber: 2,
      direction: 'vertical',
      coordinateMm: 95.0,
      cutStartMm: 5.0,
      cutEndMm: 150.0,
      blockBounds: { x: 5, y: 5, width: 310, height: 145 },
      description: '2º Corte Vertical em X = 95.0 mm (de Y = 5.0 a 150.0 mm)',
    },
    {
      stepNumber: 3,
      direction: 'vertical',
      coordinateMm: 190.0,
      cutStartMm: 5.0,
      cutEndMm: 150.0,
      blockBounds: { x: 95, y: 5, width: 215, height: 145 },
      description: '3º Corte Vertical em X = 190.0 mm (de Y = 5.0 a 150.0 mm)',
    },
  ],
  efficiencyRating: 'ideal',
  message: 'Layout 100% guilhotinável em 3 cortes lineares sequenciais.',
};

const mockNonCuttableAnalysis: GuillotineAnalysis = {
  isGuillotineCuttable: false,
  totalCutsNeeded: 0,
  steps: [],
  efficiencyRating: 'non-guillotine',
  message:
    'Layout não guilhotinável. Padrão entrelaçado (pinwheel/interlock) detectado — requer corte manual ou mesa de corte (plotter).',
};

describe('GuillotineModal component', () => {
  it('returns null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <GuillotineModal
        isOpen={false}
        onClose={vi.fn()}
        analysis={mockCuttableAnalysis}
        sheetLayout={mockSheetLayout}
      />
    );
    expect(html).toBe('');
  });

  it('renders modal dialog with accessibility attributes, title, and sheet badge when open', () => {
    const html = renderToStaticMarkup(
      <GuillotineModal
        isOpen={true}
        onClose={vi.fn()}
        analysis={mockCuttableAnalysis}
        sheetLayout={mockSheetLayout}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('id="guillotine-modal-title"');
    expect(html).toContain('Sequência de Cortes na Guilhotina');
    expect(html).toContain('Folha 1 (320 × 450 mm)');
  });

  it('renders success status banner with efficiency rating and cuts count when cuttable', () => {
    const html = renderToStaticMarkup(
      <GuillotineModal
        isOpen={true}
        onClose={vi.fn()}
        analysis={mockCuttableAnalysis}
        sheetLayout={mockSheetLayout}
      />
    );

    expect(html).toContain('data-testid="guillotine-status-banner-success"');
    expect(html).toContain('✓ 100% Cortável em Guilhotina');
    expect(html).toContain('data-testid="guillotine-efficiency-badge"');
    expect(html).toContain('Eficiência Ideal');
    expect(html).toContain('3 cortes lineares');
    expect(html).toContain('Layout 100% guilhotinável em 3 cortes lineares sequenciais.');
  });

  it('renders moderate and complex efficiency rating variants properly', () => {
    const moderateHtml = renderToStaticMarkup(
      <GuillotineModal
        isOpen={true}
        onClose={vi.fn()}
        analysis={{
          ...mockCuttableAnalysis,
          efficiencyRating: 'moderate',
        }}
        sheetLayout={mockSheetLayout}
      />
    );
    expect(moderateHtml).toContain('Eficiência Moderada');

    const complexHtml = renderToStaticMarkup(
      <GuillotineModal
        isOpen={true}
        onClose={vi.fn()}
        analysis={{
          ...mockCuttableAnalysis,
          efficiencyRating: 'complex',
        }}
        sheetLayout={mockSheetLayout}
      />
    );
    expect(complexHtml).toContain('Eficiência Complexa');
  });

  it('renders step-by-step table listing step numbers, directions, coordinates, spans, and descriptions', () => {
    const html = renderToStaticMarkup(
      <GuillotineModal
        isOpen={true}
        onClose={vi.fn()}
        analysis={mockCuttableAnalysis}
        sheetLayout={mockSheetLayout}
      />
    );

    // Table headers
    expect(html).toContain('Passo');
    expect(html).toContain('Sentido');
    expect(html).toContain('Posição da Régua');
    expect(html).toContain('Extensão do Corte');
    expect(html).toContain('Instrução Técnica ao Operador');

    // Steps
    expect(html).toContain('Horizontal ↔');
    expect(html).toContain('Vertical ↕');
    expect(html).toContain('Y = 150.0 mm');
    expect(html).toContain('X = 95.0 mm');
    expect(html).toContain('X = 190.0 mm');
    expect(html).toContain('X: 5.0 → 315.0 mm');
    expect(html).toContain('Y: 5.0 → 150.0 mm');
    expect(html).toContain('1º Corte Horizontal em Y = 150.0 mm');
    expect(html).toContain('2º Corte Vertical em X = 95.0 mm');
    expect(html).toContain('3º Corte Vertical em X = 190.0 mm');
  });

  it('renders warning banner with pinwheel notice and guidance when non-cuttable', () => {
    const html = renderToStaticMarkup(
      <GuillotineModal
        isOpen={true}
        onClose={vi.fn()}
        analysis={mockNonCuttableAnalysis}
        sheetLayout={mockSheetLayout}
      />
    );

    expect(html).toContain('data-testid="guillotine-status-banner-warning"');
    expect(html).toContain('Atenção: Não Cortável em Guilhotina');
    expect(html).toContain('Padrão Pinwheel (Intertravado)');
    expect(html).toContain('Padrão entrelaçado (pinwheel/interlock) detectado');
    expect(html).toContain('Soluções sugeridas para viabilizar a guilhotina:');
    expect(html).toContain('Alinhe as peças em linhas ou colunas regulares');
  });

  it('renders informational empty state when cuttable but 0 cuts needed (single item or empty)', () => {
    const html = renderToStaticMarkup(
      <GuillotineModal
        isOpen={true}
        onClose={vi.fn()}
        analysis={{
          isGuillotineCuttable: true,
          totalCutsNeeded: 0,
          steps: [],
          efficiencyRating: 'ideal',
          message: 'Item único na folha. Nenhum corte de separação necessário.',
        }}
        sheetLayout={mockSheetLayout}
      />
    );

    expect(html).toContain('Nenhum corte de separação necessário');
    expect(html).toContain('Item único na folha. Nenhum corte de separação necessário.');
  });

  it('renders print and close action buttons in footer', () => {
    const html = renderToStaticMarkup(
      <GuillotineModal
        isOpen={true}
        onClose={vi.fn()}
        analysis={mockCuttableAnalysis}
        sheetLayout={mockSheetLayout}
      />
    );

    expect(html).toContain('data-testid="print-guillotine-instructions-btn"');
    expect(html).toContain('Imprimir Instruções de Corte');
    expect(html).toContain('data-testid="close-guillotine-modal-btn"');
    expect(html).toContain('Fechar');
  });
});
