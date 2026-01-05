import { useState, useEffect, useCallback, useRef } from 'react';
import type { CellData, Player, LogEntry, GameMode, ClassType, CombatTarget, ActiveMenu, PotionType, WeaponType, ArmorType, DungeonCampaign } from '../types';
import { CLASSES, INITIAL_PLAYER, SAVE_KEY, POTION_STATS, GEAR_STATS, GRID_SIZE } from '../constants';
import { createLogEntry, createEmptyGrid } from '../utils';
import { generateDungeonGrid, getStartPosition } from '../utils/dungeonGenerator';
import { compressLevel, decompressLevel, type CompressedLevel } from '../utils/levelCompression';

// Вспомогательная функция для распаковки истории уровней
const decompressLevelHistory = (history: Record<number, CellData[][] | CompressedLevel>): Record<number, CellData[][]> => {
  const result: Record<number, CellData[][]> = {};
  for (const [level, data] of Object.entries(history)) {
    // Проверяем, сжатый это формат или обычный
    if (data && 'v' in data && 'c' in data) {
      result[Number(level)] = decompressLevel(data as CompressedLevel);
    } else {
      result[Number(level)] = data as CellData[][];
    }
  }
  return result;
};

// Вспомогательная функция для сжатия истории уровней
const compressLevelHistory = (history: Record<number, CellData[][]>): Record<number, CompressedLevel> => {
  const result: Record<number, CompressedLevel> = {};
  for (const [level, grid] of Object.entries(history)) {
    result[Number(level)] = compressLevel(grid);
  }
  return result;
};

interface UseGameStateProps {
  initialMode?: GameMode;
}

