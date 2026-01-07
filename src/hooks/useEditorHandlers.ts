import { type Dispatch, type SetStateAction, useCallback } from 'react';
import type { CellData, GameMode, Player, EnemyType, PotionType, WeaponType, ArmorType } from '../types';

interface UseEditorHandlersProps {
  mode: GameMode;
  selectedTool: string;
  isMovingEnemy: { x: number; y: number } | null;
  setIsMovingEnemy: Dispatch<SetStateAction<{ x: number; y: number } | null>>;
  grid: CellData[][];
  setGrid: Dispatch<SetStateAction<CellData[][]>>;
  setPlayer: Dispatch<SetStateAction<Player>>;
}

// Выносим список простых структурных типов в константу (readonly tuple)
const BASIC_STRUCTURE_TYPES = [
  'wall', 'floor', 'water', 'lava', 'grass', 'stairs_down', 'stairs_up', 'trap', 'torch', 'merchant', 'secret_button'
] as const;

export function useEditorHandlers({
  mode,
  selectedTool,
  isMovingEnemy,
  setIsMovingEnemy,
  grid,
  setGrid,
  setPlayer
}: UseEditorHandlersProps) {

  const handleCellClick = useCallback((x: number, y: number) => {
    if (mode !== 'dm') return;

    // 1. Движение врага
    if (selectedTool === 'move_enemy') {
      if (isMovingEnemy) {
        const sourceCell = grid[isMovingEnemy.y][isMovingEnemy.x];
        const targetCell = grid[y][x];
        if (targetCell.type !== 'wall' && !targetCell.enemy) {
          // Создаём новый grid с новыми объектами ячеек
          const newGrid = grid.map((row, ry) =>
            row.map((cell, rx) => {
              if (rx === x && ry === y) {
                // Целевая ячейка - получает врага
                return { ...cell, enemy: sourceCell.enemy, enemyHp: sourceCell.enemyHp };
              }
              if (rx === isMovingEnemy.x && ry === isMovingEnemy.y) {
                // Исходная ячейка - теряет врага
                return { ...cell, enemy: null, enemyHp: undefined };
              }
              return cell;
            })
          );
          setGrid(newGrid);
          setIsMovingEnemy(null);
        } else setIsMovingEnemy(null);
      } else {
        if (grid[y][x].enemy) setIsMovingEnemy({ x, y });
      }
      return;
    }

    // Создаём новый grid с новым объектом для изменяемой ячейки
    const newGrid = grid.map((row, ry) =>
      row.map((cell, rx) => {
        if (rx !== x || ry !== y) return cell;

        // Создаём копию ячейки для изменения
        const newCell = { ...cell };

        // 2. Инструменты
        if (selectedTool === 'start') {
          setPlayer(p => ({ ...p, x, y }));
          newCell.type = 'floor';
        }
        else if (selectedTool === 'clear') {
          newCell.item = null;
          newCell.enemy = null;
          newCell.enemyHp = undefined;
          newCell.type = 'floor';
          // Очищаем специальные флаги секретов
          newCell.isSecretTrigger = undefined;
          newCell.isHiddenRoom = undefined;
          newCell.originalType = undefined;
        }
        // Враги
        else if (selectedTool.startsWith('enemy_')) {
          newCell.enemy = selectedTool.replace('enemy_', '') as EnemyType;
          newCell.enemyHp = undefined; // Сбрасываем HP
          newCell.type = 'floor';
          newCell.item = null;
        }
        // Зелья (HP/MP)
        else if (selectedTool.startsWith('item_potion')) {
          newCell.item = selectedTool.replace('item_', '') as PotionType;
          newCell.type = 'floor';
        }
        // Оружие и Броня
        else if (selectedTool.startsWith('item_weapon_') || selectedTool.startsWith('item_armor_')) {
          newCell.item = selectedTool.replace('item_', '') as WeaponType | ArmorType;
          newCell.type = 'floor';
        }
        // Сундук
        else if (selectedTool === 'item_chest') {
          newCell.item = 'chest';
          newCell.type = 'floor';
        }
        // Структура (стены, пол и т.д.)
        else {
          if ((BASIC_STRUCTURE_TYPES as readonly string[]).includes(selectedTool)) {
            newCell.type = selectedTool as CellData['type'];

            if (selectedTool === 'wall') {
              newCell.item = null;
              newCell.enemy = null;
              newCell.enemyHp = undefined;
            }

            // Специальная обработка для секретных кнопок
            if (selectedTool === 'secret_button') {
              // Подсчитываем существующие кнопки на карте
              let existingButtons = 0;
              let existingTriggers = 0;

              for (let y = 0; y < grid.length; y++) {
                for (let x = 0; x < grid[0].length; x++) {
                  const cell = grid[y][x];
                  if (cell.type === 'secret_button' || cell.type === 'secret_button_activated') {
                    existingButtons++;
                    if (cell.isSecretTrigger === true) {
                      existingTriggers++;
                    }
                  }
                }
              }

              // Автоматически назначаем триггер, если их меньше 2
              newCell.isSecretTrigger = existingTriggers < 2;
            }
          }
          else if (selectedTool === 'door') {
            newCell.type = newCell.type === 'door' ? 'floor' : 'door';
          }
          else if (selectedTool === 'secret') {
            newCell.type = 'secret_door';
          }
        }

        return newCell;
      })
    );

    setGrid(newGrid);
  }, [mode, selectedTool, isMovingEnemy, grid, setGrid, setPlayer, setIsMovingEnemy]);

  return { handleCellClick };
}
