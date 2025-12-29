import { useEffect, useRef, useCallback } from 'react';
import type { CellData, Player, LogEntry, CombatTarget } from '../types';
import { GRID_SIZE, AGGRO_RADIUS, MONSTER_STATS } from '../constants';

interface UseEnemyAIProps {
  mode: 'dm' | 'player';
  combatTarget: CombatTarget | null;
  setGrid: (grid: CellData[][]) => void;
  player: Player;
  setPlayer: (player: Player | ((prev: Player) => Player)) => void;
  addLog: (text: string, type?: LogEntry['type']) => void;
  setMode: (mode: 'dm' | 'player') => void;
  setCombatTarget: (target: CombatTarget | null) => void;
}

export function useEnemyAI({
  mode,
  combatTarget,
  setGrid,
  player,
  setPlayer,
  addLog,
  setMode,
  setCombatTarget
}: UseEnemyAIProps) {
  
  // Оборачиваем в useCallback для стабильности
  const processEnemyTurn = useCallback((currentGrid: CellData[][], currentPlayer: Player, ignoreEnemyPos?: { x: number; y: number }) => {
    let enemyMoved = false;
    let damageToPlayer = 0;
    
    // Создаем копию
    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
    const enemies = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (newGrid[y][x].enemy) {
          enemies.push({ x, y, type: newGrid[y][x].enemy });
        }
      }
    }

    for (const enemy of enemies) {
      if (ignoreEnemyPos && enemy.x === ignoreEnemyPos.x && enemy.y === ignoreEnemyPos.y) {
          continue;
      }

      const dist = Math.sqrt(Math.pow(enemy.x - currentPlayer.x, 2) + Math.pow(enemy.y - currentPlayer.y, 2));

      if (dist <= AGGRO_RADIUS && dist > 0) {
        const enemyStats = MONSTER_STATS[enemy.type!];
        const levelMultiplier = 1 + (currentPlayer.dungeonLevel - 1) * 0.1;
        const scaledAtk = Math.floor(enemyStats.atk * levelMultiplier);

        if (dist <= 1.5) {
          const dmg = Math.max(0, scaledAtk - currentPlayer.def);
          damageToPlayer += dmg;
          addLog(`${enemyStats.name} атакует вас! -${dmg} HP`, 'combat');
        } else {
          let bestMove = { x: enemy.x, y: enemy.y, dist: dist };
          const moves = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

          for (const m of moves) {
            const nx = enemy.x + m.x;
            const ny = enemy.y + m.y;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              const target = newGrid[ny][nx];
              if (target.type !== 'wall' && !target.enemy && target.type !== 'door') {
                const newDist = Math.sqrt(Math.pow(nx - currentPlayer.x, 2) + Math.pow(ny - currentPlayer.y, 2));
                if (newDist < bestMove.dist) {
                  bestMove = { x: nx, y: ny, dist: newDist };
                }
              }
            }
          }

          if (bestMove.x !== enemy.x || bestMove.y !== enemy.y) {
            const currentHp = newGrid[enemy.y][enemy.x].enemyHp;

            newGrid[bestMove.y][bestMove.x].enemy = enemy.type;
            newGrid[bestMove.y][bestMove.x].enemyHp = currentHp;
            
            newGrid[enemy.y][enemy.x].enemy = null;
            newGrid[enemy.y][enemy.x].enemyHp = undefined;
            
            enemyMoved = true;
          }
        }
      }
    }

    if (enemyMoved) setGrid(newGrid);

    if (damageToPlayer > 0) {
      setPlayer(p => {
         const newHp = p.hp - damageToPlayer;
         if (newHp <= 0) {
            // Используем таймаут чтобы не блокировать рендер
            setTimeout(() => {
                addLog('💀 ВЫ ПОГИБЛИ! Рестарт...', 'fail');
                setMode('dm');
                setCombatTarget(null);
                localStorage.removeItem('dungeon_save_v1');
            }, 0);
         }
         return { ...p, hp: newHp };
      });
    }
  }, [setGrid, setPlayer, addLog, setMode, setCombatTarget]);

  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    if (mode !== 'player' || combatTarget) return;

    const timer = setInterval(() => {
      setGrid((prevGrid: CellData[][]) => {
        const currentPlayer = playerRef.current;
        let bossPos = null;
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (prevGrid[y][x].enemy === 'boss') {
              bossPos = { x, y };
              break;
            }
          }
          if (bossPos) break;
        }

        if (!bossPos) return prevGrid;

        const dist = Math.sqrt(Math.pow(bossPos.x - currentPlayer.x, 2) + Math.pow(bossPos.y - currentPlayer.y, 2));
        if (dist > AGGRO_RADIUS) {
          const moves = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          const nx = bossPos.x + randomMove.x;
          const ny = bossPos.y + randomMove.y;

          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const cell = prevGrid[ny][nx];
            if (cell.type !== 'wall' && !cell.enemy && cell.type !== 'door') {
              const newGrid = prevGrid.map(row => row.map(c => ({ ...c })));
              const currentHp = newGrid[bossPos.y][bossPos.x].enemyHp;
              newGrid[ny][nx].enemy = 'boss';
              newGrid[ny][nx].enemyHp = currentHp;
              newGrid[bossPos.y][bossPos.x].enemy = null;
              newGrid[bossPos.y][bossPos.x].enemyHp = undefined;
              return newGrid;
            }
          }
        }
        return prevGrid;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [mode, combatTarget, setGrid]);

  return { processEnemyTurn };
}