export const useGameState = ({ initialMode = 'player' }: UseGameStateProps = {}) => {
  // 1. ЛЕНИВАЯ ИНИЦИАЛИЗАЦИЯ
  const [initialState] = useState(() => {
    // А) Пытаемся загрузить сохранение
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.player && parsed.grid) {
          const loadedPlayer = parsed.player;
          // Санитизация старых сохранений
          if (loadedPlayer.equippedWeapon === undefined) loadedPlayer.equippedWeapon = null;
          if (loadedPlayer.equippedArmor === undefined) loadedPlayer.equippedArmor = null;

          // Распаковываем историю уровней (поддержка обоих форматов)
          const levelHistory = parsed.levelHistory
            ? decompressLevelHistory(parsed.levelHistory)
            : {};

          console.log('Game loaded from local storage');
          return {
            player: loadedPlayer,
            grid: parsed.grid,
            levelHistory,
            playerPositions: parsed.playerPositions || {},
            logs: parsed.logs || [],
            hasChosenClass: true
          };
        }
      } catch (e) {
        console.error('Failed to load save', e);
      }
    }

    // Б) Если сохранения нет — генерируем новый уровень сразу
    const gen = generateDungeonGrid(1);
    const startPos = getStartPosition(gen.rooms);
    const newGrid = gen.grid;

    // Для 1 уровня ставим пол, а не лестницу
    newGrid[startPos.y][startPos.x].type = 'floor';
    newGrid[startPos.y][startPos.x].enemy = null;
    newGrid[startPos.y][startPos.x].item = null;

    const newPlayer = {
      ...(INITIAL_PLAYER as Player),
      x: startPos.x,
      y: startPos.y,
      dungeonLevel: 1
    };

    return {
      player: newPlayer,
      grid: newGrid,
      levelHistory: {},
      playerPositions: {},
      logs: [],
      hasChosenClass: false
    };
  });

  // 2. Инициализируем стейт значениями из initialState
  const [grid, setGrid] = useState<CellData[][]>(initialState.grid);
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [hasChosenClass, setHasChosenClass] = useState(initialState.hasChosenClass);
  const [levelHistory, setLevelHistory] = useState<Record<number, CellData[][]>>(initialState.levelHistory);
  const [playerPositions, setPlayerPositions] = useState<Record<number, { x: number; y: number }>>(initialState.playerPositions || {});
  const [player, setPlayer] = useState<Player>(initialState.player);
  const [logs, setLogs] = useState<LogEntry[]>(initialState.logs);
  
  // Остальные стейты (UI) инициализируются стандартно
  const [selectedTool, setSelectedTool] = useState<string>('wall');
  const [isMovingEnemy, setIsMovingEnemy] = useState<{ x: number; y: number } | null>(null);
  const [activeRoll, setActiveRoll] = useState<number | null>(null);
  const [combatTarget, setCombatTarget] = useState<CombatTarget | null>(null);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('main');
  const [mainMenuIndex, setMainMenuIndex] = useState(0);
  const [subMenuIndex, setSubMenuIndex] = useState(0);
  const [activeCampaign, setActiveCampaign] = useState<DungeonCampaign | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref для предотвращения дублирования логов в StrictMode
  const lastLogRef = useRef<{ text: string; timestamp: number } | null>(null);

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    const now = Date.now();
    // Пропускаем дубликаты в пределах 100ms (защита от StrictMode double-invoke)
    if (lastLogRef.current &&
        lastLogRef.current.text === text &&
        now - lastLogRef.current.timestamp < 100) {
      return;
    }
    lastLogRef.current = { text, timestamp: now };
    setLogs(prev => [...prev, createLogEntry(text, type)].slice(-50));
  }, []);

  const onConsumeItem = useCallback((itemIndex: number) => {
    const item = player.inventory[itemIndex];
    if (!item) return;

    setPlayer(prev => {
      const updates = { ...prev };
      const newInventory = [...prev.inventory];

      if (item.startsWith('potion')) {
        const potion = POTION_STATS[item as PotionType];
        let used = false;

        if (potion.type === 'hp' && updates.hp < updates.maxHp) {
          const healAmount = Math.min(potion.heal, updates.maxHp - updates.hp);
          updates.hp += healAmount;
          addLog(`Использовано ${potion.name}: +${healAmount} HP`, 'success');
          used = true;
        } else if (potion.type === 'mp' && updates.mp < updates.maxMp) {
          const manaAmount = Math.min(potion.mana, updates.maxMp - updates.mp);
          updates.mp += manaAmount;
          addLog(`Использовано ${potion.name}: +${manaAmount} MP`, 'success');
          used = true;
        } else {
          addLog('Здоровье/Мана уже полные!', 'info');
        }

        if (used) {
          newInventory.splice(itemIndex, 1);
          updates.inventory = newInventory;
        }
      }
      else if (item.startsWith('weapon')) {
        const newWeapon = item as WeaponType;
        const newStats = GEAR_STATS[newWeapon];

        if (updates.equippedWeapon) {
          const oldWeapon = updates.equippedWeapon;
          const oldStats = GEAR_STATS[oldWeapon];
          updates.atk -= oldStats.val;
          newInventory.push(oldWeapon);
          addLog(`Снято: ${oldStats.name}`, 'info');
        }

        updates.atk += newStats.val;
        updates.equippedWeapon = newWeapon;
        newInventory.splice(itemIndex, 1);
        addLog(`Экипировано: ${newStats.name} (+${newStats.val} ATK)`, 'success');

        updates.inventory = newInventory;
      }
      else if (item.startsWith('armor')) {
        const newArmor = item as ArmorType;
        const newStats = GEAR_STATS[newArmor];

        if (updates.equippedArmor) {
          const oldArmor = updates.equippedArmor;
          const oldStats = GEAR_STATS[oldArmor];
          updates.def -= oldStats.val;
          newInventory.push(oldArmor);
          addLog(`Снято: ${oldStats.name}`, 'info');
        }

        updates.def += newStats.val;
        updates.equippedArmor = newArmor;
        newInventory.splice(itemIndex, 1);
        addLog(`Экипировано: ${newStats.name} (+${newStats.val} DEF)`, 'success');

        updates.inventory = newInventory;
      }

      return updates;
    });
  }, [player, addLog]);

  // Debounced сохранение в localStorage для оптимизации памяти
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasChosenClass) return;

    // Очищаем предыдущий таймер
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Сохраняем с задержкой 500ms (со сжатием истории уровней)
    saveTimeoutRef.current = setTimeout(() => {
      const saveData = {
        player,
        grid,
        levelHistory: compressLevelHistory(levelHistory), // Сжимаем для экономии места
        playerPositions,
        logs: logs.slice(-20)
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [player, grid, levelHistory, playerPositions, hasChosenClass, logs]);

  // Функция генерации уровня
  const generateDungeon = useCallback((levelIndex: number = 1, campaignOverride?: DungeonCampaign) => {
    addLog(`--- ЭТАЖ ${levelIndex} ---`, 'info');
    setCombatTarget(null);
    setMainMenuIndex(0);
    setSubMenuIndex(0);
    setActiveMenu('main');

    let newGrid: CellData[][];
    let startPos = { x: 1, y: 1 };

    const currentCampaign = campaignOverride || activeCampaign;

    if (currentCampaign && currentCampaign.levels[levelIndex]) {
       newGrid = JSON.parse(JSON.stringify(currentCampaign.levels[levelIndex]));
       let foundStart = false;
       
       // 1. Приоритет: Лестница вверх (стандарт для входа)
       for(let y=0; y<GRID_SIZE; y++){
         for(let x=0; x<GRID_SIZE; x++){
            if(newGrid[y][x].type === 'stairs_up') {
                startPos = {x, y};
                foundStart = true;
                break;
            }
         }
         if(foundStart) break;
       }

       // 2. Приоритет: Открытая дверь (часто старт кастомных карт)
       if (!foundStart) {
         for(let y=0; y<GRID_SIZE; y++){
            for(let x=0; x<GRID_SIZE; x++){
               if(newGrid[y][x].type === 'door_open') {
                   startPos = {x, y};
                   foundStart = true;
                   break;
               }
            }
            if(foundStart) break;
         }
       }

       // 3. Приоритет: Любая безопасная клетка (пол или трава)
       if (!foundStart) {
         for(let y=0; y<GRID_SIZE; y++){
            for(let x=0; x<GRID_SIZE; x++){
               const t = newGrid[y][x].type;
               if(t === 'floor' || t === 'grass') {
                   startPos = {x, y};
                   foundStart = true;
                   break;
               }
            }
            if(foundStart) break;
         }
       }

       // 4. Фолбек (если карта пустая или одни стены)
       if(!foundStart) startPos = {x: 1, y: 1};

       addLog(`Загружен уровень из кампании: ${currentCampaign.name}`, 'info');
    } else {
       const gen = generateDungeonGrid(levelIndex);
       newGrid = gen.grid;
       startPos = getStartPosition(gen.rooms);
       
       if (levelIndex > 1) {
          newGrid[startPos.y][startPos.x].type = 'stairs_up';
       } else {
          newGrid[startPos.y][startPos.x].type = 'floor';
       }
    }

    newGrid[startPos.y][startPos.x].enemy = null;
    newGrid[startPos.y][startPos.x].item = null;

    setPlayer(p => ({ ...p, x: startPos.x, y: startPos.y, dungeonLevel: levelIndex }));
    setGrid(newGrid);
  }, [addLog, activeCampaign]);

  const resetGame = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);

    setHasChosenClass(false);
    setMode('player');
    setLevelHistory({});
    setPlayerPositions({});
    setLogs([]);
    setCombatTarget(null);
    setActiveCampaign(null);

    setPlayer({ ...(INITIAL_PLAYER as Player), x: 1, y: 1, dungeonLevel: 1 });
    setGrid(createEmptyGrid());

    addLog('Игра полностью сброшена.', 'info');
  }, [addLog]);

  // Сброс только текущего этажа (очистка карты)
  const resetCurrentLevel = useCallback(() => {
    const emptyGrid = createEmptyGrid();
    setGrid(emptyGrid);

    // Удаляем текущий уровень из истории
    setLevelHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[player.dungeonLevel];
      return newHistory;
    });

    addLog(`Этаж ${player.dungeonLevel} очищен.`, 'info');
  }, [addLog, player.dungeonLevel]);

  // Генерация случайного подземелья для текущего этажа
  const generateRandomLevel = useCallback(() => {
    const { grid: newGrid, rooms } = generateDungeonGrid(player.dungeonLevel);
    const startPos = getStartPosition(rooms);

    // Очищаем стартовую позицию от врагов/предметов
    newGrid[startPos.y][startPos.x].enemy = null;
    newGrid[startPos.y][startPos.x].item = null;

    setGrid(newGrid);
    setPlayer(p => ({ ...p, x: startPos.x, y: startPos.y }));

    // Обновляем историю уровней
    setLevelHistory(prev => ({
      ...prev,
      [player.dungeonLevel]: newGrid
    }));

    addLog(`Сгенерировано новое подземелье для этажа ${player.dungeonLevel}.`, 'info');
  }, [addLog, player.dungeonLevel]);

  const selectClass = useCallback((classType: ClassType, name: string, campaign?: DungeonCampaign) => {
    const stats = CLASSES[classType];
    
    let startAtk = stats.atk;
    let startDef = stats.def;

    if (stats.startingWeapon) {
      startAtk += GEAR_STATS[stats.startingWeapon].val;
    }
    if (stats.startingArmor) {
      startDef += GEAR_STATS[stats.startingArmor].val;
    }

    setPlayer(prev => ({
      ...prev,
      class: classType,
      name: name || stats.name,
      hp: stats.hp,
      maxHp: stats.maxHp,
      mp: stats.mp,
      maxMp: stats.maxMp,
      atk: startAtk,
      def: startDef,
      moves: stats.baseMoves,
      maxMoves: stats.baseMoves,
      xp: 0,
      level: 1,
      nextLevelXp: 100,
      gold: 0,
      dungeonLevel: 1,
      inventory: [],
      equippedWeapon: stats.startingWeapon || null,
      equippedArmor: stats.startingArmor || null
    }));

    if (campaign) {
        setActiveCampaign(campaign);
        addLog(`Начата кампания: ${campaign.name}`, 'info');
    } else {
        setActiveCampaign(null);
    }

    setHasChosenClass(true);
    addLog(`Герой ${name || stats.name} (${stats.name}) готов к приключениям!`, 'info');
    
    setTimeout(() => generateDungeon(1, campaign), 50);
  }, [addLog, generateDungeon]);

  const handleExport = useCallback(() => {
    const data = {
      player,
      grid,
      levelHistory,
      logs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dungeon_save_lvl${player.dungeonLevel}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('Карта успешно экспортирована!', 'success');
  }, [player, grid, levelHistory, logs, addLog]);

  const createNewLevel = useCallback(() => {
      const currentLevel = player.dungeonLevel;

      // Сохраняем текущую карту и позицию игрока
      const historyUpdate = { ...levelHistory, [currentLevel]: grid };
      setLevelHistory(historyUpdate);

      setPlayerPositions(prev => ({ ...prev, [currentLevel]: { x: player.x, y: player.y } }));

      const levels = Object.keys(historyUpdate).map(Number);
      const nextLevel = levels.length > 0 ? Math.max(...levels) + 1 : 1;

      generateDungeon(nextLevel);
  }, [grid, levelHistory, player.dungeonLevel, player.x, player.y, generateDungeon]);

  const switchLevel = useCallback((targetLevel: number) => {
      const currentLevel = player.dungeonLevel;

      // Сохраняем текущую карту и позицию игрока
      const historyUpdate = { ...levelHistory, [currentLevel]: grid };
      setLevelHistory(historyUpdate);

      const positionsUpdate = { ...playerPositions, [currentLevel]: { x: player.x, y: player.y } };
      setPlayerPositions(positionsUpdate);

      if (historyUpdate[targetLevel]) {
          setGrid(historyUpdate[targetLevel]);

          // Восстанавливаем позицию игрока для целевого уровня
          const savedPos = positionsUpdate[targetLevel];
          if (savedPos) {
              setPlayer(p => ({ ...p, dungeonLevel: targetLevel, x: savedPos.x, y: savedPos.y }));
          } else {
              setPlayer(p => ({ ...p, dungeonLevel: targetLevel }));
          }

          addLog(`Редактор: Переход на этаж ${targetLevel}`, 'info');
      } else {
          addLog(`Ошибка: Этаж ${targetLevel} не найден`, 'fail');
      }
  }, [grid, levelHistory, playerPositions, player.dungeonLevel, player.x, player.y, addLog]);

  const handleExportCampaign = useCallback((name: string, password?: string) => {
     const finalHistory = { ...levelHistory, [player.dungeonLevel]: grid };
     
     const campaign: DungeonCampaign = {
         name,
         password: password || undefined,
         levels: finalHistory
     };
     
     const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `${name.replace(/\s+/g, '_')}_campaign.json`;
     a.click();
     URL.revokeObjectURL(url);
     addLog(`Кампания "${name}" сохранена! (Этажей: ${Object.keys(finalHistory).length})`, 'success');
  }, [levelHistory, grid, player.dungeonLevel, addLog]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setPlayer(parsed.player);
        setGrid(parsed.grid);
        setLevelHistory(parsed.levelHistory);
        setLogs(parsed.logs || []);
        setHasChosenClass(true);
        addLog('Карта загружена из файла!', 'success');
      } catch {
        addLog('Ошибка загрузки файла сохранения.', 'fail');
      }
    };
    reader.readAsText(file);
  }, [addLog]);

  const parseCampaignFile = (file: File): Promise<DungeonCampaign> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const data = JSON.parse(e.target?.result as string);
                  if (data.levels) resolve(data);
                  else reject('Неверный формат кампании');
              } catch (err) { reject(err); }
          };
          reader.readAsText(file);
      });
  };

  const clearSave = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
  }, []);

  return {
    grid, setGrid,
    mode, setMode,
    hasChosenClass, setHasChosenClass,
    levelHistory, setLevelHistory,
    player, setPlayer,
    selectedTool, setSelectedTool,
    logs, setLogs,
    isMovingEnemy, setIsMovingEnemy,
    activeRoll, setActiveRoll,
    combatTarget, setCombatTarget,
    activeMenu, setActiveMenu,
    mainMenuIndex, setMainMenuIndex,
    subMenuIndex, setSubMenuIndex,
    fileInputRef,
    addLog,
    generateDungeon,
    resetGame,
    resetCurrentLevel,
    generateRandomLevel,
    selectClass,
    handleExport,
    handleImport,
    clearSave,
    onConsumeItem,
    handleExportCampaign,
    parseCampaignFile,
    createNewLevel,
    switchLevel
  };
};