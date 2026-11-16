import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STORAGE_KEY,
  formatCurrency,
  formatNumber,
  getLanguage,
  getLocalizedCategory,
  getLocalizedPresetItemName,
  getLocalizedSamplePresetLabel,
  getLocalizedSheetPresetName,
  interpolate,
  pluralize,
  resetLanguageForTesting,
  setLanguage,
  subscribeLanguage,
  t,
} from './index';
import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';

function flattenKeys(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value, fullKey));
    } else if (typeof value === 'string') {
      result[fullKey] = value;
    }
  }
  return result;
}

function extractParams(template: string): string[] {
  const matches = template.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
  return matches.map((m) => m.slice(1, -1)).sort();
}

describe('i18n core engine and bidirectional parity', () => {
  beforeEach(() => {
    resetLanguageForTesting('pt-BR');
  });

  afterEach(() => {
    resetLanguageForTesting('pt-BR');
  });

  describe('100% Key Parity & Symmetry across all domains', () => {
    const flatPt = flattenKeys(ptBR);
    const flatEn = flattenKeys(en);

    it('has identical keys in pt-BR and en across all domains', () => {
      const ptKeys = Object.keys(flatPt).sort();
      const enKeys = Object.keys(flatEn).sort();

      const missingInEn = ptKeys.filter((k) => !(k in flatEn));
      const extraInEn = enKeys.filter((k) => !(k in flatPt));

      expect(missingInEn, 'Keys present in pt-BR but missing in en').toEqual([]);
      expect(extraInEn, 'Keys present in en but missing in pt-BR').toEqual([]);
      expect(enKeys).toEqual(ptKeys);
    });

    it('covers all 6 required domains (nav, forms, tables, modals, alerts, common)', () => {
      const requiredDomains = ['nav', 'forms', 'tables', 'modals', 'alerts', 'common'];
      for (const domain of requiredDomains) {
        expect(ptBR).toHaveProperty(domain);
        expect(en).toHaveProperty(domain);
      }
    });

    it('maintains symmetric interpolation parameter tokens across both languages', () => {
      const mismatchedParams: Array<{ key: string; ptParams: string[]; enParams: string[] }> = [];

      for (const key of Object.keys(flatPt)) {
        const ptTokens = extractParams(flatPt[key]);
        const enTokens = extractParams(flatEn[key]);

        if (JSON.stringify(ptTokens) !== JSON.stringify(enTokens)) {
          mismatchedParams.push({
            key,
            ptParams: ptTokens,
            enParams: enTokens,
          });
        }
      }

      expect(mismatchedParams, 'Keys with mismatched interpolation parameters').toEqual([]);
    });
  });

  describe('Translation lookup & interpolation', () => {
    it('translates nested key in active pt-BR language', () => {
      resetLanguageForTesting('pt-BR');
      expect(t('nav.title')).toBe('OptiPrint');
      expect(t('forms.sheetConfig.title')).toBe('Configuração da Folha');
    });

    it('translates nested key in active en language', () => {
      setLanguage('en');
      expect(t('forms.sheetConfig.title')).toBe('Sheet Configuration');
    });

    it('interpolates variables safely using {param} syntax', () => {
      resetLanguageForTesting('pt-BR');
      const rendered = t('forms.sheetConfig.width', { unit: 'mm' });
      expect(rendered).toBe('Largura (mm)');

      const cutDesc = t('tables.guillotine.stepCutDescHorizontal', {
        step: 1,
        coord: '120.0',
        start: '5.0',
        end: '315.0',
      });
      expect(cutDesc).toBe('1º Corte Horizontal em Y = 120.0 mm (de X = 5.0 a 315.0 mm)');
    });

    it('interpolates variables in English', () => {
      setLanguage('en');
      const rendered = t('forms.sheetConfig.width', { unit: 'in' });
      expect(rendered).toBe('Width (in)');

      const cutDesc = t('tables.guillotine.stepCutDescHorizontal', {
        step: 1,
        coord: '120.0',
        start: '5.0',
        end: '315.0',
      });
      expect(cutDesc).toBe('Cut #1: Horizontal cut at Y = 120.0 mm (from X = 5.0 to 315.0 mm)');
    });

    it('falls back safely to pt-BR when a key is missing in English', () => {
      setLanguage('en');
      const res = t('nonexistent.fakeKey', undefined, 'Fallback Text');
      expect(res).toBe('Fallback Text');
    });

    it('returns raw key when missing in both and no fallback is given', () => {
      expect(t('unknown.random.key')).toBe('unknown.random.key');
    });

    it('replaces unsupplied parameter tokens cleanly or retains non-matching text', () => {
      expect(interpolate('Hello {name}!', { name: 'World' })).toBe('Hello World!');
      expect(interpolate('Hello {name}!', {})).toBe('Hello {name}!');
    });

    it('translates newly introduced UI keys symmetrically in pt-BR and en', () => {
      resetLanguageForTesting('pt-BR');
      expect(t('nav.guillotine')).toBe('Guilhotina');
      expect(t('nav.requireGuillotine')).toBe('Exigir Guilhotina');
      expect(t('common.zoomIn')).toBe('Aumentar zoom');
      expect(t('common.zoomOut')).toBe('Reduzir zoom');
      expect(t('common.inspectTooltip')).toBe('Passe o mouse sobre um elemento para inspecionar medidas exatas');
      expect(t('common.stepByStep')).toBe('Passo a Passo');
      expect(t('common.sheetPagination', { current: 1, total: 3 })).toBe('Folha 1 de 3');
      expect(t('alerts.paperUnutilized', { percent: '14.5' })).toBe('14.5% de papel não aproveitado');

      setLanguage('en');
      expect(t('nav.guillotine')).toBe('Guillotine');
      expect(t('nav.requireGuillotine')).toBe('Require Guillotine Cuts');
      expect(t('common.zoomIn')).toBe('Zoom in');
      expect(t('common.zoomOut')).toBe('Zoom out');
      expect(t('common.inspectTooltip')).toBe('Hover over an element to inspect exact dimensions');
      expect(t('common.stepByStep')).toBe('Step-by-Step');
      expect(t('common.sheetPagination', { current: 1, total: 3 })).toBe('Sheet 1 of 3');
      expect(t('alerts.paperUnutilized', { percent: '14.5' })).toBe('14.5% unutilized paper');
    });
  });

  describe('Language switching, storage, events and DOM sync', () => {
    it('defaults to pt-BR in Node/test environment', () => {
      expect(getLanguage()).toBe('pt-BR');
    });

    it('updates document.documentElement.lang, saves to localStorage, and dispatches CustomEvent on setLanguage', () => {
      const storage: Record<string, string> = {};
      const mockStorage = {
        getItem: vi.fn((k: string) => storage[k] ?? null),
        setItem: vi.fn((k: string, v: string) => {
          storage[k] = v;
        }),
      };

      const eventMap: Record<string, Array<(e: any) => void>> = {};
      const mockWin = {
        localStorage: mockStorage,
        addEventListener: vi.fn((event: string, handler: any) => {
          if (!eventMap[event]) eventMap[event] = [];
          eventMap[event].push(handler);
        }),
        removeEventListener: vi.fn((event: string, handler: any) => {
          if (eventMap[event]) {
            eventMap[event] = eventMap[event].filter((h) => h !== handler);
          }
        }),
        dispatchEvent: vi.fn((event: any) => {
          const handlers = eventMap[event.type] || [];
          for (const h of handlers) h(event);
          return true;
        }),
      };

      const mockDoc = {
        documentElement: {
          lang: 'pt-BR',
        },
      };

      vi.stubGlobal('window', mockWin);
      vi.stubGlobal('document', mockDoc);
      vi.stubGlobal(
        'CustomEvent',
        class MockCustomEvent {
          type: string;
          detail: any;
          constructor(type: string, params: any = {}) {
            this.type = type;
            this.detail = params.detail;
          }
        }
      );

      try {
        const eventListener = vi.fn();
        mockWin.addEventListener('languagechange', eventListener);

        setLanguage('en');

        expect(getLanguage()).toBe('en');
        expect(mockDoc.documentElement.lang).toBe('en');
        expect(mockStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'en');
        expect(mockWin.dispatchEvent).toHaveBeenCalled();
        expect(eventListener).toHaveBeenCalled();
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('notifies subscribers registered via subscribeLanguage', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeLanguage(listener);

      setLanguage('en');
      expect(listener).toHaveBeenCalled();

      unsubscribe();
      listener.mockClear();
      setLanguage('pt-BR');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Formatters', () => {
    it('formats numbers with comma separator in pt-BR and period in en', () => {
      resetLanguageForTesting('pt-BR');
      expect(formatNumber(85.5, 1)).toBe('85,5');

      setLanguage('en');
      expect(formatNumber(85.5, 1)).toBe('85.5');
    });

    it('formats currency respecting language and currency code', () => {
      resetLanguageForTesting('pt-BR');
      const brlPt = formatCurrency(1234.5, 'BRL');
      expect(brlPt).toContain('1.234,50');

      setLanguage('en');
      const usdEn = formatCurrency(1234.5, 'USD');
      expect(usdEn).toContain('1,234.50');
    });

    it('handles pluralize helper properly', () => {
      expect(pluralize(1, 'peça', 'peças')).toBe('peça');
      expect(pluralize(0, 'peça', 'peças')).toBe('peças');
      expect(pluralize(5, 'peça', 'peças')).toBe('peças');
    });
  });

  describe('Localization Helpers (Categories, Sheet Presets, Item Presets)', () => {
    describe('getLocalizedCategory', () => {
      it('localizes categories correctly in pt-BR', () => {
        resetLanguageForTesting('pt-BR');
        expect(getLocalizedCategory('Todos')).toBe('Todos');
        expect(getLocalizedCategory('Digital / SRA')).toBe('Digital / SRA');
        expect(getLocalizedCategory('Série ISO A')).toBe('Série ISO A');
        expect(getLocalizedCategory('Gráfica Offset (Brasil)')).toBe('Gráfica Offset (Brasil)');
        expect(getLocalizedCategory('Série ISO B')).toBe('Série ISO B');
        expect(getLocalizedCategory('EUA / Outros')).toBe('EUA / Outros');
        expect(getLocalizedCategory('Formatos Salvos')).toBe('Formatos Salvos');
        expect(getLocalizedCategory('⭐ Meus Formatos Salvos')).toBe('Formatos Salvos');
      });

      it('localizes categories correctly in English', () => {
        setLanguage('en');
        expect(getLocalizedCategory('Todos')).toBe('All');
        expect(getLocalizedCategory('Digital / SRA')).toBe('Digital / SRA');
        expect(getLocalizedCategory('Série ISO A')).toBe('ISO Series A');
        expect(getLocalizedCategory('Gráfica Offset (Brasil)')).toBe('Commercial Offset (Brazil)');
        expect(getLocalizedCategory('Série ISO B')).toBe('ISO Series B');
        expect(getLocalizedCategory('EUA / Outros')).toBe('US / Others');
        expect(getLocalizedCategory('Formatos Salvos')).toBe('Saved Formats');
        expect(getLocalizedCategory('⭐ Meus Formatos Salvos')).toBe('Saved Formats');
      });

      it('normalizes category casing and variants', () => {
        expect(getLocalizedCategory('all', 'pt-BR')).toBe('Todos');
        expect(getLocalizedCategory('all', 'en')).toBe('All');
        expect(getLocalizedCategory('iso a', 'en')).toBe('ISO Series A');
        expect(getLocalizedCategory('offset', 'en')).toBe('Commercial Offset (Brazil)');
        expect(getLocalizedCategory('usa', 'en')).toBe('US / Others');
      });

      it('returns custom categories untouched', () => {
        expect(getLocalizedCategory('Papéis Reciclados Especiais', 'pt-BR')).toBe('Papéis Reciclados Especiais');
        expect(getLocalizedCategory('Papéis Reciclados Especiais', 'en')).toBe('Papéis Reciclados Especiais');
      });
    });

    describe('getLocalizedSheetPresetName', () => {
      it('localizes Offset and US sheet preset names in pt-BR', () => {
        resetLanguageForTesting('pt-BR');
        expect(getLocalizedSheetPresetName('OFFSET_66X96', 'Default')).toBe('Folha Inteira 66×96 cm');
        expect(getLocalizedSheetPresetName('OFFSET_48X66', 'Default')).toBe('Meia Folha 48×66 cm');
        expect(getLocalizedSheetPresetName('OFFSET_64X88', 'Default')).toBe('Folha 64×88 cm');
        expect(getLocalizedSheetPresetName('OFFSET_70X100', 'Default')).toBe('Folha 70×100 cm');
        expect(getLocalizedSheetPresetName('OFFSET_CARTAO_77X110', 'Default')).toBe('Cartão 77×110 cm');
        expect(getLocalizedSheetPresetName('US_LETTER', 'Default')).toBe('Carta / Letter');
        expect(getLocalizedSheetPresetName('US_LEGAL', 'Default')).toBe('Ofício / Legal');
        expect(getLocalizedSheetPresetName('US_TABLOID', 'Default')).toBe('Tabloide / Ledger');
      });

      it('localizes Offset and US sheet preset names in English', () => {
        setLanguage('en');
        expect(getLocalizedSheetPresetName('OFFSET_66X96', 'Default')).toBe('Full Sheet 66×96 cm');
        expect(getLocalizedSheetPresetName('OFFSET_48X66', 'Default')).toBe('Half Sheet 48×66 cm');
        expect(getLocalizedSheetPresetName('OFFSET_64X88', 'Default')).toBe('Sheet 64×88 cm');
        expect(getLocalizedSheetPresetName('OFFSET_70X100', 'Default')).toBe('Sheet 70×100 cm');
        expect(getLocalizedSheetPresetName('OFFSET_CARTAO_77X110', 'Default')).toBe('Cardboard 77×110 cm');
        expect(getLocalizedSheetPresetName('US_LETTER', 'Default')).toBe('Letter');
        expect(getLocalizedSheetPresetName('US_LEGAL', 'Default')).toBe('Legal');
        expect(getLocalizedSheetPresetName('US_TABLOID', 'Default')).toBe('Tabloid / Ledger');
      });

      it('falls back to defaultName for ISO or unknown custom presets', () => {
        expect(getLocalizedSheetPresetName('A4', 'A4', 'pt-BR')).toBe('A4');
        expect(getLocalizedSheetPresetName('A4', 'A4', 'en')).toBe('A4');
        expect(getLocalizedSheetPresetName('CUSTOM_PRESET_1', 'Capa Dura', 'en')).toBe('Capa Dura');
      });
    });

    describe('getLocalizedPresetItemName', () => {
      it('translates default preset items bidirectionally', () => {
        // pt-BR -> en
        expect(getLocalizedPresetItemName('Cartão de Visita', 'en')).toBe('Business Card');
        expect(getLocalizedPresetItemName('Adesivo 7×7', 'en')).toBe('Sticker 7×7');
        expect(getLocalizedPresetItemName('Panfleto A6', 'en')).toBe('Flyer A6');
        expect(getLocalizedPresetItemName('Tag Produto', 'en')).toBe('Product Tag');
        expect(getLocalizedPresetItemName('Adesivo Marca', 'en')).toBe('Brand Sticker');
        expect(getLocalizedPresetItemName('Elemento Gráfico', 'en')).toBe('Graphic Element');
        expect(getLocalizedPresetItemName('Elemento', 'en')).toBe('Element');

        // en -> pt-BR
        expect(getLocalizedPresetItemName('Business Card', 'pt-BR')).toBe('Cartão de Visita');
        expect(getLocalizedPresetItemName('Sticker 7×7', 'pt-BR')).toBe('Adesivo 7×7');
        expect(getLocalizedPresetItemName('Flyer A6', 'pt-BR')).toBe('Panfleto A6');
        expect(getLocalizedPresetItemName('Product Tag', 'pt-BR')).toBe('Tag Produto');
        expect(getLocalizedPresetItemName('Brand Sticker', 'pt-BR')).toBe('Adesivo Marca');
        expect(getLocalizedPresetItemName('Graphic Element', 'pt-BR')).toBe('Elemento Gráfico');
        expect(getLocalizedPresetItemName('Element', 'pt-BR')).toBe('Elemento');
      });

      it('translates dynamic numbered element names (Elemento N <-> Element N)', () => {
        expect(getLocalizedPresetItemName('Elemento 1', 'en')).toBe('Element 1');
        expect(getLocalizedPresetItemName('Elemento 42', 'en')).toBe('Element 42');
        expect(getLocalizedPresetItemName('Element 1', 'pt-BR')).toBe('Elemento 1');
        expect(getLocalizedPresetItemName('Element 42', 'pt-BR')).toBe('Elemento 42');
      });

      it('leaves user-customized item names intact', () => {
        expect(getLocalizedPresetItemName('Meu Card VIP', 'en')).toBe('Meu Card VIP');
        expect(getLocalizedPresetItemName('Meu Card VIP', 'pt-BR')).toBe('Meu Card VIP');
      });
    });

    describe('getLocalizedSamplePresetLabel', () => {
      const card = { label: 'Cartão de Visita (90 × 50 mm)', name: 'Cartão de Visita', widthMm: 90, heightMm: 50 };
      const sticker = { label: 'Adesivo Quadrado (70 × 70 mm)', name: 'Adesivo 7×7', widthMm: 70, heightMm: 70 };
      const flyer = { label: 'Panfleto A6 (105 × 148 mm)', name: 'Panfleto A6', widthMm: 105, heightMm: 148 };
      const tag = { label: 'Tag / Etiqueta (55 × 85 mm)', name: 'Tag Produto', widthMm: 55, heightMm: 85 };

      it('formats sample preset dropdown labels in pt-BR', () => {
        resetLanguageForTesting('pt-BR');
        expect(getLocalizedSamplePresetLabel(card)).toBe('Cartão de Visita (90 × 50 mm)');
        expect(getLocalizedSamplePresetLabel(sticker)).toBe('Adesivo Quadrado (70 × 70 mm)');
        expect(getLocalizedSamplePresetLabel(flyer)).toBe('Panfleto A6 (105 × 148 mm)');
        expect(getLocalizedSamplePresetLabel(tag)).toBe('Tag / Etiqueta (55 × 85 mm)');
      });

      it('formats sample preset dropdown labels in English', () => {
        setLanguage('en');
        expect(getLocalizedSamplePresetLabel(card)).toBe('Business Card (90 × 50 mm)');
        expect(getLocalizedSamplePresetLabel(sticker)).toBe('Square Sticker (70 × 70 mm)');
        expect(getLocalizedSamplePresetLabel(flyer)).toBe('Flyer A6 (105 × 148 mm)');
        expect(getLocalizedSamplePresetLabel(tag)).toBe('Tag / Label (55 × 85 mm)');
      });

      it('falls back cleanly for custom unknown sample preset', () => {
        const custom = { label: 'Embalagem Especial', name: 'Embalagem Especial', widthMm: 40, heightMm: 40 };
        expect(getLocalizedSamplePresetLabel(custom, 'pt-BR')).toBe('Embalagem Especial (40 × 40 mm)');
        expect(getLocalizedSamplePresetLabel(custom, 'en')).toBe('Embalagem Especial (40 × 40 mm)');
      });
    });
  });
});
