import { useEffect } from 'react';
import type { CellData, GameMode, Player } from '../types';
import { GRID_SIZE, VISIBILITY_RADIUS, TORCH_RADIUS } from '../constants';
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
      // Сбрасываем видимость (но сохраняем isRevealed)
      const newGrid = grid.map(row => row.map(cell => ({ ...cell, isVisible: false })));
      
      // Находим все источники света (игрок + горящие факелы)
      const lightSources = [
        { x: player.x, y: player.y, r: VISIBILITY_RADIUS }
      ];

      // Сканируем карту на наличие горящих факелов
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (newGrid[y][x].type === 'torch_lit') {
            lightSources.push({ x, y, r: TORCH_RADIUS });
          }
        }
      }

      // Применяем источники света
      lightSources.forEach(source => {
          const { x: sx, y: sy, r } = source;
          // Оптимизация: перебираем только квадрат вокруг источника
          const minX = Math.max(0, sx - r);
          const maxX = Math.min(GRID_SIZE - 1, sx + r);
          const minY = Math.max(0, sy - r);
          const maxY = Math.min(GRID_SIZE - 1, sy + r);

          for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
               if (Math.sqrt(Math.pow(x - sx, 2) + Math.pow(y - sy, 2)) <= r) {
                 newGrid[y][x].isRevealed = true;
                 newGrid[y][x].isVisible = true;
               }
            }
          }
      });
      
      setGrid(newGrid);
    }
    // Добавляем player целиком, чтобы пересчитывать туман при трате ходов (например, при зажигании факела),
    // даже если координаты не изменились.
  }, [player, mode, grid, setGrid]); 
}