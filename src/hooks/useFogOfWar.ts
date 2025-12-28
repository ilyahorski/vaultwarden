import { useEffect } from 'react';
import type { CellData, GameMode, Player } from '../types';
import { GRID_SIZE, VISIBILITY_RADIUS } from '../constants';
import type { Dispatch, SetStateAction } from 'react';

interface UseFogOfWarProps {
  mode: GameMode;
  player: Player;
  grid: CellData[][];
  setGrid: Dispatch<SetStateAction<CellData[][]>>;
}

export function useFogOfWar({ mode, player, grid, setGrid }: UseFogOfWarProps) {
  useEffect(() => {
    if (mode === 'player' && grid.length > 0) {
      const newGrid = grid.map(row => row.map(cell => ({ ...cell, isVisible: false })));
      
      for (let y = Math.max(0, player.y - VISIBILITY_RADIUS); y <= Math.min(GRID_SIZE - 1, player.y + VISIBILITY_RADIUS); y++) {
        for (let x = Math.max(0, player.x - VISIBILITY_RADIUS); x <= Math.min(GRID_SIZE - 1, player.x + VISIBILITY_RADIUS); x++) {
          if (Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)) <= VISIBILITY_RADIUS) {
            newGrid[y][x].isRevealed = true;
            newGrid[y][x].isVisible = true;
          }
        }
      }
      
      setGrid(newGrid);
    }
  }, [player.x, player.y, mode]);
}
