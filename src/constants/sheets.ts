import type { ItemSpec, SheetConfig, SheetPreset, SheetPresetId } from '../types/optimizer';

export interface SheetPresetGroup {
  category: string;
  items: SheetPreset[];
}

export const SHEET_PRESET_GROUPS: SheetPresetGroup[] = [
  {
    category: 'Digital / SRA',
    items: [
      {
        id: 'SRA3',
        name: 'SRA3',
        description: '320 × 450 mm',
        widthMm: 320,
        heightMm: 450,
        category: 'Digital / SRA',
      },
      {
        id: 'SRA4',
        name: 'SRA4',
        description: '225 × 320 mm',
        widthMm: 225,
        heightMm: 320,
        category: 'Digital / SRA',
      },
      {
        id: 'SUPER_B',
        name: 'Super B',
        description: '330 × 483 mm',
        widthMm: 330,
        heightMm: 483,
        category: 'Digital / SRA',
      },
    ],
  },
  {
    category: 'Série ISO A',
    items: [
      {
        id: 'A4',
        name: 'A4',
        description: '210 × 297 mm',
        widthMm: 210,
        heightMm: 297,
        category: 'Série ISO A',
      },
      {
        id: 'A3',
        name: 'A3',
        description: '297 × 420 mm',
        widthMm: 297,
        heightMm: 420,
        category: 'Série ISO A',
      },
      {
        id: 'A3_PLUS',
        name: 'A3+ / Super A3',
        description: '329 × 483 mm',
        widthMm: 329,
        heightMm: 483,
        category: 'Série ISO A',
      },
      {
        id: 'A5',
        name: 'A5',
        description: '148 × 210 mm',
        widthMm: 148,
        heightMm: 210,
        category: 'Série ISO A',
      },
      {
        id: 'A6',
        name: 'A6',
        description: '105 × 148 mm',
        widthMm: 105,
        heightMm: 148,
        category: 'Série ISO A',
      },
      {
        id: 'A2',
        name: 'A2',
        description: '420 × 594 mm',
        widthMm: 420,
        heightMm: 594,
        category: 'Série ISO A',
      },
      {
        id: 'A1',
        name: 'A1',
        description: '594 × 841 mm',
        widthMm: 594,
        heightMm: 841,
        category: 'Série ISO A',
      },
      {
        id: 'A0',
        name: 'A0',
        description: '841 × 1189 mm',
        widthMm: 841,
        heightMm: 1189,
        category: 'Série ISO A',
      },
    ],
  },
  {
    category: 'Gráfica Offset (Brasil)',
    items: [
      {
        id: 'OFFSET_66X96',
        name: 'Folha Inteira 66×96 cm',
        description: '660 × 960 mm',
        widthMm: 660,
        heightMm: 960,
        category: 'Gráfica Offset (Brasil)',
      },
      {
        id: 'OFFSET_48X66',
        name: 'Meia Folha 48×66 cm',
        description: '480 × 660 mm',
        widthMm: 480,
        heightMm: 660,
        category: 'Gráfica Offset (Brasil)',
      },
      {
        id: 'OFFSET_64X88',
        name: 'Folha 64×88 cm',
        description: '640 × 880 mm',
        widthMm: 640,
        heightMm: 880,
        category: 'Gráfica Offset (Brasil)',
      },
      {
        id: 'OFFSET_70X100',
        name: 'Folha 70×100 cm',
        description: '700 × 1000 mm',
        widthMm: 700,
        heightMm: 1000,
        category: 'Gráfica Offset (Brasil)',
      },
      {
        id: 'OFFSET_CARTAO_77X110',
        name: 'Cartão 77×110 cm',
        description: '770 × 1100 mm',
        widthMm: 770,
        heightMm: 1100,
        category: 'Gráfica Offset (Brasil)',
      },
    ],
  },
  {
    category: 'Série ISO B',
    items: [
      {
        id: 'B3',
        name: 'B3',
        description: '353 × 500 mm',
        widthMm: 353,
        heightMm: 500,
        category: 'Série ISO B',
      },
      {
        id: 'B4',
        name: 'B4',
        description: '250 × 353 mm',
        widthMm: 250,
        heightMm: 353,
        category: 'Série ISO B',
      },
      {
        id: 'B5',
        name: 'B5',
        description: '176 × 250 mm',
        widthMm: 176,
        heightMm: 250,
        category: 'Série ISO B',
      },
    ],
  },
  {
    category: 'EUA / Outros',
    items: [
      {
        id: 'US_LETTER',
        name: 'Carta / Letter',
        description: '215.9 × 279.4 mm',
        widthMm: 215.9,
        heightMm: 279.4,
        category: 'EUA / Outros',
      },
      {
        id: 'US_LEGAL',
        name: 'Ofício / Legal',
        description: '215.9 × 355.6 mm',
        widthMm: 215.9,
        heightMm: 355.6,
        category: 'EUA / Outros',
      },
      {
        id: 'US_TABLOID',
        name: 'Tabloide / Ledger',
        description: '279.4 × 431.8 mm',
        widthMm: 279.4,
        heightMm: 431.8,
        category: 'EUA / Outros',
      },
    ],
  },
];

export const BUILTIN_SHEET_PRESETS: SheetPreset[] = SHEET_PRESET_GROUPS.flatMap(
  (group) => group.items
);

export const SHEET_PRESETS: Record<string, SheetPreset> = BUILTIN_SHEET_PRESETS.reduce<
  Record<string, SheetPreset>
>((acc, preset) => {
  acc[preset.id] = preset;
  return acc;
}, {});

export const SHEET_PRESET_ORDER: SheetPresetId[] = BUILTIN_SHEET_PRESETS.map((p) => p.id);

export const ITEM_COLORS: string[] = [
  '#2563eb', // Royal Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Crimson
  '#7c3aed', // Violet
  '#0891b2', // Cyan
  '#db2777', // Pink
  '#4f46e5', // Indigo
];

export const DEFAULT_SHEET_CONFIG: SheetConfig = {
  presetId: 'A3',
  widthMm: 297,
  heightMm: 420,
  marginMm: 5,
  spacingMm: 2,
  orientation: 'portrait',
  grainDirection: 'long',
};

export interface SampleElementPreset {
  label: string;
  name: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
}

export const SAMPLE_ELEMENT_PRESETS: SampleElementPreset[] = [
  {
    label: 'Cartão de Visita (90 × 50 mm)',
    name: 'Cartão de Visita',
    widthMm: 90,
    heightMm: 50,
    quantity: 40,
  },
  {
    label: 'Adesivo Quadrado (70 × 70 mm)',
    name: 'Adesivo 7×7',
    widthMm: 70,
    heightMm: 70,
    quantity: 24,
  },
  {
    label: 'Panfleto A6 (105 × 148 mm)',
    name: 'Panfleto A6',
    widthMm: 105,
    heightMm: 148,
    quantity: 16,
  },
  {
    label: 'Tag / Etiqueta (55 × 85 mm)',
    name: 'Tag Produto',
    widthMm: 55,
    heightMm: 85,
    quantity: 30,
  },
];

export const DEFAULT_MULTI_ITEMS: ItemSpec[] = [
  {
    id: 'item-1',
    name: 'Cartão de Visita',
    widthMm: 90,
    heightMm: 50,
    quantity: 20,
    color: ITEM_COLORS[0],
    allowRotation: true,
  },
  {
    id: 'item-2',
    name: 'Adesivo Marca',
    widthMm: 60,
    heightMm: 60,
    quantity: 12,
    color: ITEM_COLORS[1],
    allowRotation: true,
  },
];
