import { describe, expect, it, vi } from 'vitest';
import { computeQuickYield } from '../engine/packer';
import type { SheetConfig } from '../types/optimizer';
import { downloadSheetSvg, generateSvgString } from './exportSvg';

describe('generateSvgString', () => {
  const sampleConfig: SheetConfig = {
    presetId: 'A4',
    widthMm: 210,
    heightMm: 297,
    marginMm: 5,
    spacingMm: 2,
    orientation: 'portrait',
  };

  it('creates a valid 1:1 physical mm SVG with required viewBox and layers with default options', () => {
    const yieldRes = computeQuickYield(sampleConfig, 90, 50, 'Cartão');
    const svg = generateSvgString(yieldRes.mixed.layout);

    expect(svg).toContain('width="210mm"');
    expect(svg).toContain('height="297mm"');
    expect(svg).toContain('viewBox="0 0 210 297"');
    expect(svg).toContain('id="sheet-background"');
    expect(svg).toContain('id="margin-guide"');
    expect(svg).toContain('id="grain-direction"');
    expect(svg).toContain('class="no-print"');
    expect(svg).toContain('Sentido da fibra: Fibra Longa (Long Grain ↕)');
    expect(svg).toContain('id="items-layer"');
    expect(svg).toContain('Cartão');
    expect(svg).toContain('#1');
    expect(svg).toContain('#11'); // 11 items in A4 90x50 mixed

    // Cruzetas & Bleed default layers
    expect(svg).toContain('id="bleed-layer"');
    expect(svg).toContain('id="bleed-1"');
    expect(svg).toContain('stroke="#ef4444"');
    expect(svg).toContain('stroke-dasharray="1.5,1.5"');

    expect(svg).toContain('id="crop-marks"');
    expect(svg).toContain('id="crop-marks-1"');
    expect(svg).toContain('stroke="#0f172a"');
    expect(svg).toContain('stroke-width="0.18"');
  });

  it('omits bleed-layer when showBleed is false or bleedMm is 0', () => {
    const yieldRes = computeQuickYield(sampleConfig, 90, 50, 'Cartão');

    const svgWithoutBleed = generateSvgString(yieldRes.mixed.layout, { showBleed: false });
    expect(svgWithoutBleed).not.toContain('id="bleed-layer"');
    expect(svgWithoutBleed).toContain('id="crop-marks"');

    const svgWithZeroBleed = generateSvgString(yieldRes.mixed.layout, { bleedMm: 0 });
    expect(svgWithZeroBleed).not.toContain('id="bleed-layer"');
  });

  it('omits crop-marks layer when showCropMarks is false or cropMarkLengthMm is 0', () => {
    const yieldRes = computeQuickYield(sampleConfig, 90, 50, 'Cartão');

    const svgWithoutCrops = generateSvgString(yieldRes.mixed.layout, { showCropMarks: false });
    expect(svgWithoutCrops).not.toContain('id="crop-marks"');
    expect(svgWithoutCrops).toContain('id="bleed-layer"');

    const svgWithZeroCropLength = generateSvgString(yieldRes.mixed.layout, { cropMarkLengthMm: 0 });
    expect(svgWithZeroCropLength).not.toContain('id="crop-marks"');
  });

  it('calculates custom bleed and crop mark line coordinates correctly', () => {
    const yieldRes = computeQuickYield(sampleConfig, 90, 50, 'Cartão');
    const layout = yieldRes.mixed.layout;
    const firstItem = layout.placedItems[0]; // at x=5, y=5, w=90, h=50

    const svg = generateSvgString(layout, {
      bleedMm: 3,
      cropMarkOffsetMm: 1.5,
      cropMarkLengthMm: 5,
    });

    // Bleed box: x = item.x - 3, y = item.y - 3, w = item.width + 6, h = item.height + 6
    const expectedBleedX = (firstItem.x - 3).toFixed(2);
    const expectedBleedY = (firstItem.y - 3).toFixed(2);
    const expectedBleedW = (firstItem.width + 6).toFixed(2);
    const expectedBleedH = (firstItem.height + 6).toFixed(2);

    expect(svg).toContain(
      `id="bleed-${firstItem.index}" x="${expectedBleedX}" y="${expectedBleedY}" width="${expectedBleedW}" height="${expectedBleedH}"`
    );

    // Top-Left crop marks:
    // V line: (item.x, item.y - 1.5 - 5) to (item.x, item.y - 1.5)
    // H line: (item.x - 1.5 - 5, item.y) to (item.x - 1.5, item.y)
    const expectedVLineY1 = (firstItem.y - 6.5).toFixed(2);
    const expectedVLineY2 = (firstItem.y - 1.5).toFixed(2);
    expect(svg).toContain(
      `line x1="${firstItem.x.toFixed(2)}" y1="${expectedVLineY1}" x2="${firstItem.x.toFixed(2)}" y2="${expectedVLineY2}"`
    );

    const expectedHLineX1 = (firstItem.x - 6.5).toFixed(2);
    const expectedHLineX2 = (firstItem.x - 1.5).toFixed(2);
    expect(svg).toContain(
      `line x1="${expectedHLineX1}" y1="${firstItem.y.toFixed(2)}" x2="${expectedHLineX2}" y2="${firstItem.y.toFixed(2)}"`
    );
  });

  it('respects showLabels and showDimensions flags', () => {
    const yieldRes = computeQuickYield(sampleConfig, 90, 50, 'Etiqueta');
    const layout = yieldRes.mixed.layout;

    const svgNoLabels = generateSvgString(layout, { showLabels: false, showDimensions: false });
    expect(svgNoLabels).not.toContain('Etiqueta');
    expect(svgNoLabels).not.toContain('90×50mm');

    const svgOnlyDimensions = generateSvgString(layout, { showLabels: false, showDimensions: true });
    expect(svgOnlyDimensions).not.toContain('Etiqueta');
    expect(svgOnlyDimensions).toContain('90×50mm');

    const svgOnlyLabels = generateSvgString(layout, { showLabels: true, showDimensions: false });
    expect(svgOnlyLabels).toContain('Etiqueta');
    expect(svgOnlyLabels).not.toContain('90×50mm');
  });

  it('records correct grainDirection in SVG <desc> and margin notation for both long and short grain', () => {
    const yieldResLong = computeQuickYield({ ...sampleConfig, grainDirection: 'long' }, 90, 50, 'Cartão');
    const svgLong = generateSvgString(yieldResLong.normal.layout);
    expect(svgLong).toContain('Sentido da fibra: Fibra Longa (Long Grain ↕)');
    expect(svgLong).toContain('id="grain-direction"');
    expect(svgLong).toContain('Fibra: Longa ↕');

    const yieldResShort = computeQuickYield({ ...sampleConfig, grainDirection: 'short' }, 90, 50, 'Cartão');
    const svgShort = generateSvgString(yieldResShort.normal.layout);
    expect(svgShort).toContain('Sentido da fibra: Fibra Curta (Short Grain ↔)');
    expect(svgShort).toContain('id="grain-direction"');
    expect(svgShort).toContain('Fibra: Curta ↔');
  });

  it('omits bleed and crop-marks gracefully when layout has 0 placed items', () => {
    const emptyLayout = {
      sheetNumber: 1,
      widthMm: 210,
      heightMm: 297,
      marginMm: 5,
      spacingMm: 2,
      placedItems: [],
      usedAreaMm2: 0,
      usableAreaMm2: 200 * 287,
      totalAreaMm2: 210 * 297,
      utilizationPercent: 0,
      wastePercent: 100,
    };

    const svg = generateSvgString(emptyLayout);
    expect(svg).not.toContain('id="bleed-layer"');
    expect(svg).not.toContain('id="crop-marks"');
    expect(svg).toContain('id="items-layer"');
  });
});

describe('downloadSheetSvg', () => {
  it('triggers browser download with blob and anchor element', () => {
    const sampleConfig: SheetConfig = {
      presetId: 'A4',
      widthMm: 210,
      heightMm: 297,
      marginMm: 5,
      spacingMm: 2,
      orientation: 'portrait',
    };
    const yieldRes = computeQuickYield(sampleConfig, 90, 50, 'Cartão');

    const clickMock = vi.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: clickMock,
    };

    const appendChildMock = vi.fn();
    const removeChildMock = vi.fn();

    const mockDocument = {
      createElement: vi.fn().mockReturnValue(mockAnchor),
      body: {
        appendChild: appendChildMock,
        removeChild: removeChildMock,
      },
    };

    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();

    vi.stubGlobal('document', mockDocument);
    vi.stubGlobal('URL', {
      ...globalThis.URL,
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });

    try {
      downloadSheetSvg(yieldRes.mixed.layout, 'custom-test.svg', { showBleed: false });

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('custom-test.svg');
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(clickMock).toHaveBeenCalled();
      expect(appendChildMock).toHaveBeenCalledWith(mockAnchor);
      expect(removeChildMock).toHaveBeenCalledWith(mockAnchor);
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
