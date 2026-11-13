import type { SheetLayout, SvgExportOptions } from '../types/optimizer';

export type { SvgExportOptions };

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a valid 1:1 physical mm SVG string suitable for direct import
 * into CorelDRAW, Adobe Illustrator, Inkscape, or laser/plotter cutters.
 */
export function generateSvgString(layout: SheetLayout, options?: SvgExportOptions): string {
  const {
    showCropMarks = true,
    cropMarkLengthMm = 4,
    cropMarkOffsetMm = 2,
    showBleed = true,
    bleedMm = 2,
    showLabels = true,
    showDimensions = true,
  } = options ?? {};

  const w = layout.widthMm;
  const h = layout.heightMm;
  const margin = layout.marginMm;
  const usableW = Math.max(0, w - 2 * margin);
  const usableH = Math.max(0, h - 2 * margin);

  const marginGuide =
    margin > 0
      ? `  <!-- Guia de Margem / Pinça -->
  <g id="margin-guide">
    <rect x="${margin.toFixed(2)}" y="${margin.toFixed(2)}" width="${usableW.toFixed(2)}" height="${usableH.toFixed(2)}" fill="none" stroke="#64748b" stroke-width="0.25" stroke-dasharray="2,2" />
    <text x="${(margin + 1.5).toFixed(2)}" y="${(margin + 3.2).toFixed(2)}" font-size="2.6" font-family="sans-serif" fill="#64748b">Margem ${margin}mm</text>
  </g>`
      : '';

  const bleedLayerXml =
    showBleed && bleedMm > 0 && layout.placedItems.length > 0
      ? `  <!-- Linhas de Sangria (Bleed) -->
  <g id="bleed-layer">
${layout.placedItems
  .map(
    (item) =>
      `    <rect id="bleed-${item.index}" x="${(item.x - bleedMm).toFixed(2)}" y="${(item.y - bleedMm).toFixed(2)}" width="${(item.width + 2 * bleedMm).toFixed(2)}" height="${(item.height + 2 * bleedMm).toFixed(2)}" fill="none" stroke="#ef4444" stroke-width="0.15" stroke-dasharray="1.5,1.5" />`
  )
  .join('\n')}
  </g>`
      : '';

  const itemsXml = layout.placedItems
    .map((item) => {
      const fontSize = Math.max(2.5, Math.min(5, Math.min(item.width, item.height) * 0.14));
      const rotationBadge =
        showLabels && item.rotated
          ? `<text x="${(item.x + item.width - 1.5).toFixed(2)}" y="${(item.y + fontSize + 1.2).toFixed(2)}" font-size="${(fontSize * 0.75).toFixed(2)}" font-family="sans-serif" font-weight="bold" fill="#0f172a" text-anchor="end">90°</text>`
          : '';

      let textLabels = '';
      if (showLabels && showDimensions) {
        textLabels =
          item.width > 20 && item.height > 15
            ? `<text x="${(item.x + item.width / 2).toFixed(2)}" y="${(item.y + item.height / 2 - fontSize * 0.4).toFixed(2)}" font-size="${fontSize.toFixed(2)}" font-family="sans-serif" font-weight="600" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">#${item.index} ${escapeXml(item.name)}</text>
             <text x="${(item.x + item.width / 2).toFixed(2)}" y="${(item.y + item.height / 2 + fontSize * 0.8).toFixed(2)}" font-size="${(fontSize * 0.8).toFixed(2)}" font-family="sans-serif" fill="#475569" text-anchor="middle" dominant-baseline="middle">${item.width}×${item.height}mm</text>`
            : `<text x="${(item.x + item.width / 2).toFixed(2)}" y="${(item.y + item.height / 2).toFixed(2)}" font-size="${fontSize.toFixed(2)}" font-family="sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">#${item.index}</text>`;
      } else if (showLabels && !showDimensions) {
        textLabels =
          item.width > 20 && item.height > 15
            ? `<text x="${(item.x + item.width / 2).toFixed(2)}" y="${(item.y + item.height / 2).toFixed(2)}" font-size="${fontSize.toFixed(2)}" font-family="sans-serif" font-weight="600" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">#${item.index} ${escapeXml(item.name)}</text>`
            : `<text x="${(item.x + item.width / 2).toFixed(2)}" y="${(item.y + item.height / 2).toFixed(2)}" font-size="${fontSize.toFixed(2)}" font-family="sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">#${item.index}</text>`;
      } else if (!showLabels && showDimensions) {
        textLabels = `<text x="${(item.x + item.width / 2).toFixed(2)}" y="${(item.y + item.height / 2).toFixed(2)}" font-size="${fontSize.toFixed(2)}" font-family="sans-serif" fill="#475569" text-anchor="middle" dominant-baseline="middle">${item.width}×${item.height}mm</text>`;
      }

      const textGroup = [rotationBadge, textLabels].filter(Boolean).join('\n      ');

      return `    <g id="item-${item.index}" class="placed-item">
      <rect x="${item.x.toFixed(2)}" y="${item.y.toFixed(2)}" width="${item.width.toFixed(2)}" height="${item.height.toFixed(2)}" fill="${item.color}" fill-opacity="0.18" stroke="${item.color}" stroke-width="0.3" rx="0.5" />
      <rect x="${item.x.toFixed(2)}" y="${item.y.toFixed(2)}" width="${item.width.toFixed(2)}" height="${item.height.toFixed(2)}" fill="none" stroke="#0f172a" stroke-width="0.15" />${textGroup ? `\n      ${textGroup}` : ''}
    </g>`;
    })
    .join('\n');

  const cropMarksLayerXml =
    showCropMarks && cropMarkLengthMm > 0 && layout.placedItems.length > 0
      ? `  <!-- Cruzetas / Marcas de Corte (Crop Marks) -->
  <g id="crop-marks" stroke="#0f172a" stroke-width="0.18">
${layout.placedItems
  .map((item) => {
    const xL = item.x;
    const xR = item.x + item.width;
    const yT = item.y;
    const yB = item.y + item.height;
    const o = cropMarkOffsetMm;
    const L = cropMarkLengthMm;

    return `    <g id="crop-marks-${item.index}" class="crop-mark-group">
      <!-- Top-Left -->
      <line x1="${xL.toFixed(2)}" y1="${(yT - o - L).toFixed(2)}" x2="${xL.toFixed(2)}" y2="${(yT - o).toFixed(2)}" />
      <line x1="${(xL - o - L).toFixed(2)}" y1="${yT.toFixed(2)}" x2="${(xL - o).toFixed(2)}" y2="${yT.toFixed(2)}" />
      <!-- Top-Right -->
      <line x1="${xR.toFixed(2)}" y1="${(yT - o - L).toFixed(2)}" x2="${xR.toFixed(2)}" y2="${(yT - o).toFixed(2)}" />
      <line x1="${(xR + o).toFixed(2)}" y1="${yT.toFixed(2)}" x2="${(xR + o + L).toFixed(2)}" y2="${yT.toFixed(2)}" />
      <!-- Bottom-Left -->
      <line x1="${xL.toFixed(2)}" y1="${(yB + o).toFixed(2)}" x2="${xL.toFixed(2)}" y2="${(yB + o + L).toFixed(2)}" />
      <line x1="${(xL - o - L).toFixed(2)}" y1="${yB.toFixed(2)}" x2="${(xL - o).toFixed(2)}" y2="${yB.toFixed(2)}" />
      <!-- Bottom-Right -->
      <line x1="${xR.toFixed(2)}" y1="${(yB + o).toFixed(2)}" x2="${xR.toFixed(2)}" y2="${(yB + o + L).toFixed(2)}" />
      <line x1="${(xR + o).toFixed(2)}" y1="${yB.toFixed(2)}" x2="${(xR + o + L).toFixed(2)}" y2="${yB.toFixed(2)}" />
    </g>`;
  })
  .join('\n')}
  </g>`
      : '';

  const isShortGrain = layout.grainDirection === 'short';
  const grainMeta = `Sentido da fibra: ${isShortGrain ? 'Fibra Curta (Short Grain ↔)' : 'Fibra Longa (Long Grain ↕)'}`;
  const grainLabel = isShortGrain ? 'Fibra: Curta ↔' : 'Fibra: Longa ↕';

  const grainX = Math.max(2, w - Math.max(margin, 2) - 42);
  const grainY = Math.max(5, margin > 0 ? margin + 3.2 : 5);
  const arrowX = grainX + 28;
  const arrowY = grainY - 0.8;

  const arrowPath = isShortGrain
    ? `M ${(arrowX - 3.5).toFixed(2)} ${arrowY.toFixed(2)} L ${(arrowX + 3.5).toFixed(2)} ${arrowY.toFixed(2)} M ${(arrowX - 2).toFixed(2)} ${(arrowY - 1).toFixed(2)} L ${(arrowX - 3.5).toFixed(2)} ${arrowY.toFixed(2)} L ${(arrowX - 2).toFixed(2)} ${(arrowY + 1).toFixed(2)} M ${(arrowX + 2).toFixed(2)} ${(arrowY - 1).toFixed(2)} L ${(arrowX + 3.5).toFixed(2)} ${arrowY.toFixed(2)} L ${(arrowX + 2).toFixed(2)} ${(arrowY + 1).toFixed(2)}`
    : `M ${arrowX.toFixed(2)} ${(arrowY - 3.5).toFixed(2)} L ${arrowX.toFixed(2)} ${(arrowY + 3.5).toFixed(2)} M ${(arrowX - 1).toFixed(2)} ${(arrowY - 2).toFixed(2)} L ${arrowX.toFixed(2)} ${(arrowY - 3.5).toFixed(2)} L ${(arrowX + 1).toFixed(2)} ${(arrowY - 2).toFixed(2)} M ${(arrowX - 1).toFixed(2)} ${(arrowY + 2).toFixed(2)} L ${arrowX.toFixed(2)} ${(arrowY + 3.5).toFixed(2)} L ${(arrowX + 1).toFixed(2)} ${(arrowY + 2).toFixed(2)}`;

  const grainGuide = `  <!-- Sentido da Fibra (Grain Direction) -->
  <g id="grain-direction" class="no-print">
    <text x="${grainX.toFixed(2)}" y="${grainY.toFixed(2)}" font-size="2.4" font-family="sans-serif" fill="#94a3b8">${grainLabel}</text>
    <path d="${arrowPath}" stroke="#94a3b8" stroke-width="0.25" fill="none" />
  </g>`;

  const sections: string[] = [
    `  <!-- Fundo da Folha de Papel -->\n  <g id="sheet-background">\n    <rect x="0" y="0" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="#ffffff" stroke="#94a3b8" stroke-width="0.2" />\n  </g>`,
  ];

  if (marginGuide) {
    sections.push(marginGuide);
  }

  sections.push(grainGuide);

  if (bleedLayerXml) {
    sections.push(bleedLayerXml);
  }

  sections.push(`  <!-- Elementos Acomodados -->\n  <g id="items-layer">\n${itemsXml}\n  </g>`);

  if (cropMarksLayerXml) {
    sections.push(cropMarksLayerXml);
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">
  <title>OptiPrint - Folha ${layout.sheetNumber} (${w}x${h}mm)</title>
  <desc>Gerado pelo OptiPrint. Total de peças: ${layout.placedItems.length}. Aproveitamento: ${layout.utilizationPercent.toFixed(1)}%. ${grainMeta}</desc>

${sections.join('\n\n')}
</svg>
`;
}

/**
 * Initiates an in-browser download of the generated 1:1 physical SVG file.
 */
export function downloadSheetSvg(
  layout: SheetLayout,
  customFilename?: string,
  options?: SvgExportOptions
): void {
  const svgContent = generateSvgString(layout, options);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const filename =
    customFilename ||
    `folha-${layout.sheetNumber}-${layout.widthMm}x${layout.heightMm}mm-${layout.placedItems.length}pcs.svg`;

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
