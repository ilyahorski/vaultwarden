import { useState, useEffect } from 'react';
import type { CellData, GameMode, ClassType, Direction } from '../../types';
import { GRID_SIZE, CELL_SIZE } from '../../constants';
import { GameCell } from './GameCell';

interface GameGridProps {
  grid: CellData[][];
  mode: GameMode;
  playerX: number;
  playerY: number;
  playerClass?: ClassType;
  playerDirection?: Direction;
  isMovingEnemy: { x: number; y: number } | null;
  onCellClick: (x: number, y: number) => void;
}

export function GameGrid({ grid, mode, playerX, playerY, playerClass, playerDirection, isMovingEnemy, onCellClick }: GameGridProps) {
  // Универсальный счетчик кадров для всех анимаций (не ограничен количеством кадров)
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    // Используем общий таймер, каждая анимация будет брать нужное количество кадров через модуль
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
    }, 80); // Общая скорость 80ms (~12.5 FPS)

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="grid shadow-2xl bg-black border border-black rounded-lg relative"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
        width: GRID_SIZE * CELL_SIZE,
        height: GRID_SIZE * CELL_SIZE
      }}
    >
      {grid.map((row, y) => row.map((cell, x) => (
        <GameCell
          key={`${x}-${y}`}
          cell={cell}
          grid={grid}
          mode={mode}
          playerX={playerX}
          playerY={playerY}
          playerClass={playerClass}
          playerDirection={playerDirection}
          isMovingEnemy={isMovingEnemy}
          onClick={onCellClick}
          animationFrame={animationFrame}
        />
      )))}
    </div>
  );
}
