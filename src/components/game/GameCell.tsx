import React from 'react';
import {
  Skull, Ghost, Crown, Sword, Shield, Box, User, Lock, EyeOff,
  DoorOpen, Flame, Droplets, Trees, ArrowDownCircle, ArrowUpCircle,
  AlertCircle, FlaskConical, Bug
} from 'lucide-react';
import type { CellData, GameMode, PotionType, WeaponType, ArmorType } from '../../types';
import { CELL_SIZE, MONSTER_STATS, POTION_STATS, AGGRO_RADIUS, GEAR_STATS } from '../../constants';
import { calculateDistance } from '../../utils';

interface GameCellProps {
  cell: CellData;
  mode: GameMode;
  playerX: number;
  playerY: number;
  isMovingEnemy: { x: number; y: number } | null;
  onClick: (x: number, y: number) => void;
}

export const GameCell: React.FC<GameCellProps> = React.memo(({
  cell, mode, playerX, playerY, isMovingEnemy, onClick
}) => {
  if (mode === 'player' && !cell.isRevealed) {
    return <div className="w-full h-full bg-black" style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
  }

  let content = null;
  let tooltip = '';

  // --- ЛОГИКА ВРАГОВ ---
  if (cell.enemy) {
    const info = MONSTER_STATS[cell.enemy];
    // Проверка на случай старых сохранений или ошибок генерации
    if (info) {
      tooltip = `${info.name} (HP: ${cell.enemyHp ?? info.hp}, ATK: ${info.atk})`;
      
      const dist = mode === 'player' ? calculateDistance(cell.x, cell.y, playerX, playerY) : 999;
      const isAggro = dist <= AGGRO_RADIUS && mode === 'player';
      
      let EnemyIcon = Ghost;
      if (info.iconType === 'skull') EnemyIcon = Skull;
      if (info.iconType === 'crown') EnemyIcon = Crown;
      if (info.iconType === 'snake') EnemyIcon = Bug;

      const colorClass = info.color.startsWith('text-') ? info.color : `text-${info.color}-500`;

      content = (
        <div className="relative">
          <EnemyIcon 
            size={CELL_SIZE * 0.8} 
            className={`${colorClass} ${cell.enemy === 'boss' || cell.enemy === 'lich' ? 'animate-pulse drop-shadow-md' : ''}`} 
            fill="currentColor"
            fillOpacity={0.2}
          />
          {isAggro && (
            <div className="absolute -top-2 -right-2 text-red-500 animate-bounce">
              <AlertCircle size={8} fill="currentColor" />
            </div>
          )}
        </div>
      );
    }
  } 
  // --- ЛОГИКА ПРЕДМЕТОВ ---
  else if (cell.item) {
    if (cell.item.includes('potion')) {
      const stats = POTION_STATS[cell.item as PotionType];
      if (stats) {
        tooltip = `${stats.name} (${stats.type === 'hp' ? 'HP' : 'MP'} +${stats.type === 'hp' ? stats.heal : stats.mana})`;
        const colorClass = `text-${stats.color}`;
        
        content = (
          <FlaskConical 
            size={CELL_SIZE * 0.7} 
            className={`${colorClass} drop-shadow-sm`} 
            fill="currentColor" 
            fillOpacity={0.6}
          />
        );
      }
    } else if (cell.item.includes('weapon')) {
      const stats = GEAR_STATS[cell.item as WeaponType];
      if (stats) {
        tooltip = `${stats.name} (+${stats.val} ATK)`;
        content = <Sword size={CELL_SIZE * 0.7} className={stats.color} />;
      }
    } else if (cell.item.includes('armor')) {
      const stats = GEAR_STATS[cell.item as ArmorType];
      if (stats) {
        tooltip = `${stats.name} (+${stats.val} DEF)`;
        content = <Shield size={CELL_SIZE * 0.7} className={stats.color} />;
      }
    } else if (cell.item === 'chest') {
      tooltip = 'Сундук с сокровищами';
      content = <Box size={CELL_SIZE * 0.7} className="text-amber-500" />;
    } else if (cell.item === 'gold') {
      tooltip = 'Золото';
      content = <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.8)]" />;
    }
  }

  if (playerX === cell.x && playerY === cell.y) {
    content = <User size={CELL_SIZE * 0.8} className="text-white drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" fill="currentColor" />;
    tooltip = 'Это вы';
  }

  const baseClass = `w-full h-full flex items-center justify-center border-slate-800/20 relative select-none
     ${cell.type === 'wall' ? 'bg-zinc-600' : ''}
     ${cell.type === 'floor' ? 'bg-zinc-600/50' : ''}
     ${cell.type === 'water' ? 'bg-blue-800/80' : ''}
     ${cell.type === 'lava' ? 'bg-red-800/80' : ''}
     ${cell.type === 'grass' ? 'bg-green-900/50' : ''}
     ${cell.type === 'door' ? 'bg-amber-900' : ''}
     ${cell.type === 'door_open' ? 'bg-amber-900/30 cursor-pointer hover:bg-amber-900/50' : ''}
     ${cell.type === 'trap' ? 'bg-orange-900/30' : ''}
     ${cell.type === 'secret_door' && mode === 'dm' ? 'bg-purple-900/50 border-dashed border-purple-500' : ''}
     ${cell.type === 'torch' ? 'bg-zinc-600/50' : ''}
     ${cell.type === 'torch_lit' ? 'bg-amber-900/40' : ''}
     ${mode === 'dm' && isMovingEnemy?.x === cell.x && isMovingEnemy?.y === cell.y ? 'ring-2 ring-blue-500 z-20' : ''}
  `;

  if (cell.type === 'door_open' && !tooltip) {
    tooltip = 'Кликните, чтобы закрыть';
  }

  if (cell.type === 'torch' && !tooltip) {
    tooltip = 'Потухший факел';
  }

  if (cell.type === 'torch_lit' && !tooltip) {
    tooltip = 'Горящий факел';
  }

  return (
    <div
      onClick={() => onClick(cell.x, cell.y)}
      className={baseClass}
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
      title={tooltip}
    >
      {content}

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

      {cell.type === 'torch' && !content && (
        <Flame size={12} className="absolute text-slate-500 opacity-60" />
      )}
      {cell.type === 'torch_lit' && !content && (
        <Flame size={14} className="absolute text-orange-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
      )}

      {mode === 'player' && cell.isRevealed && !cell.isVisible && <div className="absolute inset-0 bg-zinc-300/10 z-10" />}
    </div>
  );
});