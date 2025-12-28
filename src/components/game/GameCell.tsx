import React from 'react';
import {
  Skull,
  Ghost,
  Sword,
  Shield,
  Box,
  User,
  Lock,
  EyeOff,
  DoorOpen,
  Flame,
  Droplets,
  Trees,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle
} from 'lucide-react';
import type { CellData, GameMode, PotionType } from '../../types';
import { CELL_SIZE, MONSTER_STATS, POTION_STATS, AGGRO_RADIUS } from '../../constants';
import { calculateDistance } from '../../utils';

interface GameCellProps {
  cell: CellData;
  mode: GameMode;
  playerX: number;
  playerY: number;
  isMovingEnemy: { x: number; y: number } | null;
  onClick: (x: number, y: number) => void;
}

export const GameCell: React.FC<GameCellProps> = ({
  cell,
  mode,
  playerX,
  playerY,
  isMovingEnemy,
  onClick
}) => {
  if (mode === 'player' && !cell.isRevealed) {
    return <div className="w-full h-full bg-black" style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
  }

  let content = null;

  if (cell.enemy) {
    const info = MONSTER_STATS[cell.enemy];
    const dist = mode === 'player' ? calculateDistance(cell.x, cell.y, playerX, playerY) : 999;
    const isAggro = dist <= AGGRO_RADIUS && mode === 'player';

    content = (
      <div className="relative">
        {cell.enemy === 'boss'
          ? <Skull size={CELL_SIZE * 0.9} className="text-purple-500 animate-pulse drop-shadow-md" />
          : <Ghost size={CELL_SIZE * 0.7} className={info.color} />
        }
        {isAggro && (
          <div className="absolute -top-2 -right-2 text-red-500 animate-bounce">
            <AlertCircle size={8} fill="currentColor" />
          </div>
        )}
      </div>
    );
  } else if (cell.item) {
    if (cell.item.includes('potion')) {
      const color = POTION_STATS[cell.item as PotionType].color;
      content = <div className={`w-2.5 h-3.5 rounded-full ${color} shadow-lg border border-white/30`} />;
    } else if (cell.item.includes('weapon')) {
      content = <Sword size={CELL_SIZE * 0.7} className="text-blue-300" />;
    } else if (cell.item.includes('armor')) {
      content = <Shield size={CELL_SIZE * 0.7} className="text-slate-400" />;
    } else if (cell.item === 'chest') {
      content = <Box size={CELL_SIZE * 0.7} className="text-yellow-500" />;
    }
  }

  if (playerX === cell.x && playerY === cell.y) {
    content = <User size={CELL_SIZE * 0.8} className="text-white drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" fill="currentColor" />;
  }

  const baseClass = `w-full h-full flex items-center justify-center border-slate-800/20 relative select-none
     ${cell.type === 'wall' ? 'bg-zinc-600' : ''}
     ${cell.type === 'floor' ? 'bg-zinc-600/50' : ''}
     ${cell.type === 'water' ? 'bg-blue-800/80' : ''}
     ${cell.type === 'lava' ? 'bg-red-800/80' : ''}
     ${cell.type === 'grass' ? 'bg-green-900/50' : ''}
     ${cell.type === 'door' ? 'bg-amber-900' : ''}
     ${cell.type === 'door_open' ? 'bg-amber-900/30' : ''}
     ${cell.type === 'trap' ? 'bg-orange-900/30' : ''}
     ${cell.type === 'secret_door' && mode === 'dm' ? 'bg-purple-900/50 border-dashed border-purple-500' : ''}
     ${mode === 'dm' && isMovingEnemy?.x === cell.x && isMovingEnemy?.y === cell.y ? 'ring-2 ring-blue-500 z-20' : ''}
  `;

  return (
    <div
      onClick={() => onClick(cell.x, cell.y)}
      className={baseClass}
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
    >
      {content}

      {/* Иконки ландшафта (фоновые) */}
      {cell.type === 'water' && !content && <Droplets size={10} className="text-blue-400/30 absolute" />}
      {cell.type === 'lava' && !content && <Flame size={10} className="text-yellow-500/40 absolute animate-pulse" />}
      {cell.type === 'grass' && !content && <Trees size={10} className="text-green-400/20 absolute" />}
      {cell.type === 'stairs_down' && !content && <ArrowDownCircle size={14} className="text-blue-200" />}
      {cell.type === 'stairs_up' && !content && <ArrowUpCircle size={14} className="text-blue-200" />}

      {(cell.type === 'door' || (mode === 'dm' && cell.type === 'secret_door')) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {cell.type === 'door'
            ? <Lock size={12} className="text-amber-200 opacity-70" />
            : <EyeOff size={10} className="text-purple-300 opacity-50" />}
        </div>
      )}
      {cell.type === 'door_open' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <DoorOpen size={14} className="text-amber-500/50" />
        </div>
      )}

      {cell.type === 'trap' && (mode === 'dm' || cell.isRevealed) && <Flame size={12} className="absolute text-orange-500 opacity-70" />}

      {mode === 'player' && cell.isRevealed && !cell.isVisible && <div className="absolute inset-0 bg-black/50 z-10" />}
    </div>
  );
};
