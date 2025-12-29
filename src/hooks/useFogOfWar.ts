import { useEffect, useRef } from 'react';
import type { CellData, GameMode, Player } from '../types';
import { GRID_SIZE, VISIBILITY_RADIUS, TORCH_LIGHT_RADIUS } from '../constants';
import type { Dispatch, SetStateAction } from 'react';

interface UseFogOfWarProps {
  mode: GameMode;
  player: Player;
  grid: CellData[][];
  setGrid: Dispatch<SetStateAction<CellData[][]>>;
}

// Экспортируем функцию обновления видимости для использования в других местах
export function updateVisibility(currentGrid: CellData[][], px: number, py: number): CellData[][] {
  const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell, isVisible: false })));

  // 1. Освещение от игрока
  for (let y = Math.max(0, py - VISIBILITY_RADIUS); y <= Math.min(GRID_SIZE - 1, py + VISIBILITY_RADIUS); y++) {
    for (let x = Math.max(0, px - VISIBILITY_RADIUS); x <= Math.min(GRID_SIZE - 1, px + VISIBILITY_RADIUS); x++) {
      if (Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2)) <= VISIBILITY_RADIUS) {
        newGrid[y][x].isRevealed = true;
        newGrid[y][x].isVisible = true;
      }
    }
  }

  // 2. Освещение от зажженных факелов
  for (let torchY = 0; torchY < GRID_SIZE; torchY++) {
    for (let torchX = 0; torchX < GRID_SIZE; torchX++) {
      if (newGrid[torchY][torchX].type === 'torch_lit') {
        for (let y = Math.max(0, torchY - TORCH_LIGHT_RADIUS); y <= Math.min(GRID_SIZE - 1, torchY + TORCH_LIGHT_RADIUS); y++) {
          for (let x = Math.max(0, torchX - TORCH_LIGHT_RADIUS); x <= Math.min(GRID_SIZE - 1, torchX + TORCH_LIGHT_RADIUS); x++) {
            if (Math.sqrt(Math.pow(x - torchX, 2) + Math.pow(y - torchY, 2)) <= TORCH_LIGHT_RADIUS) {
              newGrid[y][x].isRevealed = true;
              newGrid[y][x].isVisible = true;
            }
          }
        }
      }
    }
  }

  return newGrid;
}

export function useFogOfWar({ mode, player, grid, setGrid }: UseFogOfWarProps) {
  // Храним предыдущие координаты игрока
  const prevPosRef = useRef<{ x: number; y: number }>({ x: -1, y: -1 });

  // Эффект срабатывает ТОЛЬКО при изменении координат игрока
  useEffect(() => {
    if (mode !== 'player' || grid.length === 0) return;

    const playerMoved = prevPosRef.current.x !== player.x || prevPosRef.current.y !== player.y;

    if (playerMoved) {
      prevPosRef.current = { x: player.x, y: player.y };
      setGrid(prevGrid => updateVisibility(prevGrid, player.x, player.y));
    }
  }, [mode, player.x, player.y, setGrid, grid.length]);
}
