import { useEffect, useRef } from 'react';
import type { CellData, Player, LogEntry, CombatTarget, EnemyType } from '../types';
// EnemyType используется как NonNullable<EnemyType> ниже
import { GRID_SIZE, AGGRO_RADIUS, MONSTER_STATS } from '../constants';

interface UseEnemyAIProps {
  mode: 'dm' | 'player';
  combatTarget: CombatTarget | null;
  setGrid: (grid: CellData[][] | ((prev: CellData[][]) => CellData[][])) => void;
  player: Player;
  setPlayer: (player: Player | ((prev: Player) => Player)) => void;
  addLog: (text: string, type?: LogEntry['type']) => void;
  resetGame: () => void;
}

export function useEnemyAI({
  mode,
  combatTarget,
  setGrid,
  player,
  setPlayer,
  addLog,
  resetGame
}: UseEnemyAIProps) {
  
  const processEnemyTurn = (currentGrid: CellData[][], currentPlayer: Player) => {
    let damageToPlayer = 0;

    // Сначала собираем врагов без создания копии grid
    const enemies: Array<{ x: number; y: number; type: NonNullable<EnemyType> }> = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentGrid[y][x].enemy) {
          enemies.push({ x, y, type: currentGrid[y][x].enemy! });
        }
      }
    }

    // Если врагов нет - выходим
    if (enemies.length === 0) return;

    // Собираем движения врагов
    const movements: Array<{ fromX: number; fromY: number; toX: number; toY: number; type: NonNullable<EnemyType>; hp: number | undefined }> = [];

    for (const enemy of enemies) {
      const dist = Math.sqrt(Math.pow(enemy.x - currentPlayer.x, 2) + Math.pow(enemy.y - currentPlayer.y, 2));

      if (dist <= AGGRO_RADIUS && dist > 0) {
        const enemyStats = MONSTER_STATS[enemy.type];
        const levelMultiplier = 1 + (currentPlayer.dungeonLevel - 1) * 0.1;
        const scaledAtk = Math.floor(enemyStats.atk * levelMultiplier);

        if (dist <= 1.5) {
          // Враг рядом - атакует
          const dmg = Math.max(0, scaledAtk - currentPlayer.def);
          damageToPlayer += dmg;
          addLog(`${enemyStats.name} атакует вас! -${dmg} HP`, 'combat');
        } else {
          // Враг далеко - ищем лучший ход
          let bestMove = { x: enemy.x, y: enemy.y, dist: dist };
          const moves = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

          for (const m of moves) {
            const nx = enemy.x + m.x;
            const ny = enemy.y + m.y;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              const target = currentGrid[ny][nx];
              if (target.type !== 'wall' && !target.enemy && target.type !== 'door') {
                const newDist = Math.sqrt(Math.pow(nx - currentPlayer.x, 2) + Math.pow(ny - currentPlayer.y, 2));
                if (newDist < bestMove.dist) {
                  bestMove = { x: nx, y: ny, dist: newDist };
                }
              }
            }
          }

          if (bestMove.x !== enemy.x || bestMove.y !== enemy.y) {
            movements.push({
              fromX: enemy.x,
              fromY: enemy.y,
              toX: bestMove.x,
              toY: bestMove.y,
              type: enemy.type,
              hp: currentGrid[enemy.y][enemy.x].enemyHp
            });
          }
        }
      }
    }

    // Создаём копию grid только если есть движения
    if (movements.length > 0) {
      const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));

      for (const move of movements) {
        newGrid[move.toY][move.toX].enemy = move.type;
        newGrid[move.toY][move.toX].enemyHp = move.hp;

        newGrid[move.fromY][move.fromX].enemy = null;
        newGrid[move.fromY][move.fromX].enemyHp = undefined;
      }

      setGrid(newGrid);
    }

    if (damageToPlayer > 0) {
      const newHp = currentPlayer.hp - damageToPlayer;
      if (newHp <= 0) {
        // Игрок погиб - полный сброс игры
        resetGame();
        alert('ВЫ ПОГИБЛИ! Игра будет перезапущена.');
        return;
      }
      setPlayer(p => ({ ...p, hp: newHp }));
    }
  };

  // Реф для хранения актуального состояния игрока
  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // Boss AI - случайное движение когда игрок далеко
  // Реф для отслеживания наличия босса на карте
  const hasBossRef = useRef(false);

  useEffect(() => {
    if (mode !== 'player' || combatTarget) return;

    const timer = setInterval(() => {
      setGrid((prevGrid: CellData[][]) => {
        // Сначала проверяем есть ли босс - без создания копий
        let bossPos: { x: number; y: number } | null = null;
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (prevGrid[y][x].enemy === 'boss') {
              bossPos = { x, y };
              break;
            }
          }
          if (bossPos) break;
        }

        // Если босса нет - выходим сразу, без копирования
        if (!bossPos) {
          hasBossRef.current = false;
          return prevGrid;
        }
        hasBossRef.current = true;

        const currentPlayer = playerRef.current;
        const dist = Math.sqrt(Math.pow(bossPos.x - currentPlayer.x, 2) + Math.pow(bossPos.y - currentPlayer.y, 2));

        // Босс двигается только если игрок далеко
        if (dist <= AGGRO_RADIUS) return prevGrid;

        const moves = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        const nx = bossPos.x + randomMove.x;
        const ny = bossPos.y + randomMove.y;

        // Проверяем можно ли двигаться
        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) return prevGrid;

        const targetCell = prevGrid[ny][nx];
        if (targetCell.type === 'wall' || targetCell.enemy || targetCell.type === 'door') return prevGrid;

        // Только здесь создаём копию - когда точно будем двигать босса
        const newGrid = prevGrid.map(row => row.map(c => ({ ...c })));

        const currentHp = newGrid[bossPos.y][bossPos.x].enemyHp;

        newGrid[ny][nx].enemy = 'boss';
        newGrid[ny][nx].enemyHp = currentHp;

        newGrid[bossPos.y][bossPos.x].enemy = null;
        newGrid[bossPos.y][bossPos.x].enemyHp = undefined;

        return newGrid;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [mode, combatTarget, setGrid]);

  return { processEnemyTurn };
}