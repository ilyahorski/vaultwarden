import { type Dispatch, type SetStateAction, useCallback } from 'react';
import type { CellData, GameMode, Player, EnemyType, PotionType, WeaponType, ArmorType } from '../types';

interface UseEditorHandlersProps {
  mode: GameMode;
  selectedTool: string;
  isMovingEnemy: { x: number; y: number } | null;
  setIsMovingEnemy: Dispatch<SetStateAction<{ x: number; y: number } | null>>;
  grid: CellData[][];
  setGrid: Dispatch<SetStateAction<CellData[][]>>;
  setPlayer: Dispatch<SetStateAction<Player>>;
}

export function useEditorHandlers({
  mode,
  selectedTool,
  isMovingEnemy,
  setIsMovingEnemy,
  grid,
  setGrid,
  setPlayer
}: UseEditorHandlersProps) {
  
  const handleCellClick = useCallback((x: number, y: number) => {
    if (mode !== 'dm') return;
    
    // 1. Движение врага
    if (selectedTool === 'move_enemy') {
      if (isMovingEnemy) {
        const sourceCell = grid[isMovingEnemy.y][isMovingEnemy.x];
        const targetCell = grid[y][x];
        if (targetCell.type !== 'wall' && !targetCell.enemy) {
          const newGrid = [...grid];
          // Переносим тип и HP
          newGrid[y][x].enemy = sourceCell.enemy;
          newGrid[y][x].enemyHp = sourceCell.enemyHp;
          
          newGrid[isMovingEnemy.y][isMovingEnemy.x].enemy = null;
          newGrid[isMovingEnemy.y][isMovingEnemy.x].enemyHp = undefined;
          
          setGrid(newGrid);
          setIsMovingEnemy(null);
        } else setIsMovingEnemy(null);
      } else {
        if (grid[y][x].enemy) setIsMovingEnemy({ x, y });
      }
      return;
    }
    
    const newGrid = [...grid];
    const cell = newGrid[y][x];
    
    // 2. Инструменты
    if (selectedTool === 'start') {
      setPlayer(p => ({ ...p, x, y }));
      cell.type = 'floor';
    } 
    else if (selectedTool === 'clear') {
      cell.item = null;
      cell.enemy = null;
      cell.type = 'floor';
    }
    // Враги
    else if (selectedTool.startsWith('enemy_')) {
      cell.enemy = selectedTool.replace('enemy_', '') as EnemyType;
      cell.type = 'floor';
      cell.item = null;
    }
    // Зелья (HP/MP)
    else if (selectedTool.startsWith('item_potion')) {
       // item_potion_weak, item_potion_mana_strong etc.
       // префикс 'item_' убираем, остается 'potion_weak' или 'potion_mana_strong'
       cell.item = selectedTool.replace('item_', '') as PotionType;
       cell.type = 'floor';
    }
    // Оружие и Броня
    else if (selectedTool.startsWith('item_weapon_') || selectedTool.startsWith('item_armor_')) {
       cell.item = selectedTool.replace('item_', '') as WeaponType | ArmorType;
       cell.type = 'floor';
    }
    // Сундук
    else if (selectedTool === 'item_chest') {
       cell.item = 'chest';
       cell.type = 'floor';
    }
    // Структура (стены, пол и т.д.)
    else {
       // Проверяем, валидный ли это CellType
       // (Можно типизировать строже, но пока оставляем как есть)
       const structureType = selectedTool; 
       if (['wall', 'floor', 'water', 'lava', 'grass', 'stairs_down', 'stairs_up', 'trap'].includes(structureType)) {
          cell.type = structureType as any;
          if (structureType === 'wall') { cell.item = null; cell.enemy = null; }
       }
       else if (structureType === 'door') {
          cell.type = cell.type === 'door' ? 'floor' : 'door';
       }
       else if (structureType === 'secret') {
          cell.type = 'secret_door';
       }
    }
    
    setGrid(newGrid);
  }, [mode, selectedTool, isMovingEnemy, grid, setGrid, setPlayer, setIsMovingEnemy]);

  return { handleCellClick };
}