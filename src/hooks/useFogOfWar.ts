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

export function useFogOfWar({ mode, player, grid, setGrid }: UseFogOfWarProps) {
  // Храним предыдущее количество зажженных факелов для отслеживания изменений
  const prevLitTorchesRef = useRef<number>(0);

  useEffect(() => {
    if (mode === 'player' && grid.length > 0) {
      const newGrid = grid.map(row => row.map(cell => ({ ...cell, isVisible: false })));

      // 1. Освещение от игрока (стандартный радиус видимости)
      for (let y = Math.max(0, player.y - VISIBILITY_RADIUS); y <= Math.min(GRID_SIZE - 1, player.y + VISIBILITY_RADIUS); y++) {
        for (let x = Math.max(0, player.x - VISIBILITY_RADIUS); x <= Math.min(GRID_SIZE - 1, player.x + VISIBILITY_RADIUS); x++) {
          if (Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)) <= VISIBILITY_RADIUS) {
            newGrid[y][x].isRevealed = true;
            newGrid[y][x].isVisible = true;
          }
        }
      }

      // 2. Освещение от зажженных факелов (радиус TORCH_LIGHT_RADIUS = 7)
      for (let torchY = 0; torchY < GRID_SIZE; torchY++) {
        for (let torchX = 0; torchX < GRID_SIZE; torchX++) {
          if (newGrid[torchY][torchX].type === 'torch_lit') {
            // Освещаем область вокруг факела
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

      setGrid(newGrid);
    }
  }, [player.x, player.y, mode]);

  // Отдельный эффект для отслеживания изменения количества зажженных факелов
  useEffect(() => {
    if (mode === 'player' && grid.length > 0) {
      // Подсчитываем текущее количество зажженных факелов
      let litTorchCount = 0;
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
          if (grid[y][x].type === 'torch_lit') {
            litTorchCount++;
          }
        }
      }

      // Если количество факелов изменилось, пересчитываем туман войны
      if (litTorchCount !== prevLitTorchesRef.current) {
        prevLitTorchesRef.current = litTorchCount;

        const newGrid = grid.map(row => row.map(cell => ({ ...cell, isVisible: false })));

        // 1. Освещение от игрока
        for (let y = Math.max(0, player.y - VISIBILITY_RADIUS); y <= Math.min(GRID_SIZE - 1, player.y + VISIBILITY_RADIUS); y++) {
          for (let x = Math.max(0, player.x - VISIBILITY_RADIUS); x <= Math.min(GRID_SIZE - 1, player.x + VISIBILITY_RADIUS); x++) {
            if (Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)) <= VISIBILITY_RADIUS) {
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

        setGrid(newGrid);
      }
    }
  }, [grid, mode, player.x, player.y, setGrid]);
}
