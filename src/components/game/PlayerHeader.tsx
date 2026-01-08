import React from 'react';
import { Dices, Sword, Shield, Coins, Footprints } from 'lucide-react';
import type { Player } from '../../types';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface PlayerHeaderProps {
  player: Player;
  activeRoll: number | null;
  onRollDice: () => void;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  player,
  activeRoll,
  onRollDice
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Компактная мобильная версия
    return (
      <div className="bg-slate-900 border-b border-slate-800 p-2 shrink-0 shadow-lg z-10">
        {/* Первая строка: Кнопка броска + HP/MP/XP бары */}
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onRollDice}
            disabled={activeRoll !== null && player.moves > 0}
            className={`
              flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition-all shrink-0
              ${player.moves <= 0
                ? 'bg-amber-600 border-amber-400 text-white animate-pulse'
                : activeRoll === null
                  ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse'
                  : activeRoll <= 5
                    ? 'bg-red-900/50 border-red-500 text-red-200'
                    : activeRoll >= 12
                      ? 'bg-yellow-900/50 border-yellow-500 text-yellow-200'
                      : 'bg-slate-800 border-slate-600 text-slate-300'
              }
            `}
          >
            <Dices size={12} />
            {player.moves <= 0
              ? 'D20'
              : activeRoll === null ? 'D20' : activeRoll
            }
          </button>

          {/* Бары HP/MP/XP - горизонтальные в ряд */}
          <div className="flex-1 flex gap-1">
            {/* HP */}
            <div className="flex-1">
              <div className="flex justify-between text-[8px] font-bold text-red-400 mb-0.5">
                <span>HP</span>
                <span>{player.hp}/{player.maxHp}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div className="h-full bg-red-600" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
              </div>
            </div>

            {/* MP */}
            <div className="flex-1">
              <div className="flex justify-between text-[8px] font-bold text-blue-400 mb-0.5">
                <span>MP</span>
                <span>{player.mp}/{player.maxMp}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div className="h-full bg-blue-500" style={{ width: `${(player.mp / player.maxMp) * 100}%` }} />
              </div>
            </div>

            {/* XP */}
            <div className="flex-1">
              <div className="flex justify-between text-[8px] font-bold text-yellow-400 mb-0.5">
                <span>L{player.level}</span>
                <span>{player.xp}/{player.nextLevelXp}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div className="h-full bg-yellow-500" style={{ width: `${(player.xp / player.nextLevelXp) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Вторая строка: Статы */}
        <div className="flex items-center justify-center gap-2 text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
          <div className="flex items-center gap-0.5 text-orange-400">
            <Sword size={10} />
            <span>{player.atk}</span>
          </div>
          <div className="flex items-center gap-0.5 text-gray-400">
            <Shield size={10} />
            <span>{player.def}</span>
          </div>
          <div className="w-px h-3 bg-slate-600"></div>
          <div className="flex items-center gap-0.5 text-yellow-400 font-bold">
            <Coins size={10} />
            <span>{player.gold}</span>
          </div>
          <div className="w-px h-3 bg-slate-600"></div>
          <div className={`flex items-center gap-0.5 font-bold ${player.moves === 0 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
            <Footprints size={10} />
            <span>{player.moves}/{player.maxMoves}</span>
          </div>
          <div className="w-px h-3 bg-slate-600"></div>
          <div className="text-slate-400">Эт.{player.dungeonLevel}</div>
        </div>
      </div>
    );
  }

  // Десктопная версия (без изменений)
  return (
    <div className="bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap gap-4 items-center justify-center shrink-0 shadow-lg z-10">
      {/* Action Roll Button */}
      <button
        onClick={onRollDice}
        disabled={activeRoll !== null && player.moves > 0}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-bold border-2 transition-all
          ${player.moves <= 0
            ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white animate-pulse'
            : activeRoll === null
              ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white animate-pulse'
              : activeRoll <= 5
                ? 'bg-red-900/50 border-red-500 text-red-200'
                : activeRoll >= 12
                  ? 'bg-yellow-900/50 border-yellow-500 text-yellow-200'
                  : 'bg-slate-800 border-slate-600 text-slate-300'
          }
        `}
      >
        <Dices size={20} />
        {player.moves <= 0
          ? 'ОТДЫХ (D20)'
          : activeRoll === null ? 'БРОСОК D20' : `РЕЗУЛЬТАТ: ${activeRoll}`
        }
      </button>

      {/* HP Bar */}
      <div className="flex flex-col w-full sm:w-auto">
        <div className="flex justify-between text-xs font-bold text-red-400 mb-1">
          <span>HP</span>
          <span>{player.hp} / {player.maxHp}</span>
        </div>
        <div className="w-full sm:w-36 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
          <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
        </div>
      </div>

      {/* MP Bar */}
      <div className="flex flex-col w-full sm:w-auto">
        <div className="flex justify-between text-xs font-bold text-blue-400 mb-1">
          <span>MP</span>
          <span>{player.mp} / {player.maxMp}</span>
        </div>
        <div className="w-full sm:w-36 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(player.mp / player.maxMp) * 100}%` }} />
        </div>
      </div>

      {/* XP Bar */}
      <div className="flex flex-col w-full sm:w-auto">
        <div className="flex justify-between text-xs font-bold text-yellow-400 mb-1">
          <span>LVL {player.level}</span>
          <span>{player.xp} / {player.nextLevelXp} XP</span>
        </div>
        <div className="w-full sm:w-36 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
          <div className="h-full bg-yellow-500 transition-all duration-300" style={{ width: `${(player.xp / player.nextLevelXp) * 100}%` }} />
        </div>
      </div>

      {/* Stats Compact (ATK/DEF/GOLD/MOVES/FLOOR) */}
      <div className="flex items-center gap-3 text-xs bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
        <div className="flex items-center gap-1 text-orange-400"><Sword size={14} /> <span>{player.atk}</span></div>
        <div className="flex items-center gap-1 text-gray-400"><Shield size={14} /> <span>{player.def}</span></div>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>
        <div className="flex items-center gap-1 text-yellow-400 font-bold"><Coins size={14} /> <span>{player.gold}</span></div>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>
        <div className={`flex items-center gap-1 font-bold ${player.moves === 0 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
          <Footprints size={14} />
          <span>{player.moves}/{player.maxMoves}</span>
        </div>
        <div className="w-px h-4 bg-slate-600 mx-1"></div>
        <div className="text-slate-400">Этаж {player.dungeonLevel}</div>
      </div>
    </div>
  );
};
