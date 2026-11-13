import React from 'react';
import { AlertTriangle, Layers, Plus, RotateCw, Trash2 } from 'lucide-react';
import { ITEM_COLORS, SAMPLE_ELEMENT_PRESETS } from '../constants/sheets';
import type { ItemSpec, Unit, UnplacedItem } from '../types/optimizer';
import { fromMm, toMm } from '../utils/units';

interface ItemListPanelProps {
  items: ItemSpec[];
  unit: Unit;
  unplacedItems: UnplacedItem[];
  onChange: (items: ItemSpec[]) => void;
}

export const ItemListPanel: React.FC<ItemListPanelProps> = ({
  items,
  unit,
  unplacedItems,
  onChange,
}) => {
  const step = unit === 'cm' ? '0.1' : '1';

  const handleAddItem = (preset?: (typeof SAMPLE_ELEMENT_PRESETS)[0]) => {
    const nextIdx = items.length;
    const color = ITEM_COLORS[nextIdx % ITEM_COLORS.length];
    const newItem: ItemSpec = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: preset ? preset.name : `Elemento ${nextIdx + 1}`,
      widthMm: preset ? preset.widthMm : 85,
      heightMm: preset ? preset.heightMm : 55,
      quantity: preset ? preset.quantity : 10,
      color,
      allowRotation: true,
    };
    onChange([...items, newItem]);
  };

  const handleUpdate = <K extends keyof ItemSpec>(
    id: string,
    field: K,
    value: ItemSpec[K],
  ) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleDimensionInput = (
    id: string,
    field: 'widthMm' | 'heightMm',
    rawValue: string,
  ) => {
    const parsed = parseFloat(rawValue);
    const mm = Number.isFinite(parsed) && parsed >= 0 ? toMm(parsed, unit) : 0;
    handleUpdate(id, field, mm);
  };

  const handleQuantityInput = (id: string, rawValue: string) => {
    const parsed = parseInt(rawValue, 10);
    const qty = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    handleUpdate(id, 'quantity', qty);
  };

  const unplacedById = new Map<string, UnplacedItem>();
  for (const u of unplacedItems) {
    unplacedById.set(u.itemId, u);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-xs dark:border-[#1E2B45] dark:bg-[#111A2E]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-stone-700 dark:text-slate-300" />
            <h2 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-slate-100">
              Lista de Elementos ({items.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => handleAddItem()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-medium text-stone-50 shadow-xs transition-colors hover:bg-stone-800 dark:bg-teal-700 dark:hover:bg-teal-600 dark:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </button>
        </div>

        {/* Quick add presets */}
        <div className="mb-4">
          <span className="mb-1.5 block text-[11px] font-medium text-stone-400 dark:text-slate-400">
            Adicionar formato pronto:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_ELEMENT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleAddItem(preset)}
                className="rounded-xl border border-stone-200/60 bg-stone-50/50 px-2.5 py-1 text-[11px] font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-100 hover:text-stone-900 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-[#18243C] dark:hover:text-white"
              >
                + {preset.name}
              </button>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/40 p-6 text-center text-xs text-stone-400 font-light dark:border-[#1E2B45] dark:bg-[#0D1527] dark:text-slate-400">
            Nenhum elemento na lista. Clique em <strong className="font-medium text-stone-700 dark:text-slate-200">Adicionar</strong> acima para incluir
            peças e calcular o aproveitamento em múltiplas folhas.
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => {
              const unplaced = unplacedById.get(item.id);
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-3.5 transition-colors ${
                    unplaced
                      ? 'border-amber-200/80 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/30'
                      : 'border-stone-200/70 bg-stone-50/40 hover:bg-stone-50/70 dark:border-[#1E2B45] dark:bg-[#0D1527] dark:hover:bg-[#131D33]'
                  }`}
                >
                  {/* Row 1: Color dot + Name + Delete */}
                  <div className="mb-2.5 flex items-center gap-2">
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        title="Trocar cor do elemento"
                        onClick={() => {
                          const currentIdx = ITEM_COLORS.indexOf(item.color);
                          const nextColor = ITEM_COLORS[(currentIdx + 1) % ITEM_COLORS.length];
                          handleUpdate(item.id, 'color', nextColor);
                        }}
                        className="h-5 w-5 shrink-0 rounded-full border border-stone-300/80 shadow-xs transition-transform hover:scale-110"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>

                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdate(item.id, 'name', e.target.value)}
                      placeholder="Nome do elemento"
                      className="min-w-0 flex-1 rounded-lg border border-stone-200/70 bg-white px-2.5 py-1 text-xs font-medium text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-slate-100 dark:focus:border-teal-400"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      title="Remover elemento"
                      className="rounded-lg p-1 text-stone-400 transition-colors hover:bg-stone-200/60 hover:text-stone-800 dark:text-slate-400 dark:hover:bg-[#18243C] dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Row 2: Width, Height, Quantity */}
                  <div className="mb-2.5 grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-stone-500 dark:text-slate-400">
                        Larg. ({unit})
                      </label>
                      <input
                        type="number"
                        min="1"
                        step={step}
                        value={fromMm(item.widthMm, unit) || ''}
                        onChange={(e) =>
                          handleDimensionInput(item.id, 'widthMm', e.target.value)
                        }
                        className="w-full rounded-lg border border-stone-200/70 bg-white px-2.5 py-1 text-xs font-medium text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-slate-100 dark:focus:border-teal-400"
                      />
                    </div>

                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-stone-500 dark:text-slate-400">
                        Alt. ({unit})
                      </label>
                      <input
                        type="number"
                        min="1"
                        step={step}
                        value={fromMm(item.heightMm, unit) || ''}
                        onChange={(e) =>
                          handleDimensionInput(item.id, 'heightMm', e.target.value)
                        }
                        className="w-full rounded-lg border border-stone-200/70 bg-white px-2.5 py-1 text-xs font-medium text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-slate-100 dark:focus:border-teal-400"
                      />
                    </div>

                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-stone-500 dark:text-slate-400">
                        Qtd.
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                        className="w-full rounded-lg border border-stone-200/70 bg-white px-2.5 py-1 text-xs font-medium text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-[#1E2B45] dark:bg-[#111A2E] dark:text-slate-100 dark:focus:border-teal-400"
                      />
                    </div>
                  </div>

                  {/* Row 3: Swatches + Allow Rotation */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1.5">
                      {ITEM_COLORS.map((swatch) => (
                        <button
                          key={swatch}
                          type="button"
                          onClick={() => handleUpdate(item.id, 'color', swatch)}
                          title="Selecionar cor"
                          className={`h-3.5 w-3.5 rounded-full transition-transform ${
                            item.color === swatch
                              ? 'scale-110 ring-2 ring-stone-900 ring-offset-1 dark:ring-white dark:ring-offset-[#0D1527]'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                    </div>

                    <label
                      className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-stone-600 dark:text-slate-300"
                      title="Permite girar o elemento em 90° para encaixar mais peças na folha"
                    >
                      <input
                        type="checkbox"
                        checked={item.allowRotation}
                        onChange={(e) =>
                          handleUpdate(item.id, 'allowRotation', e.target.checked)
                        }
                        className="h-3.5 w-3.5 rounded border-stone-300 text-stone-900 focus:ring-teal-500/20 dark:border-slate-600 dark:bg-[#111A2E]"
                      />
                      <RotateCw className="h-3 w-3 text-stone-400 dark:text-slate-400" />
                      Permitir 90°
                    </label>
                  </div>

                  {unplaced && (
                    <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-100/70 px-2.5 py-1.5 text-[11px] font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>
                        {unplaced.quantity} un. não couberam: {unplaced.reason}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
