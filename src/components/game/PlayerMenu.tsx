import React, { useEffect, useRef } from 'react';
import { Zap, Backpack, X } from 'lucide-react';
import type { Player, ActiveMenu } from '../../types';
import { CLASSES, POTION_STATS, GEAR_STATS } from '../../constants';

interface PlayerMenuProps {
  player: Player;
  activeMenu: ActiveMenu;
  mainMenuIndex: number;
  subMenuIndex: number;
  onClose: () => void;
}

export function PlayerMenu({
  player,
  activeMenu,
  mainMenuIndex,
  subMenuIndex,
  onClose
}: PlayerMenuProps) {
  
  const menuOptions = [
    { label: 'Навыки', icon: <Zap size={18} /> },
    { label: 'Инвентарь', icon: <Backpack size={18} /> },
    { label: 'Закрыть', icon: <X size={18} /> },
  ];

  // Рефы для автоскролла
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Эффект скролла
  useEffect(() => {
    if ((activeMenu === 'skills' || activeMenu === 'items') && itemRefs.current[subMenuIndex]) {
      itemRefs.current[subMenuIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', // Важно: скроллит только если элемент за краем
      });
    }
  }, [subMenuIndex, activeMenu]);

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-900 border-2 border-slate-700 p-6 rounded-lg w-96 shadow-2xl flex flex-col max-h-[80vh]">
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2 pb-2 border-b border-slate-700 shrink-0">
           Меню персонажа
        </h2>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Главное меню */}
          {activeMenu === 'main' && (
            <div className="space-y-2">
              {menuOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded flex items-center gap-3 cursor-pointer transition-colors ${
                    idx === mainMenuIndex 
                      ? 'bg-blue-900/50 text-blue-100 ring-1 ring-blue-500' 
                      : 'bg-slate-800 text-slate-400'
                  }`}
                  onClick={opt.label === 'Закрыть' ? onClose : undefined}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                  {idx === mainMenuIndex && <span className="ml-auto text-xs">Enter</span>}
                </div>
              ))}
            </div>
          )}

          {/* Меню навыков */}
          {activeMenu === 'skills' && (
            <div className="flex flex-col h-full">
              <h3 className="text-blue-400 text-sm font-bold mb-2 uppercase shrink-0">Навыки класса</h3>
              <div ref={listRef} className="space-y-2 overflow-y-auto pr-2 flex-1">
                {CLASSES[player.class].skills.map((skill, idx) => (
                  <div
                    key={skill.id}
                    ref={el => itemRefs.current[idx] = el}
                    className={`p-3 rounded border transition-colors ${
                      idx === subMenuIndex
                        ? 'bg-blue-900/30 border-blue-500 text-slate-100'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold">{skill.name}</span>
                      <span className="text-xs text-blue-300">{skill.mpCost} MP</span>
                    </div>
                    <div className="text-xs opacity-70">{skill.desc}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-center text-slate-500 shrink-0">
                [ESC] Назад
              </div>
            </div>
          )}

          {/* Меню предметов */}
          {activeMenu === 'items' && (
            <div className="flex flex-col h-full">
              <h3 className="text-emerald-400 text-sm font-bold mb-2 uppercase shrink-0">Рюкзак</h3>
              <div ref={listRef} className="space-y-2 overflow-y-auto pr-2 flex-1">
                {player.inventory.length === 0 ? (
                  <div className="text-center text-slate-500 py-4 italic">Пусто...</div>
                ) : (
                  player.inventory.map((item, idx) => {
                    let stats;
                    let typeLabel = '';
                    let actionLabel = 'Использовать';

                    if (item.startsWith('potion')) {
                      stats = POTION_STATS[item];
                      typeLabel = stats.type === 'hp' ? `Лечение: +${stats.heal}` : `Мана: +${stats.mana}`;
                    } else {
                      stats = GEAR_STATS[item];
                      typeLabel = stats.type === 'atk' ? `Урон: +${stats.val}` : `Защита: +${stats.val}`;
                      actionLabel = 'Экипировать';
                    }

                    return (
                      <div
                        key={idx}
                        ref={el => itemRefs.current[idx] = el}
                        className={`p-3 rounded border transition-colors ${
                          idx === subMenuIndex
                            ? 'bg-emerald-900/30 border-emerald-500 text-slate-100'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span className="flex items-center gap-2">
                             {item.startsWith('potion') && <span className={`w-2 h-2 rounded-full bg-${stats.color}-500`}></span>}
                             {stats.name}
                          </span>
                        </div>
                        <div className="text-xs opacity-70 mt-1 flex justify-between">
                          <span>{typeLabel}</span>
                          {idx === subMenuIndex && <span className="text-emerald-400 font-bold">[Enter] {actionLabel}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Отображение текущей экипировки */}
              <div className="mt-4 pt-3 border-t border-slate-700 shrink-0 text-xs text-slate-400 grid grid-cols-2 gap-2">
                 <div>
                    <span className="block opacity-50">Оружие:</span>
                    <span className="text-slate-200">
                      {player.equippedWeapon ? GEAR_STATS[player.equippedWeapon].name : "Кулаки"}
                    </span>
                 </div>
                 <div>
                    <span className="block opacity-50">Броня:</span>
                    <span className="text-slate-200">
                      {player.equippedArmor ? GEAR_STATS[player.equippedArmor].name : "Тряпки"}
                    </span>
                 </div>
              </div>

              <div className="mt-2 text-xs text-center text-slate-500 shrink-0">
                [ESC] Назад
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}