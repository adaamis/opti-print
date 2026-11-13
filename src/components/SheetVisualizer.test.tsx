import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { GuillotineAnalysis, SheetLayout } from '../types/optimizer';
import { SheetVisualizer } from './SheetVisualizer';

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
      name: 'Cartão de Visita',
      color: '#0d9488',
      index: 0,
    },
    {
      x: 97,
      y: 5,
      width: 90,
      height: 50,
      rotated: true,
      itemId: 'card-2',
      name: 'Etiqueta Rotacionada',
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

const mockLayoutSheet2: SheetLayout = {
  ...mockLayout,
  sheetNumber: 2,
};

describe('SheetVisualizer component', () => {
  it('renders empty fallback when no layout is available', () => {
    const html = renderToStaticMarkup(
      <SheetVisualizer
        layouts={[]}
        activeSheetIndex={0}
        onSelectSheet={vi.fn()}
        unit="mm"
      />
    );

    expect(html).toContain('Nenhuma folha gerada');
    expect(html).toContain('Configure as medidas da folha');
  });

  it('renders interactive canvas, paper card, items, and toolbar buttons', () => {
    const html = renderToStaticMarkup(
      <SheetVisualizer
        layouts={[mockLayout]}
        activeSheetIndex={0}
        onSelectSheet={vi.fn()}
        unit="mm"
      />
    );

    // Toolbar buttons
    expect(html).toContain('Guias de Corte');
    expect(html).toContain('Cruzetas');
    expect(html).toContain('Sangria');
    expect(html).toContain('Etiquetas');

    // Zoom controls
    expect(html).toContain('100%');

    // Canvas SVG and dimensions
    expect(html).toContain('viewBox="0 0 320 450"');
    expect(html).toContain('Dimensões da Folha: 320 × 450 mm');
    expect(html).toContain('Margem: 5 mm');
    expect(html).toContain('Espaçamento: 2 mm');

    // Items
    expect(html).toContain('#0 Cartão de Visita');
    expect(html).toContain('90×50mm');
    expect(html).toContain('#1 Etiqueta Rotacionada');
    expect(html).toContain('90°');
  });

  it('renders multi-sheet pagination tabs when multiple layouts exist', () => {
    const onSelectSheet = vi.fn();
    const html = renderToStaticMarkup(
      <SheetVisualizer
        layouts={[mockLayout, mockLayoutSheet2]}
        activeSheetIndex={0}
        onSelectSheet={onSelectSheet}
        unit="mm"
      />
    );

    expect(html).toContain('Folha 1');
    expect(html).toContain('Folha 2');
  });

  describe('Feature #3: Cruzetas de Corte (Crop Marks)', () => {
    it('renders crop marks layer and 8 lines per item by default (offset 2mm, length 4mm)', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
        />
      );

      // Crop marks layer exists
      expect(html).toContain('id="visual-crop-marks"');
      expect(html).toContain('stroke="#0f172a"');
      expect(html).toContain('stroke-width="0.25"');

      // 2 placed items = 2 crop-mark-group elements
      const groupMatches = html.match(/class="crop-mark-group"/g);
      expect(groupMatches).toHaveLength(2);

      // Item 0 (x: 5, y: 5, w: 90, h: 50):
      // Top-Left corner: xL=5, yT=5. Lines:
      // x1="5" y1="-1" x2="5" y2="3" (5 - 2 - 4 = -1, 5 - 2 = 3)
      // x1="-1" y1="5" x2="3" y2="5"
      expect(html).toContain('x1="5" y1="-1" x2="5" y2="3"');
      expect(html).toContain('x1="-1" y1="5" x2="3" y2="5"');

      // Top-Right corner: xR=95, yT=5. Lines:
      // x1="95" y1="-1" x2="95" y2="3"
      // x1="97" y1="5" x2="101" y2="5"
      expect(html).toContain('x1="95" y1="-1" x2="95" y2="3"');
      expect(html).toContain('x1="97" y1="5" x2="101" y2="5"');

      // Bottom-Left corner: xL=5, yB=55. Lines:
      // x1="5" y1="57" x2="5" y2="61"
      // x1="-1" y1="55" x2="3" y2="55"
      expect(html).toContain('x1="5" y1="57" x2="5" y2="61"');
      expect(html).toContain('x1="-1" y1="55" x2="3" y2="55"');

      // Bottom-Right corner: xR=95, yB=55. Lines:
      // x1="95" y1="57" x2="95" y2="61"
      // x1="97" y1="55" x2="101" y2="55"
      expect(html).toContain('x1="95" y1="57" x2="95" y2="61"');
      expect(html).toContain('x1="97" y1="55" x2="101" y2="55"');
    });

    it('hides crop marks when showCropMarks or initialShowCropMarks is false', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          initialShowCropMarks={false}
        />
      );

      expect(html).not.toContain('id="visual-crop-marks"');
      expect(html).not.toContain('class="crop-mark-group"');
    });

    it('can be controlled via showCropMarks prop', () => {
      const htmlDisabled = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          showCropMarks={false}
        />
      );
      expect(htmlDisabled).not.toContain('id="visual-crop-marks"');

      const htmlEnabled = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          showCropMarks={true}
        />
      );
      expect(htmlEnabled).toContain('id="visual-crop-marks"');
    });
  });

  describe('Feature #3: Sangria (Bleed Guides)', () => {
    it('renders bleed rectangles around each placed item when active', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          initialShowBleed={true}
        />
      );

      expect(html).toContain('id="visual-bleed-layer"');
      expect(html).toContain('stroke="#ef4444"');
      expect(html).toContain('stroke-dasharray="2,2"');
      expect(html).toContain('stroke-width="0.2"');

      // Item 0 (x: 5, y: 5, w: 90, h: 50) with 2mm bleed:
      // x = 5 - 2 = 3, y = 5 - 2 = 3, width = 90 + 4 = 94, height = 50 + 4 = 54
      expect(html).toContain('x="3" y="3" width="94" height="54"');

      // Item 1 (x: 97, y: 5, w: 90, h: 50) with 2mm bleed:
      // x = 97 - 2 = 95, y = 5 - 2 = 3, width = 94, height = 54
      expect(html).toContain('x="95" y="3" width="94" height="54"');
    });

    it('hides bleed guides when initialShowBleed or showBleed is false', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          initialShowBleed={false}
        />
      );

      expect(html).not.toContain('id="visual-bleed-layer"');
      expect(html).not.toContain('data-testid="bleed-rect"');
    });

    it('can be controlled via showBleed prop', () => {
      const htmlDisabled = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          showBleed={false}
        />
      );
      expect(htmlDisabled).not.toContain('id="visual-bleed-layer"');

      const htmlEnabled = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          showBleed={true}
        />
      );
      expect(htmlEnabled).toContain('id="visual-bleed-layer"');
    });
  });

  describe('Canvas footer status badge & legend', () => {
    it('displays full combined badge "Cruzetas (4mm / offset 2mm) · Sangria (2mm)" when both are active', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          initialShowCropMarks={true}
          initialShowBleed={true}
        />
      );

      expect(html).toContain('Cruzetas (4mm / offset 2mm) · Sangria (2mm)');
    });

    it('displays only Cruzetas status when Sangria is off', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          initialShowCropMarks={true}
          initialShowBleed={false}
        />
      );

      expect(html).toContain('Cruzetas (4mm / offset 2mm)');
      expect(html).not.toContain('Sangria (2mm)');
    });

    it('displays only Sangria status when Cruzetas is off', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          initialShowCropMarks={false}
          initialShowBleed={true}
        />
      );

      expect(html).toContain('Sangria (2mm)');
      expect(html).not.toContain('Cruzetas (4mm / offset 2mm)');
    });

    it('hides badge completely when both guides are off', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          initialShowCropMarks={false}
          initialShowBleed={false}
        />
      );

      expect(html).not.toContain('Cruzetas (4mm / offset 2mm)');
      expect(html).not.toContain('Sangria (2mm)');
      expect(html).not.toContain('data-testid="guides-badge"');
    });
  });

  describe('Feature #4: Sentido da Fibra do Papel (Grain Direction)', () => {
    it('renders long grain direction indicator in footer and SVG canvas by default', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
        />
      );

      // Footer indicator
      expect(html).toContain('data-testid="footer-grain-direction"');
      expect(html).toContain('Fibra: Longa ↕');

      // SVG watermark / margin notation
      expect(html).toContain('id="visual-grain-direction"');
      expect(html).toContain('data-testid="visual-grain-direction"');
    });

    it('renders short grain direction indicator in footer and SVG canvas when grainDirection is short', () => {
      const shortGrainLayout: SheetLayout = {
        ...mockLayout,
        grainDirection: 'short',
      };

      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[shortGrainLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
        />
      );

      // Footer indicator
      expect(html).toContain('data-testid="footer-grain-direction"');
      expect(html).toContain('Fibra: Curta ↔');

      // SVG watermark / margin notation
      expect(html).toContain('id="visual-grain-direction"');
      expect(html).toContain('data-testid="visual-grain-direction"');
    });
  });

  describe('Feature #5: Sequenciador de Corte de Guilhotina (Guillotine Cut Feasibility & Step-by-Step Sequence)', () => {
    const mockGuillotineAnalysis: GuillotineAnalysis = {
      isGuillotineCuttable: true,
      totalCutsNeeded: 2,
      steps: [
        {
          stepNumber: 1,
          direction: 'horizontal',
          coordinateMm: 120,
          cutStartMm: 5,
          cutEndMm: 315,
          blockBounds: { x: 5, y: 5, width: 310, height: 440 },
          description: '1º Corte Horizontal em Y = 120.0 mm',
        },
        {
          stepNumber: 2,
          direction: 'vertical',
          coordinateMm: 96,
          cutStartMm: 5,
          cutEndMm: 120,
          blockBounds: { x: 5, y: 5, width: 310, height: 115 },
          description: '2º Corte Vertical em X = 96.0 mm',
        },
      ],
      efficiencyRating: 'ideal',
      message: 'Layout 100% guilhotinável em 2 cortes lineares sequenciais.',
    };

    it('renders guillotine toggle button in top toolbar with Scissors icon', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          guillotineAnalysis={mockGuillotineAnalysis}
        />
      );

      expect(html).toContain('data-testid="toggle-guillotine-cuts-btn"');
      expect(html).toContain('Guilhotina');
    });

    it('renders viability badge and "Ver Passo a Passo" button when analysis is present', () => {
      const onOpenModal = vi.fn();
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          guillotineAnalysis={mockGuillotineAnalysis}
          onOpenGuillotineModal={onOpenModal}
        />
      );

      expect(html).toContain('data-testid="guillotine-viability-badge"');
      expect(html).toContain('Guilhotinável (2 cortes)');
      expect(html).toContain('data-testid="open-guillotine-modal-btn"');
      expect(html).toContain('Ver Passo a Passo');

      // Also in footer
      expect(html).toContain('data-testid="footer-guillotine-status"');
      expect(html).toContain('Guilhotina: 2 cortes');
    });

    it('renders non-guillotine badge when sheet has pinwheel pattern', () => {
      const nonCuttable: GuillotineAnalysis = {
        isGuillotineCuttable: false,
        totalCutsNeeded: 0,
        steps: [],
        efficiencyRating: 'non-guillotine',
        message: 'Layout não guilhotinável. Padrão entrelaçado detectado.',
      };

      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          guillotineAnalysis={nonCuttable}
        />
      );

      expect(html).toContain('data-testid="guillotine-viability-badge"');
      expect(html).toContain('Não Guilhotinável (Pinwheel)');
      expect(html).toContain('Guilhotina: Não viável (Pinwheel)');
    });

    it('does not render guillotine cut lines when showGuillotineCuts is false', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          guillotineAnalysis={mockGuillotineAnalysis}
          initialShowGuillotineCuts={false}
        />
      );

      expect(html).not.toContain('id="visual-guillotine-cuts"');
      expect(html).not.toContain('data-testid="guillotine-cut-step"');
    });

    it('renders numbered dashed cut lines and circular badges when showGuillotineCuts is true', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          guillotineAnalysis={mockGuillotineAnalysis}
          initialShowGuillotineCuts={true}
        />
      );

      expect(html).toContain('id="visual-guillotine-cuts"');
      expect(html).toContain('data-testid="visual-guillotine-cuts"');
      expect(html).toContain('data-testid="guillotine-cut-step"');

      // Line attributes specified in requirements: stroke="#6366f1" stroke-dasharray="3,2"
      expect(html).toContain('stroke="#6366f1"');
      expect(html).toContain('stroke-dasharray="3,2"');

      // Numbered badges for step 1 and step 2
      expect(html).toContain('>1</text>');
      expect(html).toContain('>2</text>');
    });
  });

  describe('Interactive Drag and Pin items', () => {
    it('renders pinned badge on placed items when isPinned is true and displays Unpin All button', () => {
      const layoutWithPin: SheetLayout = {
        ...mockLayout,
        placedItems: [
          {
            ...mockLayout.placedItems[0],
            isPinned: true,
          },
          mockLayout.placedItems[1],
        ],
      };

      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[layoutWithPin]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          onResetPins={vi.fn()}
        />
      );

      // Pinned badge for item 0
      expect(html).toContain('data-testid="item-pinned-badge-0"');
      expect(html).toContain('📌');

      // Unpin All toolbar button
      expect(html).toContain('data-testid="unpin-all-btn"');
      expect(html).toContain('Desafixar Todos (1)');
    });
  });

  describe('Guillotine cut requirement toggle in toolbar', () => {
    it('renders toggle button when onToggleGuillotineRequired is provided', () => {
      const onToggle = vi.fn();
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          guillotineRequired={true}
          onToggleGuillotineRequired={onToggle}
        />
      );

      expect(html).toContain('data-testid="toggle-guillotine-required"');
      expect(html).toContain('Exigir Guilhotina');
      expect(html).toContain('data-testid="guillotine-required-checkbox"');
      expect(html).toContain('checked=""');
    });

    it('renders unchecked state when guillotineRequired is false', () => {
      const onToggle = vi.fn();
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
          guillotineRequired={false}
          onToggleGuillotineRequired={onToggle}
        />
      );

      expect(html).toContain('data-testid="toggle-guillotine-required"');
      expect(html).toContain('Exigir Guilhotina');
      expect(html).not.toMatch(/data-testid="guillotine-required-checkbox"[^>]*checked/);
    });
  });

  describe('Dark Mode Studio (Folha Escura / Estúdio Gráfico)', () => {
    it('renders studio dark styling classes for sheet canvas, substrate, items and guides', () => {
      const html = renderToStaticMarkup(
        <SheetVisualizer
          layouts={[mockLayout]}
          activeSheetIndex={0}
          onSelectSheet={vi.fn()}
          unit="mm"
        />
      );

      // Canvas backdrop has dark studio bg
      expect(html).toContain('dark:bg-[#0A0F1D]');

      // Scaled paper card has dark substrate and elevation ring
      expect(html).toContain('dark:bg-[#121B2D]');
      expect(html).toContain('dark:ring-[#2B3B5C]');

      // SVG paper rect has dark fill class
      expect(html).toContain('class="fill-white dark:fill-[#121B2D]"');

      // Margin guides have dark mode stroke and fill
      expect(html).toContain('dark:stroke-slate-500');
      expect(html).toContain('dark:fill-slate-400');

      // Cut outline has dark mode contrast stroke
      expect(html).toContain('dark:stroke-slate-300');

      // 90° badge has dark mode fill and text
      expect(html).toContain('dark:fill-slate-700');
      expect(html).toContain('dark:fill-slate-100');

      // Item dimensions label has dark mode fill
      expect(html).toContain('dark:fill-slate-300');

      // Crop marks group has dark mode stroke
      expect(html).toContain('dark:stroke-slate-400');
    });
  });
});
