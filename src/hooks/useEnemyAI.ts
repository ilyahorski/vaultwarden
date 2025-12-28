import { useEffect } from 'react';
import type { CellData, Player, LogEntry, CombatTarget } from '../types';
import { GRID_SIZE, AGGRO_RADIUS, MONSTER_STATS } from '../constants';

interface UseEnemyAIProps {
  mode: 'dm' | 'player';
  combatTarget: CombatTarget | null;
  setGrid: (grid: CellData[][] | ((prev: CellData[][]) => CellData[][])) => void;
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
  
  const processEnemyTurn = (currentGrid: CellData[][], currentPlayer: Player) => {
    let enemyMoved = false;
    let damageToPlayer = 0;
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
            newGrid[bestMove.y][bestMove.x].enemy = enemy.type;
            newGrid[enemy.y][enemy.x].enemy = null;
            enemyMoved = true;
          }
        }
      }
    }

    if (enemyMoved) setGrid(newGrid);

    if (damageToPlayer > 0) {
      const newHp = currentPlayer.hp - damageToPlayer;
      setPlayer(p => ({ ...p, hp: newHp }));
      if (newHp <= 0) {
        addLog('💀 ВЫ ПОГИБЛИ! Рестарт...', 'fail');
        setMode('dm');
        setCombatTarget(null);
        localStorage.removeItem('dungeon_save_v1');
      }
    }
  };

  // Boss AI - случайное движение когда игрок далеко
  useEffect(() => {
    if (mode !== 'player' || combatTarget) return;

    const timer = setInterval(() => {
      setGrid((prevGrid: CellData[][]) => {
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

        const dist = Math.sqrt(Math.pow(bossPos.x - player.x, 2) + Math.pow(bossPos.y - player.y, 2));
        if (dist > AGGRO_RADIUS) {
          const moves = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          const nx = bossPos.x + randomMove.x;
          const ny = bossPos.y + randomMove.y;

          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const cell = prevGrid[ny][nx];
            if (cell.type !== 'wall' && !cell.enemy && cell.type !== 'door') {
              const newGrid = prevGrid.map(row => row.map(c => ({ ...c })));
              newGrid[ny][nx].enemy = 'boss';
              newGrid[bossPos.y][bossPos.x].enemy = null;
              return newGrid;
            }
          }
        }
        return prevGrid;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [mode, player.x, player.y, combatTarget, setGrid]);

  return { processEnemyTurn };
}
