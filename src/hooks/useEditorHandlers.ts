import type { Dispatch, SetStateAction } from 'react';
import type { CellData, GameMode, Player } from '../types';

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
  
  const handleCellClick = (x: number, y: number) => {
    if (mode !== 'dm') return;
    
    if (selectedTool === 'move_enemy') {
      if (isMovingEnemy) {
        const sourceCell = grid[isMovingEnemy.y][isMovingEnemy.x];
        const targetCell = grid[y][x];
        if (targetCell.type !== 'wall' && !targetCell.enemy) {
          const newGrid = [...grid];
          newGrid[y][x].enemy = sourceCell.enemy;
          newGrid[isMovingEnemy.y][isMovingEnemy.x].enemy = null;
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
    
    if (selectedTool === 'wall') { cell.type = 'wall'; cell.item = null; cell.enemy = null; }
    else if (selectedTool === 'floor') { cell.type = 'floor'; }
    else if (selectedTool === 'water') { cell.type = 'water'; }
    else if (selectedTool === 'lava') { cell.type = 'lava'; }
    else if (selectedTool === 'grass') { cell.type = 'grass'; }
    else if (selectedTool === 'stairs_down') { cell.type = 'stairs_down'; }
    else if (selectedTool === 'stairs_up') { cell.type = 'stairs_up'; }
    else if (selectedTool === 'door') { cell.type = cell.type === 'door' ? 'floor' : 'door'; }
    else if (selectedTool === 'secret') { cell.type = 'secret_door'; }
    else if (selectedTool === 'trap') { cell.type = 'trap'; }
    else if (selectedTool === 'item_chest') { cell.item = 'chest'; cell.type = 'floor'; }
    else if (selectedTool === 'item_potion_weak') { cell.item = 'potion_weak'; cell.type = 'floor'; }
    else if (selectedTool === 'item_potion_mid') { cell.item = 'potion_mid'; cell.type = 'floor'; }
    else if (selectedTool === 'item_potion_strong') { cell.item = 'potion_strong'; cell.type = 'floor'; }
    else if (selectedTool === 'item_potion_mana') { cell.item = 'potion_mana'; cell.type = 'floor'; }
    else if (selectedTool === 'item_weapon_strong') { cell.item = 'weapon_strong'; cell.type = 'floor'; }
    else if (selectedTool === 'enemy_goblin') { cell.enemy = 'goblin'; cell.type = 'floor'; }
    else if (selectedTool === 'enemy_orc') { cell.enemy = 'orc'; cell.type = 'floor'; }
    else if (selectedTool === 'enemy_boss') { cell.enemy = 'boss'; cell.type = 'floor'; }
    else if (selectedTool === 'start') { setPlayer(p => ({ ...p, x, y })); cell.type = 'floor'; }
    else if (selectedTool === 'clear') { cell.item = null; cell.enemy = null; cell.type = 'floor'; }
    
    setGrid(newGrid);
  };

  return { handleCellClick };
}
