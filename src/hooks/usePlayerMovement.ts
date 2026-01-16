import type { CellData, Player, LogEntry, CombatTarget, Direction } from '../types';
import { GRID_SIZE, MONSTER_STATS, POTION_STATS, GEAR_STATS, RARE_ARTIFACTS, MAX_INVENTORY_SIZE } from '../constants';
import type { PotionType, WeaponType, ArmorType } from '../types';
import { updateVisibility } from './useFogOfWar';
import { checkPlayerDeath, clampHp } from '../utils';
import { generateWorldMapGrid } from '../utils/townGenerator';

// Вспомогательная функция проверки соседства с костром
const checkAdjacentBonfire = (grid: CellData[][], x: number, y: number): boolean => {
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE) {
      if (grid[ny][nx].type === 'bonfire') return true;
    }
  }
  return false;
};

interface UsePlayerMovementProps {
  grid: CellData[][];
  setGrid: (grid: CellData[][]) => void;
  player: Player;
  setPlayer: (player: Player | ((prev: Player) => Player)) => void;
  activeRoll: number | null;
  setActiveRoll: (roll: number | null) => void;
  addLog: (text: string, type?: LogEntry['type']) => void;
  setCombatTarget: (target: CombatTarget | null) => void;
  setActiveMenu: (menu: 'main' | 'skills' | 'items') => void;
  setMainMenuIndex: (index: number) => void;
  processEnemyTurn: (grid: CellData[][], player: Player) => void;
  levelHistory: Record<number, CellData[][]>;
  setLevelHistory: (history: Record<number, CellData[][]>) => void;
  generateDungeon: (level: number) => void;
  logs: LogEntry[];
  resetGame: () => void;
  viewportOffset: { x: number; y: number };
  setViewportOffset: (offset: { x: number; y: number }) => void;
}

