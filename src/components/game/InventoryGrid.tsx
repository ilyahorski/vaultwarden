import React, { useState, useMemo, useCallback } from 'react';
import { Package, Sword, Scroll, Shirt, Apple, Star, X, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import type { InventorySlot, ItemCategory, ExtendedItemTypeNonNull, DuoParty } from '../../types';
import { MAX_INVENTORY_SIZE } from '../../constants';

interface InventoryGridProps {
  party: DuoParty;
  onMoveItem?: (fromSlot: number, toSlot: number) => void;
  onUseItem?: (slot: number) => void;
  onDropItem?: (slot: number) => void;
  onClose?: () => void;
}

// Маппинг иконок для категорий
const CATEGORY_ICONS: Record<ItemCategory | 'all', React.ReactNode> = {
  all: <Package size={16} />,
  weapon: <Sword size={16} />,
  scroll: <Scroll size={16} />,
  clothing: <Shirt size={16} />,
  food: <Apple size={16} />,
  quest: <Star size={16} />
};

// Цвета для категорий
const CATEGORY_COLORS: Record<ItemCategory, string> = {
  weapon: 'border-orange-500/50 bg-orange-900/20',
  scroll: 'border-purple-500/50 bg-purple-900/20',
  clothing: 'border-blue-500/50 bg-blue-900/20',
  food: 'border-green-500/50 bg-green-900/20',
  quest: 'border-yellow-500/50 bg-yellow-900/20'
};

// Названия категорий на русском
const CATEGORY_NAMES: Record<ItemCategory | 'all', string> = {
  all: 'Все',
  weapon: 'Оружие',
  scroll: 'Свитки',
  clothing: 'Одежда',
  food: 'Еда',
  quest: 'Квестовые'
};

// Отображаемые имена предметов (используем Partial для неполного маппинга)
const ITEM_NAMES: Partial<Record<ExtendedItemTypeNonNull, string>> = {
  // Оружие
  weapon_rusty: 'Ржавый меч',
  weapon_dagger: 'Кинжал',
  weapon_mace: 'Булава',
  weapon_sword: 'Меч',
  weapon_axe: 'Топор',
  weapon_greatsword: 'Двуручник',
  weapon_legend: 'Легендарное оружие',
  // Зелья
  potion_weak: 'Слабое зелье HP',
  potion_mid: 'Среднее зелье HP',
  potion_strong: 'Сильное зелье HP',
  potion_mana_weak: 'Слабое зелье маны',
  potion_mana_mid: 'Среднее зелье маны',
  potion_mana_strong: 'Сильное зелье маны',
  // Свитки
  scroll_fireball: 'Свиток огня',
  scroll_heal: 'Свиток исцеления',
  scroll_teleport: 'Свиток телепорта',
  scroll_time_shift: 'Свиток времени',
  scroll_reveal: 'Свиток обнаружения',
  // Еда
  food_bread: 'Хлеб',
  food_meat: 'Мясо',
  food_cheese: 'Сыр',
  food_apple: 'Яблоко',
  food_fish: 'Рыба',
  food_stew: 'Похлёбка',
  // Одежда
  clothing_explorer_hat: 'Шляпа исследователя',
  clothing_archaeologist_vest: 'Жилет археолога',
  clothing_travel_cloak: 'Дорожный плащ',
  clothing_sturdy_boots: 'Крепкие сапоги',
  // Квестовые
  quest_ancient_key: 'Древний ключ',
  quest_time_crystal: 'Кристалл времени',
  quest_cat_collar: 'Ошейник кота',
  quest_essence_past: 'Эссенция прошлого',
  quest_essence_present: 'Эссенция настоящего',
  quest_essence_future: 'Эссенция будущего',
  quest_codex_page: 'Страница кодекса',
  // Прочее
  gold: 'Золото',
  chest: 'Сундук'
};

const ITEMS_PER_PAGE = 50; // 5x10 видимых слотов на странице

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  party,
  onMoveItem,
  onUseItem,
  onDropItem,
  onClose
}) => {
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // Фильтрация предметов по категории (для будущего использования)
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') {
      return party.inventory;
    }
    return party.inventory.filter(item => item.category === activeCategory);
  }, [party.inventory, activeCategory]);
  void filteredItems; // Will be used for future filtering display

  // Создаем маппинг слотов для быстрого доступа
  const slotMap = useMemo(() => {
    const map = new Map<number, InventorySlot>();
    party.inventory.forEach(item => {
      map.set(item.slot, item);
    });
    return map;
  }, [party.inventory]);

  // Общее количество страниц
  const totalPages = Math.ceil(MAX_INVENTORY_SIZE / ITEMS_PER_PAGE);

  // Слоты для текущей страницы
  const visibleSlots = useMemo(() => {
    const startSlot = currentPage * ITEMS_PER_PAGE;
    const slots: (InventorySlot | null)[] = [];

    for (let i = 0; i < ITEMS_PER_PAGE; i++) {
      const slotIndex = startSlot + i;
      if (slotIndex >= MAX_INVENTORY_SIZE) break;

      const item = slotMap.get(slotIndex);

      // Если фильтр активен и предмет не соответствует - показываем затемненный слот
      if (activeCategory !== 'all' && item && item.category !== activeCategory) {
        slots.push(null); // Скрываем несоответствующие предметы
      } else {
        slots.push(item || null);
      }
    }

    return slots;
  }, [currentPage, slotMap, activeCategory]);

  // Drag and Drop handlers
  const handleDragStart = useCallback((slot: number) => {
    setDraggedSlot(slot);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetSlot: number) => {
    e.preventDefault();
    if (draggedSlot !== null && draggedSlot !== targetSlot) {
      e.currentTarget.classList.add('ring-2', 'ring-amber-400');
    }
  }, [draggedSlot]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('ring-2', 'ring-amber-400');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetSlot: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-amber-400');

    if (draggedSlot !== null && onMoveItem) {
      const realTargetSlot = currentPage * ITEMS_PER_PAGE + targetSlot;
      onMoveItem(draggedSlot, realTargetSlot);
    }
    setDraggedSlot(null);
  }, [draggedSlot, currentPage, onMoveItem]);

  const handleDragEnd = useCallback(() => {
    setDraggedSlot(null);
  }, []);

  // Клик по слоту
  const handleSlotClick = useCallback((slotIndex: number, item: InventorySlot | null) => {
    const realSlot = currentPage * ITEMS_PER_PAGE + slotIndex;

    if (item) {
      setSelectedSlot(selectedSlot === realSlot ? null : realSlot);
    } else {
      setSelectedSlot(null);
    }
  }, [currentPage, selectedSlot]);

  // Двойной клик - использование предмета
  const handleDoubleClick = useCallback((slotIndex: number, item: InventorySlot | null) => {
    if (item && onUseItem) {
      const realSlot = currentPage * ITEMS_PER_PAGE + slotIndex;
      onUseItem(realSlot);
    }
  }, [currentPage, onUseItem]);

  // Получить выбранный предмет
  const selectedItem = selectedSlot !== null ? slotMap.get(selectedSlot) : null;

  // Подсчет предметов по категориям
  const categoryCounts = useMemo(() => {
    const counts: Record<ItemCategory | 'all', number> = {
      all: party.inventory.length,
      weapon: 0,
      scroll: 0,
      clothing: 0,
      food: 0,
      quest: 0
    };

    party.inventory.forEach(item => {
      counts[item.category]++;
    });

    return counts;
  }, [party.inventory]);

  return (
    <div className="absolute inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-amber-500" />
            <h2 className="text-xl font-bold text-white">Инвентарь</h2>
            <span className="text-slate-400 text-sm">
              ({party.inventory.length}/{MAX_INVENTORY_SIZE})
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Фильтры категорий */}
        <div className="flex gap-2 p-4 border-b border-slate-700 overflow-x-auto">
          {(Object.keys(CATEGORY_NAMES) as (ItemCategory | 'all')[]).map(category => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                setCurrentPage(0);
                setSelectedSlot(null);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === category
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {CATEGORY_ICONS[category]}
              <span>{CATEGORY_NAMES[category]}</span>
              <span className="text-xs opacity-70">({categoryCounts[category]})</span>
            </button>
          ))}
        </div>

        {/* Сетка инвентаря */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-10 gap-1">
            {visibleSlots.map((item, index) => {
              const realSlot = currentPage * ITEMS_PER_PAGE + index;
              const isSelected = selectedSlot === realSlot;
              const isDragging = draggedSlot === realSlot;

              return (
                <div
                  key={index}
                  className={`
                    aspect-square rounded-lg border-2 cursor-pointer transition-all relative
                    ${item
                      ? `${CATEGORY_COLORS[item.category]} hover:brightness-110`
                      : 'border-slate-700/50 bg-slate-900/30 hover:border-slate-600'
                    }
                    ${isSelected ? 'ring-2 ring-amber-400' : ''}
                    ${isDragging ? 'opacity-50' : ''}
                  `}
                  draggable={!!item}
                  onDragStart={() => item && handleDragStart(realSlot)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSlotClick(index, item)}
                  onDoubleClick={() => handleDoubleClick(index, item)}
                  title={item && item.itemType ? (ITEM_NAMES[item.itemType] || item.itemType) : `Слот ${realSlot + 1}`}
                >
                  {item && (
                    <>
                      {/* Иконка предмета */}
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        {CATEGORY_ICONS[item.category]}
                      </div>

                      {/* Количество (для стакаемых предметов) */}
                      {item.stackable && item.quantity > 1 && (
                        <div className="absolute bottom-0 right-0 bg-slate-900/80 text-xs text-white px-1 rounded-tl">
                          {item.quantity}
                        </div>
                      )}

                      {/* Индикатор квестового предмета */}
                      {item.category === 'quest' && (
                        <div className="absolute top-0 right-0 text-yellow-400">
                          <Star size={10} fill="currentColor" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Пагинация */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Назад
          </button>

          <span className="text-slate-400">
            Страница {currentPage + 1} из {totalPages}
            <span className="text-slate-600 ml-2">
              (Слоты {currentPage * ITEMS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ITEMS_PER_PAGE, MAX_INVENTORY_SIZE)})
            </span>
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Вперёд
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Панель выбранного предмета */}
        {selectedItem && (
          <div className="border-t border-slate-700 p-4 bg-slate-900/50">
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-lg ${CATEGORY_COLORS[selectedItem.category]}`}>
                {CATEGORY_ICONS[selectedItem.category]}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">
                  {selectedItem.itemType ? (ITEM_NAMES[selectedItem.itemType] || selectedItem.itemType) : 'Неизвестный предмет'}
                </h3>
                <p className="text-slate-400 text-sm mb-2">
                  {CATEGORY_NAMES[selectedItem.category]}
                  {selectedItem.stackable && ` × ${selectedItem.quantity}`}
                </p>
                {selectedItem.description && (
                  <p className="text-slate-500 text-sm italic">{selectedItem.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                {selectedItem.category !== 'quest' && onUseItem && (
                  <button
                    onClick={() => onUseItem(selectedSlot!)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium"
                  >
                    Использовать
                  </button>
                )}
                {selectedItem.category !== 'quest' && onDropItem && (
                  <button
                    onClick={() => onDropItem(selectedSlot!)}
                    className="px-4 py-2 bg-red-600/50 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
                  >
                    Выбросить
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Подсказка */}
        <div className="p-2 border-t border-slate-700 bg-slate-900/30 text-center">
          <span className="text-slate-500 text-xs flex items-center justify-center gap-2">
            <GripVertical size={12} />
            Перетащите предметы для перемещения • Двойной клик для использования
          </span>
        </div>
      </div>
    </div>
  );
};

export default InventoryGrid;
