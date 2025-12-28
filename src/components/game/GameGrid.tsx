import React from 'react';
import type { CellData, GameMode } from '../../types';
import { GRID_SIZE, CELL_SIZE } from '../../constants';
import { GameCell } from './GameCell';

interface GameGridProps {
  grid: CellData[][];
  mode: GameMode;
  playerX: number;
  playerY: number;
  isMovingEnemy: { x: number; y: number } | null;
  onCellClick: (x: number, y: number) => void;
}

export function GameGrid({ grid, mode, playerX, playerY, isMovingEnemy, onCellClick }: GameGridProps) {
  return (
    <div 
      className="grid shadow-2xl bg-slate-950 border-[1px] border-black rounded-lg relative"
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
          mode={mode}
          playerX={playerX}
          playerY={playerY}
          isMovingEnemy={isMovingEnemy}
          onClick={onCellClick}
        />
      )))}
    </div>
  );
}