export function usePlayerMovement({
  grid,
  setGrid,
  player,
  setPlayer,
  activeRoll: _activeRoll,
  setActiveRoll: _setActiveRoll,
  addLog,
  setCombatTarget,
  setActiveMenu,
  setMainMenuIndex,
  processEnemyTurn,
  levelHistory,
  setLevelHistory,
  generateDungeon,
  logs: _logs,
  resetGame,
  viewportOffset,
  setViewportOffset
}: UsePlayerMovementProps) {
  // Unused props are prefixed with _ to suppress TypeScript errors
  void _activeRoll;
  void _setActiveRoll;
  void _logs;
  
  const movePlayer = (dx: number, dy: number) => {
    // Для world map (уровень 1) движение управляется через Excalibur PlayerActor
    // usePlayerMovement работает только для dungeon levels (2+)
    if (player.dungeonLevel === 1) {
      return;
    }

    // Определяем направление движения
    let direction: Direction = player.facing || 'down';
    if (dx < 0) direction = 'left';
    else if (dx > 0) direction = 'right';
    else if (dy < 0) direction = 'up';
    else if (dy > 0) direction = 'down';

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) return;
    const targetCell = grid[newY][newX];

    if (targetCell.enemy) {
      setCombatTarget({ x: newX, y: newY, enemy: targetCell.enemy });
      setActiveMenu('main');
      setMainMenuIndex(0);
      addLog(`Встречен ${MONSTER_STATS[targetCell.enemy].name}. Ждем приказа.`, 'info');
      return;
    }

    const updates = { ...player };
    let currentGrid = grid;

    // --- ЛОГИКА ЛЕСТНИЦ ---
    if (targetCell.type === 'stairs_down') {
      addLog(`Вы спускаетесь глубже... Этаж ${updates.dungeonLevel + 1}`, 'level');

      const currentHistory = { ...levelHistory, [updates.dungeonLevel]: grid };
      const nextLevel = updates.dungeonLevel + 1;

      updates.dungeonLevel = nextLevel;

      if (currentHistory[nextLevel]) {
        setGrid(currentHistory[nextLevel]);
        let startX = 1, startY = 1;
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (currentHistory[nextLevel][y][x].type === 'stairs_up') {
              startX = x;
              startY = y;
            }
          }
        }
        updates.x = startX;
        updates.y = startY;
        setPlayer(updates);
        setLevelHistory(currentHistory);
      } else {
        setLevelHistory(currentHistory);
        setPlayer(updates);
        setTimeout(() => generateDungeon(nextLevel), 0);
      }
      return;
    }

    if (targetCell.type === 'stairs_up') {
      if (updates.dungeonLevel > 1) {
        addLog(`Вы поднимаетесь выше... Этаж ${updates.dungeonLevel - 1}`, 'info');
        const currentHistory = { ...levelHistory, [updates.dungeonLevel]: grid };
        const prevLevel = updates.dungeonLevel - 1;
        updates.dungeonLevel = prevLevel;

        if (currentHistory[prevLevel]) {
          setGrid(currentHistory[prevLevel]);
          let startX = 1, startY = 1;
          for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
              if (currentHistory[prevLevel][y][x].type === 'stairs_down') {
                startX = x;
                startY = y;
              }
            }
          }
          updates.x = startX;
          updates.y = startY;
          setPlayer(updates);
          setLevelHistory(currentHistory);
        }
        return;
      } else {
        addLog("Это выход на поверхность. Вы не можете уйти без победы!", 'info');
        return;
      }
    }

    if (targetCell.type === 'wall' || targetCell.type === 'torch' || targetCell.type === 'torch_lit' || targetCell.type === 'merchant' || targetCell.type === 'bonfire') {
      // Нельзя пройти через эти препятствия
      processEnemyTurn(currentGrid, updates);
      return;
    }

    if (targetCell.type === 'door') {
      // Двери открываются автоматически (без D20)
      addLog('Дверь открыта.', 'info');
      const newGrid = currentGrid.map((row, ry) =>
        row.map((cell, rx) => rx === newX && ry === newY ? { ...cell, type: 'door_open' as const } : cell)
      );
      setGrid(newGrid);
      currentGrid = newGrid;

      setPlayer(updates);
      processEnemyTurn(currentGrid, updates);
      return;
    }

    if (targetCell.item) {
      const itemKey = targetCell.item;
      let consumed = true;

      if (itemKey.includes('potion')) {
        const potion = POTION_STATS[itemKey as PotionType];

        if (updates.inventory.length < MAX_INVENTORY_SIZE) {
          updates.inventory = [...updates.inventory, itemKey as PotionType];
          addLog(`Подобрано: ${potion.name}`, 'loot');
        } else {
          addLog('Рюкзак полон! Использовано на месте.', 'info');
          if (potion.type === 'hp') {
            updates.hp = Math.min(updates.maxHp, updates.hp + potion.heal);
            addLog(`Восстановлено ${potion.heal} HP`, 'success');
          } else {
            updates.mp = Math.min(updates.maxMp, updates.mp + potion.mana);
            addLog(`Восстановлено ${potion.mana} MP`, 'success');
          }
        }
      } else if (itemKey.includes('weapon')) {
        const weapon = GEAR_STATS[itemKey as WeaponType];
        const currentWeaponVal = player.equippedWeapon ? GEAR_STATS[player.equippedWeapon].val : 0;

        if (weapon.val > currentWeaponVal) {
          // Новое оружие лучше — экипируем
          const newAtk = (player.atk - currentWeaponVal) + weapon.val;
          addLog(`Экипировано: ${weapon.name} (+${weapon.val} ATK). Было: +${currentWeaponVal}`, 'loot');
          updates.atk = newAtk;
          updates.equippedWeapon = itemKey as WeaponType;
        } else if (updates.inventory.length < MAX_INVENTORY_SIZE) {
          // Хуже текущего, но есть место в рюкзаке — кладём туда
          updates.inventory = [...updates.inventory, itemKey as WeaponType];
          addLog(`${weapon.name} (+${weapon.val}) слабее текущего (+${currentWeaponVal}). В рюкзак.`, 'loot');
        } else {
          // Хуже и нет места — оставляем
          addLog(`${weapon.name} (+${weapon.val}) хуже текущего (+${currentWeaponVal}). Рюкзак полон!`, 'info');
          consumed = false;
        }
      } else if (itemKey.includes('armor')) {
        const armor = GEAR_STATS[itemKey as ArmorType];
        const currentArmorVal = player.equippedArmor ? GEAR_STATS[player.equippedArmor].val : 0;

        if (armor.val > currentArmorVal) {
          // Новая броня лучше — экипируем
          const newDef = (player.def - currentArmorVal) + armor.val;
          addLog(`Экипировано: ${armor.name} (+${armor.val} DEF). Было: +${currentArmorVal}`, 'loot');
          updates.def = newDef;
          updates.equippedArmor = itemKey as ArmorType;
        } else if (updates.inventory.length < MAX_INVENTORY_SIZE) {
          // Хуже текущего, но есть место в рюкзаке — кладём туда
          updates.inventory = [...updates.inventory, itemKey as ArmorType];
          addLog(`${armor.name} (+${armor.val}) слабее текущей (+${currentArmorVal}). В рюкзак.`, 'loot');
        } else {
          // Хуже и нет места — оставляем
          addLog(`${armor.name} (+${armor.val}) хуже текущей (+${currentArmorVal}). Рюкзак полон!`, 'info');
          consumed = false;
        }
      } else if (itemKey === 'gold') {
        // Подбор золотой монеты (фиксированная сумма)
        const goldAmount = 10 + Math.floor(Math.random() * 15); // 10-24 золота
        updates.gold += goldAmount;
        addLog(`Найдено ${goldAmount} золота!`, 'loot');
      } else if (itemKey === 'chest') {
        // 25% шанс на артефакт (без D20)
        const isArtifact = Math.random() < 0.25;
        if (isArtifact) {
          const artifact = RARE_ARTIFACTS[Math.floor(Math.random() * RARE_ARTIFACTS.length)];
          addLog(`СОКРОВИЩЕ! Найден ${artifact.name}!`, 'loot');
          addLog(`Продано за ${artifact.val} золота.`, 'loot');
          updates.gold += artifact.val;
        } else {
          const gold = 50 + Math.floor(Math.random() * 50);
          addLog(`Сундук открыт! Найдено ${gold} золота.`, 'loot');
          updates.gold += gold;
        }
      }

      if (consumed) {
        const newGrid = currentGrid.map((row, ry) =>
          row.map((cell, rx) => rx === newX && ry === newY ? { ...cell, item: null } : cell)
        );
        setGrid(newGrid);
        currentGrid = newGrid;
      }
    }

    if (targetCell.type === 'trap') {
      // Ловушки наносят фиксированный урон (без D20)
      const dmg = 15;
      addLog('Вы наступили на ЛОВУШКУ!', 'fail');
      updates.hp = clampHp(updates.hp - dmg, updates.maxHp);
      if (checkPlayerDeath(updates.hp, resetGame, addLog)) return;
    }

    if (targetCell.type === 'lava') {
      addLog("Вы наступили в ЛАВУ! -1 HP", 'fail');
      updates.hp = clampHp(updates.hp - 1, updates.maxHp);
      if (checkPlayerDeath(updates.hp, resetGame, addLog)) return;
    }

    updates.x = newX;
    updates.y = newY;
    updates.facing = direction; // Сохраняем направление движения

    setPlayer(updates);

    // Для уровня 1 (мировая карта) - инкрементальная прокрутка viewport
    if (updates.dungeonLevel === 1) {
      // Определяем пороги для прокрутки (ближе к краю = более частая прокрутка)
      const scrollMargin = 10; // Начинаем прокрутку когда игрок в пределах 10 клеток от края

      let shouldScroll = false;
      let scrollDx = 0;
      let scrollDy = 0;

      // Определяем направление прокрутки на основе направления движения
      if (direction === 'left' && updates.x < scrollMargin) {
        scrollDx = -1;
        shouldScroll = true;
      } else if (direction === 'right' && updates.x >= GRID_SIZE - scrollMargin) {
        scrollDx = 1;
        shouldScroll = true;
      }

      if (direction === 'up' && updates.y < scrollMargin) {
        scrollDy = -1;
        shouldScroll = true;
      } else if (direction === 'down' && updates.y >= GRID_SIZE - scrollMargin) {
        scrollDy = 1;
        shouldScroll = true;
      }

      if (shouldScroll) {
        // Вычисляем новый offset viewport (сдвигаем на 1 тайл в направлении движения)
        let newOffsetX = viewportOffset.x + scrollDx;
        let newOffsetY = viewportOffset.y + scrollDy;

        // Проверяем границы карты (не выходим за пределы)
        if (newOffsetX < 0) newOffsetX = 0;
        if (newOffsetY < 0) newOffsetY = 0;

        // Вычисляем глобальные координаты для центрирования viewport
        const halfSize = Math.floor(GRID_SIZE / 2);
        const centerGlobalX = newOffsetX + halfSize;
        const centerGlobalY = newOffsetY + halfSize;

        // Генерируем новый viewport вокруг нового offset
        const newGrid = generateWorldMapGrid(centerGlobalX, centerGlobalY);

        // Обновляем позицию игрока: компенсируем сдвиг viewport
        // Если viewport сдвинулся вправо (+1), игрок должен сдвинуться влево (-1) в локальных координатах
        const compensatedX = updates.x - scrollDx;
        const compensatedY = updates.y - scrollDy;

        // Проверяем, что компенсированная позиция в пределах viewport
        if (compensatedX >= 0 && compensatedX < GRID_SIZE &&
            compensatedY >= 0 && compensatedY < GRID_SIZE) {

          // Проверяем безопасность тайла под игроком
          const cellUnderPlayer = newGrid[compensatedY]?.[compensatedX];
          const isSafe = cellUnderPlayer &&
                        cellUnderPlayer.type !== 'wall' &&
                        cellUnderPlayer.type !== 'water' &&
                        cellUnderPlayer.type !== 'lava' &&
                        !cellUnderPlayer.enemy;

          if (!isSafe) {
            // Тайл небезопасен - ищем безопасное место рядом
            let safeX = compensatedX;
            let safeY = compensatedY;
            let found = false;

            for (let radius = 1; radius <= 3 && !found; radius++) {
              for (let dy = -radius; dy <= radius && !found; dy++) {
                for (let dx = -radius; dx <= radius && !found; dx++) {
                  const checkY = compensatedY + dy;
                  const checkX = compensatedX + dx;

                  if (checkY >= 0 && checkY < GRID_SIZE && checkX >= 0 && checkX < GRID_SIZE) {
                    const checkCell = newGrid[checkY][checkX];
                    if (checkCell && checkCell.type === 'grass' && !checkCell.enemy) {
                      safeX = checkX;
                      safeY = checkY;
                      found = true;
                    }
                  }
                }
              }
            }

            if (found) {
              updates.x = safeX;
              updates.y = safeY;
            } else {
              // Не нашли безопасное место - отменяем прокрутку
              console.log('[ViewportScroll] Unsafe ahead, scroll cancelled');
              // Продолжаем без прокрутки
              processEnemyTurn(currentGrid, updates);
              return;
            }
          } else {
            // Тайл безопасен - используем компенсированную позицию
            updates.x = compensatedX;
            updates.y = compensatedY;
          }

          // Обновляем viewport offset
          setViewportOffset({ x: newOffsetX, y: newOffsetY });

          // Обновляем grid
          setGrid(newGrid);

          // Обновляем позицию игрока
          setPlayer(updates);

          console.log(`[ViewportScroll] Scrolled viewport by (${scrollDx}, ${scrollDy}), offset now (${newOffsetX}, ${newOffsetY}), player at (${updates.x}, ${updates.y})`);

          // Процессируем ход врагов с новым grid
          processEnemyTurn(newGrid, updates);

          // Проверяем костёр
          const nowAdjacentBonfireNew = checkAdjacentBonfire(newGrid, updates.x, updates.y);
          if (nowAdjacentBonfireNew) {
            addLog('🔥 Вы нашли костёр! Можно отдохнуть и восстановить силы.', 'info');
          }

          return; // Выходим, viewport обновлён
        }
      }
    }

    if (targetCell.type === 'secret_door') {
      addLog('Внимательный взгляд заметил скрытый проход!', 'info');
      const newGrid = currentGrid.map((row, ry) =>
        row.map((cell, rx) => rx === newX && ry === newY ? { ...cell, type: 'door' as const } : cell)
      );
      setGrid(newGrid);
      currentGrid = newGrid;
    }

    // Обработка секретных кнопок
    if (targetCell.type === 'secret_button') {
      const isTrigger = targetCell.isSecretTrigger === true;

      // Активируем кнопку (меняем спрайт)
      let newGrid = currentGrid.map((row, ry) =>
        row.map((cell, rx) => rx === newX && ry === newY ? { ...cell, type: 'secret_button_activated' as const } : cell)
      );

      if (isTrigger) {
        // Правильная кнопка - открываем скрытую комнату
        addLog('⚡ СЕКРЕТ АКТИВИРОВАН! Скрытая комната открыта!', 'success');

        // Восстанавливаем все клетки скрытой комнаты к их оригинальному состоянию
        newGrid = newGrid.map(row =>
          row.map(cell => {
            if (cell.isHiddenRoom && cell.originalType) {
              return {
                ...cell,
                type: cell.originalType,
                isHiddenRoom: false,
                originalType: undefined
              };
            }
            return cell;
          })
        );

      } else {
        // Ложная кнопка
        addLog('🔸 Секрет не принёс результата...', 'info');
      }

      setGrid(newGrid);
      currentGrid = newGrid;
    }

    processEnemyTurn(currentGrid, updates);

    // Проверка приближения к костру
    const wasAdjacentBonfire = checkAdjacentBonfire(grid, player.x, player.y);
    const nowAdjacentBonfire = checkAdjacentBonfire(currentGrid, updates.x, updates.y);

    if (nowAdjacentBonfire && !wasAdjacentBonfire) {
      addLog('🔥 Вы нашли костёр! Можно отдохнуть и восстановить силы.', 'info');
    }
  };

  const toggleDoor = (x: number, y: number) => {
    const target = grid[y][x];
    if (target.type === 'door_open') {
       const newGrid = grid.map((row, ry) =>
         row.map((cell, rx) => rx === x && ry === y ? { ...cell, type: 'door' as const } : cell)
       );
       setGrid(newGrid);
       addLog('Вы захлопнули дверь перед носом врагов!', 'info');
       return true;
    }
    return false;
  };

  const lightTorch = (x: number, y: number) => {
    const target = grid[y][x];
    if (target.type === 'torch') {
       const newGrid = grid.map((row, ry) =>
         row.map((cell, rx) => rx === x && ry === y ? { ...cell, type: 'torch_lit' as const } : cell)
       );
       // Обновляем видимость сразу после зажигания факела
       const updatedGrid = updateVisibility(newGrid, player.x, player.y, player.dungeonLevel);
       setGrid(updatedGrid);
       addLog('Вы зажгли факел! Область вокруг освещена.', 'success');
       return true;
    }
    return false;
  };

  return { movePlayer, toggleDoor, lightTorch };
}