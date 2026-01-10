import { useEffect, useRef } from 'react';
import { Sword, Zap, Briefcase, Activity, Skull, ChevronRight } from 'lucide-react';
import type { CombatTarget, Player, ActiveMenu, PotionType } from '../../types';
import { MONSTER_STATS, CLASSES, POTION_STATS, CELL_SIZE, GRID_SIZE } from '../../constants';

interface CombatMenuProps {
  combatTarget: CombatTarget;
  player: Player;
  activeMenu: ActiveMenu;
  mainMenuIndex: number;
  subMenuIndex: number;
  onAttack: () => void;
  onSkill: (skillId: string) => void;
  onItem: (itemId: string) => void;
  onFlee: () => void;
  onOpenSkills: () => void;
  onOpenItems: () => void;
}

export const CombatMenu: React.FC<CombatMenuProps> = ({
  combatTarget,
  player,
  activeMenu,
  mainMenuIndex,
  subMenuIndex,
  onAttack,
  onSkill,
  onItem,
  onFlee,
  onOpenSkills,
  onOpenItems
}) => {
  const isRightSide = combatTarget.x > GRID_SIZE / 2;
  const menuStyle: React.CSSProperties = {
    top: (combatTarget.y * CELL_SIZE),
    left: isRightSide
      ? (combatTarget.x * CELL_SIZE) - 10
      : (combatTarget.x * CELL_SIZE) + CELL_SIZE + 10,
    transform: isRightSide
      ? 'translate(-100%, -40%)'
      : 'translate(0, -40%)',
    zIndex: 100,
    pointerEvents: 'none'
  };

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
    <div
      className="absolute z-50"
      style={menuStyle}
    >
      {/* Главное Меню */}
      <div className="relative bg-blue-900/95 backdrop-blur-sm border-2 border-slate-200 rounded-lg p-2 shadow-2xl min-w-35 text-white flex flex-col gap-1 font-sans pointer-events-auto">
        <div className="text-xs text-blue-200 border-b border-blue-700 pb-1 mb-1 font-bold uppercase tracking-wider flex items-center gap-2">
          <Skull size={10} />
          {MONSTER_STATS[combatTarget.enemy!].name}
        </div>

        {/* Атака */}
        <button
          onClick={onAttack}
          className={`text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-all
            ${activeMenu === 'main' && mainMenuIndex === 0 ? 'bg-amber-500 text-black font-bold shadow-lg scale-105' : 'opacity-70'}
          `}
        >
          <Sword size={14} /> Атака
        </button>

        {/* Навык */}
        <button
          onClick={onOpenSkills}
          className={`text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-all
            ${activeMenu === 'main' && mainMenuIndex === 1 ? 'bg-amber-500 text-black font-bold shadow-lg scale-105' : ''}
            ${activeMenu === 'skills' ? 'bg-blue-800 text-yellow-300 font-bold border-l-4 border-yellow-300' : 'opacity-70'}
          `}
        >
          <Zap size={14} /> Навык
          <ChevronRight size={14} className={`ml-auto transition-transform ${activeMenu === 'skills' ? 'rotate-90' : ''}`} />
        </button>

        {/* Предмет */}
        <button
          onClick={onOpenItems}
          className={`text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-all
            ${activeMenu === 'main' && mainMenuIndex === 2 ? 'bg-amber-500 text-black font-bold shadow-lg scale-105' : ''}
            ${activeMenu === 'items' ? 'bg-blue-800 text-yellow-300 font-bold border-l-4 border-yellow-300' : 'opacity-70'}
          `}
        >
          <Briefcase size={14} /> Предмет
          <ChevronRight size={14} className={`ml-auto transition-transform ${activeMenu === 'items' ? 'rotate-90' : ''}`} />
        </button>

        {/* Уйти */}
        <button
          onClick={onFlee}
          className={`text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-all
            ${activeMenu === 'main' && mainMenuIndex === 3 ? 'bg-amber-500 text-black font-bold shadow-lg scale-105' : 'opacity-70'}
          `}
        >
          <Activity size={14} /> Уйти
        </button>
      </div>

      {/* Меню Навыков */}
      {activeMenu === 'skills' && (
        <div className="absolute top-8 left-8 bg-blue-900/95 backdrop-blur-sm border-2 border-slate-200 rounded-lg p-2 shadow-2xl min-w-45 text-white flex flex-col gap-1 font-sans animate-in slide-in-from-left-4 duration-200 pointer-events-auto z-10">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest px-1 mb-1 border-b border-blue-800">Магия / Навыки</div>
          <div className="max-h-40 overflow-y-auto overflow-x-hidden">
          {CLASSES[player.class].skills.map((skill, idx) => (
            <div
              key={skill.id}
              ref={el => { itemRefs.current[idx] = el; }}
              onClick={() => player.mp >= skill.mpCost ? onSkill(skill.id) : null}
              className={`text-left w-40 px-3 py-2 rounded text-sm flex flex-col transition-all
                ${subMenuIndex === idx ? 'bg-amber-500 text-black font-bold scale-105 shadow-md' : 'opacity-60'}
                ${player.mp >= skill.mpCost ? '' : 'opacity-30 grayscale'}
              `}
            >
              <div className="flex justify-between items-center w-full">
                <span>{skill.name}</span>
                <span className="text-[10px] font-mono">{skill.mpCost} MP</span>
              </div>
              {subMenuIndex === idx && <div className="text-[10px] opacity-80 mt-1 leading-tight">{skill.desc}</div>}
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Меню Предметов */}
      {activeMenu === 'items' && (
        <div className="absolute top-8 left-8 bg-blue-900/95 backdrop-blur-sm border-2 border-slate-200 rounded-lg p-2 shadow-2xl min-w-45 text-white flex flex-col gap-1 font-sans animate-in slide-in-from-left-4 duration-200 pointer-events-auto z-10">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest px-1 mb-1 border-b border-blue-800">Рюкзак</div>
          <div className="max-h-40 overflow-y-auto overflow-x-hidden">
            {(() => {
            const potions = Array.from(new Set(player.inventory.filter(item => item.startsWith('potion_'))));
            if (potions.length === 0) {
              return <div className="text-xs text-slate-400 p-4 italic text-center">Нет зелий...</div>;
            }
            return potions.map((item, idx) => {
              const count = player.inventory.filter(i => i === item).length;
              const stats = POTION_STATS[item as PotionType];
              return (
                <div
                  key={item}
                  ref={el => { itemRefs.current[idx] = el; }}
                  onClick={() => onItem(item)}
                  className={`text-left px-3 py-2 w-40 rounded text-sm flex justify-between items-center transition-all
                    ${subMenuIndex === idx ? 'bg-amber-500 text-black font-bold scale-105 shadow-md' : 'opacity-60'}
                  `}
                >
                  <span>{stats.name}</span>
                  <span className="text-xs font-mono bg-black/20 px-1.5 py-0.5 rounded text-white/90">x{count}</span>
                </div>
              );
            });
          })()}
          </div>
        </div>
      )}
    </div>
  );
};
