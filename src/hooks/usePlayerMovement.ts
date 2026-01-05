import type { CellData, Player, LogEntry, CombatTarget } from '../types';
import { GRID_SIZE, MONSTER_STATS, POTION_STATS, GEAR_STATS, RARE_ARTIFACTS, MAX_INVENTORY_SIZE } from '../constants';
import type { PotionType, WeaponType, ArmorType } from '../types';
import { updateVisibility } from './useFogOfWar';

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
}

export function usePlayerMovement({
  grid,
  setGrid,
  player,
  setPlayer,
  activeRoll,
  setActiveRoll,
  addLog,
  setCombatTarget,
  setActiveMenu,
  setMainMenuIndex,
  processEnemyTurn,
  levelHistory,
  setLevelHistory,
  generateDungeon,
  logs
}: UsePlayerMovementProps) {
  
  const movePlayer = (dx: number, dy: number) => {
    if (player.moves <= 0) {
      const lastLog = logs[logs.length - 1];
      if (!lastLog || !lastLog.text.includes("Вы устали")) {
        addLog("Вы устали! Нажмите БРОСОК D20, чтобы перевести дух.", 'fail');
      }
      return;
    }

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

    let moveCost = 1;
    if (targetCell.type === 'water') moveCost = 2;
    if (targetCell.type === 'lava') moveCost = 1;

    if (player.moves < moveCost) {
      addLog("Не хватает сил пробраться через это препятствие!", 'fail');
      return;
    }

    const updates = { ...player };

    let roll = activeRoll;
    let autoRolled = false;
    if (roll === null) {
      roll = Math.floor(Math.random() * 20) + 1;
      autoRolled = true;
    }
    setActiveRoll(null);

    const r = { val: roll, type: 'info' };

    let currentGrid = grid;

    // --- ЛОГИКА ЛЕСТНИЦ ---
    if (targetCell.type === 'stairs_down') {
      addLog(`Вы спускаетесь глубже... Этаж ${updates.dungeonLevel + 1}`, 'level');

      const currentHistory = { ...levelHistory, [updates.dungeonLevel]: grid };
      const nextLevel = updates.dungeonLevel + 1;

      updates.dungeonLevel = nextLevel;
      updates.moves = updates.maxMoves;

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

    if (targetCell.type === 'wall' || targetCell.type === 'torch' || targetCell.type === 'torch_lit') {
      if (!autoRolled) addLog(`Вы потратили подготовленный бросок ${r.val} в стену...`, 'info');
      processEnemyTurn(currentGrid, updates);
      return;
    }

    if (targetCell.type === 'door') {
      if (r.val <= 5) {
        addLog(`[D20: ${r.val}] Дверь заклинило!`, 'fail');
        updates.moves -= 1;
        setPlayer(updates);
        processEnemyTurn(currentGrid, updates);
        return;
      } else {
        addLog(`[D20: ${r.val}] Дверь открыта.`, 'info');
        const newGrid = currentGrid.map((row, ry) =>
          row.map((cell, rx) => rx === newX && ry === newY ? { ...cell, type: 'door_open' as const } : cell)
        );
        setGrid(newGrid);
        currentGrid = newGrid;

        updates.moves -= 1;
        setPlayer(updates);
        processEnemyTurn(currentGrid, updates);
        return;
      }
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
      } else if (itemKey === 'chest') {
        const isArtifact = r.val >= 15;
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
      if (r.val >= 12) {
        addLog(`[D20: ${r.val}] Вы заметили ловушку и обезвредили её!`, 'success');
        const newGrid = currentGrid.map((row, ry) =>
          row.map((cell, rx) => rx === newX && ry === newY ? { ...cell, type: 'floor' as const } : cell)
        );
        setGrid(newGrid);
        currentGrid = newGrid;
      } else {
        let dmg = 15;
        if (r.val <= 5) {
          dmg = 30;
          addLog(`[D20: ${r.val}] КРИТИЧЕСКИЙ ПРОВАЛ! Ловушка сработала дважды!`, 'fail');
        } else {
          addLog(`[D20: ${r.val}] Вы наступили на ЛОВУШКУ!`, 'fail');
        }
        updates.hp -= dmg;
      }
    }

    if (targetCell.type === 'lava') {
      addLog("Вы наступили в ЛАВУ! -1 HP", 'fail');
      updates.hp -= 1;
    }

    updates.x = newX;
    updates.y = newY;
    updates.moves -= moveCost;

    setPlayer(updates);

    if (targetCell.type === 'secret_door') {
      addLog('Внимательный взгляд заметил скрытый проход!', 'info');
      const newGrid = currentGrid.map((row, ry) =>
        row.map((cell, rx) => rx === newX && ry === newY ? { ...cell, type: 'door' as const } : cell)
      );
      setGrid(newGrid);
      currentGrid = newGrid;
    }

    processEnemyTurn(currentGrid, updates);
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
       const updatedGrid = updateVisibility(newGrid, player.x, player.y);
       setGrid(updatedGrid);
       addLog('Вы зажгли факел! Область вокруг освещена.', 'success');
       return true;
    }
    return false;
  };

  return { movePlayer, toggleDoor, lightTorch };
}