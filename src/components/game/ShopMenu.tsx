import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Store, Coins, ShoppingCart, Package, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Player, PotionType } from '../../types';
import { ITEM_PRICES, GEAR_STATS, POTION_STATS, generateMerchantStock, MERCHANT_NAMES } from '../../constants';

interface ShopMenuProps {
  player: Player;
  merchantPosition: { x: number; y: number };
  onBuy: (itemType: string, price: number) => void;
  onSell: (inventoryIndex: number, price: number) => void;
  onClose: () => void;
}

type ShopTab = 'buy' | 'sell';

export const ShopMenu: React.FC<ShopMenuProps> = ({
  player,
  merchantPosition,
  onBuy,
  onSell,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<ShopTab>('buy');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Рефы для фокуса и автоскролла
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Генерируем ассортимент по уровню подземелья
  const stock = useMemo(() => generateMerchantStock(player.dungeonLevel), [player.dungeonLevel]);

  // Выбираем случайного торговца (стабильно для одной позиции)
  const merchant = useMemo(() => {
    const seed = merchantPosition.x * 100 + merchantPosition.y;
    return MERCHANT_NAMES[seed % MERCHANT_NAMES.length];
  }, [merchantPosition]);

  // Предметы для продажи из инвентаря
  const sellableItems = useMemo(() => {
    return player.inventory.map((item, index) => {
      const price = ITEM_PRICES[item]?.sell || 5;
      const name = GEAR_STATS[item]?.name || POTION_STATS[item as PotionType]?.name || item;
      return { item, index, price, name };
    });
  }, [player.inventory]);

  const currentList = activeTab === 'buy' ? stock : sellableItems;

  // Автофокус на контейнере при открытии
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Автоскролл к выбранному элементу
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => Math.min(currentList.length - 1, prev + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      setActiveTab(prev => prev === 'buy' ? 'sell' : 'buy');
      setSelectedIndex(0);
    } else if (e.key === 'Enter') {
      if (activeTab === 'buy' && stock[selectedIndex]) {
        const item = stock[selectedIndex];
        if (player.gold >= item.price) {
          onBuy(item.itemType, item.price);
        }
      } else if (activeTab === 'sell' && sellableItems[selectedIndex]) {
        const item = sellableItems[selectedIndex];
        onSell(item.index, item.price);
        setSelectedIndex(prev => Math.min(prev, sellableItems.length - 2));
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const getItemName = (itemType: string): string => {
    return GEAR_STATS[itemType]?.name || POTION_STATS[itemType as PotionType]?.name || itemType;
  };

  const getItemColor = (itemType: string): string => {
    return GEAR_STATS[itemType]?.color || `text-${POTION_STATS[itemType as PotionType]?.color}` || 'text-white';
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onKeyDown={handleKeyNavigation}
      tabIndex={0}
    >
      <div className="bg-gradient-to-b from-amber-900 to-amber-950 border-4 border-amber-600 rounded-xl p-4 shadow-2xl w-[500px] max-h-[80vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-3 border-b border-amber-700 pb-2">
          <div className="flex items-center gap-2">
            <Store className="text-amber-400" size={24} />
            <div>
              <h2 className="text-lg font-bold text-amber-200">{merchant.name}</h2>
              <p className="text-xs text-amber-400/80 italic">"{merchant.greeting}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-amber-800 rounded transition-colors"
          >
            <X className="text-amber-400" size={20} />
          </button>
        </div>

        {/* Золото игрока */}
        <div className="flex items-center gap-2 mb-3 bg-black/30 rounded px-3 py-1.5">
          <Coins className="text-yellow-400" size={18} />
          <span className="text-yellow-300 font-bold">{player.gold}</span>
          <span className="text-yellow-500/70 text-sm">золота</span>
        </div>

        {/* Табы */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => { setActiveTab('buy'); setSelectedIndex(0); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-t transition-all
              ${activeTab === 'buy'
                ? 'bg-amber-700 text-white font-bold border-b-2 border-amber-400'
                : 'bg-amber-900/50 text-amber-400 hover:bg-amber-800/50'}
            `}
          >
            <ShoppingCart size={16} />
            Купить
            <ChevronLeft size={14} className="opacity-50" />
          </button>
          <button
            onClick={() => { setActiveTab('sell'); setSelectedIndex(0); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-t transition-all
              ${activeTab === 'sell'
                ? 'bg-amber-700 text-white font-bold border-b-2 border-amber-400'
                : 'bg-amber-900/50 text-amber-400 hover:bg-amber-800/50'}
            `}
          >
            <Package size={16} />
            Продать
            <ChevronRight size={14} className="opacity-50" />
          </button>
        </div>

        {/* Список товаров */}
        <div className="flex-1 overflow-y-auto bg-black/20 rounded p-2 min-h-[200px]">
          {activeTab === 'buy' ? (
            stock.length === 0 ? (
              <div className="text-amber-500/50 text-center py-8 italic">Товаров нет...</div>
            ) : (
              <div className="space-y-1">
                {stock.map((item, idx) => {
                  const canAfford = player.gold >= item.price;
                  return (
                    <button
                      key={`${item.itemType}-${idx}`}
                      ref={el => { itemRefs.current[idx] = el; }}
                      onClick={() => canAfford && onBuy(item.itemType, item.price)}
                      className={`w-full text-left px-3 py-2 rounded flex items-center justify-between transition-all
                        ${selectedIndex === idx ? 'bg-amber-600 scale-[1.02] shadow-lg' : 'hover:bg-amber-800/50'}
                        ${!canAfford ? 'opacity-40' : ''}
                      `}
                    >
                      <span className={getItemColor(item.itemType)}>
                        {getItemName(item.itemType)}
                      </span>
                      <span className={`flex items-center gap-1 ${canAfford ? 'text-yellow-300' : 'text-red-400'}`}>
                        <Coins size={12} />
                        {item.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            sellableItems.length === 0 ? (
              <div className="text-amber-500/50 text-center py-8 italic">Нечего продавать...</div>
            ) : (
              <div className="space-y-1">
                {sellableItems.map((item, idx) => (
                  <button
                    key={`${item.item}-${item.index}`}
                    ref={el => { itemRefs.current[idx] = el; }}
                    onClick={() => onSell(item.index, item.price)}
                    className={`w-full text-left px-3 py-2 rounded flex items-center justify-between transition-all
                      ${selectedIndex === idx ? 'bg-amber-600 scale-[1.02] shadow-lg' : 'hover:bg-amber-800/50'}
                    `}
                  >
                    <span className={getItemColor(item.item)}>
                      {item.name}
                    </span>
                    <span className="flex items-center gap-1 text-green-400">
                      <Coins size={12} />
                      +{item.price}
                    </span>
                  </button>
                ))}
              </div>
            )
          )}
        </div>

        {/* Подсказки */}
        <div className="mt-3 text-xs text-amber-500/70 flex justify-between border-t border-amber-700 pt-2">
          <span>↑↓ выбор • ←→ вкладка</span>
          <span>Enter подтвердить • Esc закрыть</span>
        </div>
      </div>
    </div>
  );
};
