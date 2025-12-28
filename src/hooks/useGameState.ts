import { useState, useEffect, useCallback, useRef } from 'react';
import type { CellData, Player, LogEntry, GameMode, ClassType, CombatTarget, ActiveMenu, PotionType, WeaponType, ArmorType, DungeonCampaign } from '../types';
import { CLASSES, INITIAL_PLAYER, SAVE_KEY, POTION_STATS, GEAR_STATS, GRID_SIZE } from '../constants';
import { createLogEntry } from '../utils';
import { generateDungeonGrid, getStartPosition } from '../utils/dungeonGenerator';

export const useGameState = () => {
  // 1. ЛЕНИВАЯ ИНИЦИАЛИЗАЦИЯ
  // Мы вычисляем начальное состояние ОДИН РАЗ при монтировании.
  // Это заменяет useEffect для загрузки и useEffect для генерации первой карты.
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

          console.log('Game loaded from local storage');
          return {
            player: loadedPlayer,
            grid: parsed.grid,
            levelHistory: parsed.levelHistory || {},
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
      logs: [],
      hasChosenClass: false
    };
  });

  // 2. Инициализируем стейт значениями из initialState
  const [grid, setGrid] = useState<CellData[][]>(initialState.grid);
  const [mode, setMode] = useState<GameMode>('dm');
  const [hasChosenClass, setHasChosenClass] = useState(initialState.hasChosenClass);
  const [levelHistory, setLevelHistory] = useState<Record<number, CellData[][]>>(initialState.levelHistory);
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

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
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

  useEffect(() => {
    if (hasChosenClass) {
      const saveData = {
        player,
        grid,
        levelHistory,
        logs: logs.slice(-20)
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    }
  }, [player, grid, levelHistory, hasChosenClass, logs]);

  // Функция для РУЧНОЙ генерации (при переходе на этаж или ресете)
  const generateDungeon = useCallback((levelIndex: number = 1) => {
    addLog(`--- ЭТАЖ ${levelIndex} ---`, 'info');
    setCombatTarget(null);
    setMainMenuIndex(0);
    setSubMenuIndex(0);
    setActiveMenu('main');

    let newGrid: CellData[][];
    let startPos = { x: 1, y: 1 };

    if (activeCampaign && activeCampaign.levels[levelIndex]) {
       newGrid = JSON.parse(JSON.stringify(activeCampaign.levels[levelIndex]));
       let foundStart = false;
       for(let y=0; y<GRID_SIZE; y++){
         for(let x=0; x<GRID_SIZE; x++){
            if(newGrid[y][x].type === 'stairs_up') {
                startPos = {x, y};
                foundStart = true;
            }
         }
       }
       if(!foundStart) startPos = {x: 1, y: 1};
       addLog(`Загружен уровень из кампании: ${activeCampaign.name}`, 'info');
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
    
    setTimeout(() => generateDungeon(1), 50);
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

  // --- Управление этажами для DM ---

  const createNewLevel = useCallback(() => {
      const currentLevel = player.dungeonLevel;
      const historyUpdate = { ...levelHistory, [currentLevel]: grid };
      setLevelHistory(historyUpdate);

      const levels = Object.keys(historyUpdate).map(Number);
      const nextLevel = levels.length > 0 ? Math.max(...levels) + 1 : 1;

      generateDungeon(nextLevel);
  }, [grid, levelHistory, player.dungeonLevel, generateDungeon]);

  const switchLevel = useCallback((targetLevel: number) => {
      const currentLevel = player.dungeonLevel;
      const historyUpdate = { ...levelHistory, [currentLevel]: grid };
      setLevelHistory(historyUpdate);

      if (historyUpdate[targetLevel]) {
          setGrid(historyUpdate[targetLevel]);
          setPlayer(p => ({ ...p, dungeonLevel: targetLevel }));
          addLog(`Редактор: Переход на этаж ${targetLevel}`, 'info');
      } else {
          addLog(`Ошибка: Этаж ${targetLevel} не найден`, 'fail');
      }
  }, [grid, levelHistory, player.dungeonLevel, addLog]);

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