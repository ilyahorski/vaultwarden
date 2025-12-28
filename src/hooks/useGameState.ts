import { useState, useEffect, useCallback, useRef } from 'react';
import type { CellData, Player, LogEntry, GameMode, ClassType, CombatTarget, ActiveMenu, PotionType, WeaponType, ArmorType } from '../types';
import { CLASSES, INITIAL_PLAYER, SAVE_KEY, POTION_STATS, GEAR_STATS } from '../constants';
import { createLogEntry } from '../utils';
import { generateDungeonGrid, getStartPosition } from '../utils/dungeonGenerator';

export const useGameState = () => {
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [mode, setMode] = useState<GameMode>('dm');
  const [hasChosenClass, setHasChosenClass] = useState(false);
  const [levelHistory, setLevelHistory] = useState<Record<number, CellData[][]>>({});
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER as Player);
  const [selectedTool, setSelectedTool] = useState<string>('wall');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMovingEnemy, setIsMovingEnemy] = useState<{ x: number; y: number } | null>(null);
  const [activeRoll, setActiveRoll] = useState<number | null>(null);
  const [combatTarget, setCombatTarget] = useState<CombatTarget | null>(null);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('main');
  const [mainMenuIndex, setMainMenuIndex] = useState(0);
  const [subMenuIndex, setSubMenuIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Добавление записи в лог
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, createLogEntry(text, type)].slice(-50));
  }, []);

  // --- ЛОГИКА ИСПОЛЬЗОВАНИЯ ПРЕДМЕТОВ ---
  const useItem = useCallback((itemIndex: number) => {
    const item = player.inventory[itemIndex];
    if (!item) return;

    setPlayer(prev => {
      const updates = { ...prev };
      const newInventory = [...prev.inventory];

      // 1. ЗЕЛЬЯ
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
      // 2. ОРУЖИЕ
      else if (item.startsWith('weapon')) {
        const newWeapon = item as WeaponType;
        const newStats = GEAR_STATS[newWeapon];
        
        // Снимаем старое
        if (updates.equippedWeapon) {
          const oldWeapon = updates.equippedWeapon;
          const oldStats = GEAR_STATS[oldWeapon];
          updates.atk -= oldStats.val;
          newInventory.push(oldWeapon); // Возвращаем в инвентарь
          addLog(`Снято: ${oldStats.name}`, 'info');
        }

        // Надеваем новое
        updates.atk += newStats.val;
        updates.equippedWeapon = newWeapon;
        newInventory.splice(itemIndex, 1); // Убираем из инвентаря
        addLog(`Экипировано: ${newStats.name} (+${newStats.val} ATK)`, 'success');
        
        updates.inventory = newInventory;
      }
      // 3. БРОНЯ
      else if (item.startsWith('armor')) {
        const newArmor = item as ArmorType;
        const newStats = GEAR_STATS[newArmor];

        // Снимаем старое
        if (updates.equippedArmor) {
          const oldArmor = updates.equippedArmor;
          const oldStats = GEAR_STATS[oldArmor];
          updates.def -= oldStats.val;
          newInventory.push(oldArmor);
          addLog(`Снято: ${oldStats.name}`, 'info');
        }

        // Надеваем новое
        updates.def += newStats.val;
        updates.equippedArmor = newArmor;
        newInventory.splice(itemIndex, 1);
        addLog(`Экипировано: ${newStats.name} (+${newStats.val} DEF)`, 'success');
        
        updates.inventory = newInventory;
      }

      return updates;
    });
  }, [player, addLog]);


  // Загрузка сохранения при старте
  useEffect(() => {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.player && parsed.grid) {
          // Миграция старых сейвов (если нет полей экипировки)
          const loadedPlayer = parsed.player;
          if (loadedPlayer.equippedWeapon === undefined) loadedPlayer.equippedWeapon = null;
          if (loadedPlayer.equippedArmor === undefined) loadedPlayer.equippedArmor = null;

          setPlayer(loadedPlayer);
          setGrid(parsed.grid);
          setLevelHistory(parsed.levelHistory || {});
          setLogs(parsed.logs || []);
          setHasChosenClass(true);
          console.log('Game loaded from local storage');
        }
      } catch (e) {
        console.error('Failed to load save', e);
      }
    }
  }, []);

  // Автосохранение
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

  // Генерация подземелья
  const generateDungeon = useCallback((levelIndex: number = 1) => {
    addLog(`--- ГЕНЕРАЦИЯ ЭТАЖА ${levelIndex} ---`, 'info');
    setCombatTarget(null);
    setMainMenuIndex(0);
    setSubMenuIndex(0);
    setActiveMenu('main');

    const { grid: newGrid, rooms } = generateDungeonGrid(levelIndex);
    const startPos = getStartPosition(rooms);

    if (levelIndex > 1) {
      newGrid[startPos.y][startPos.x].type = 'stairs_up';
    } else {
      newGrid[startPos.y][startPos.x].type = 'floor';
    }

    newGrid[startPos.y][startPos.x].enemy = null;
    newGrid[startPos.y][startPos.x].item = null;

    setPlayer(p => ({ ...p, x: startPos.x, y: startPos.y, dungeonLevel: levelIndex }));
    setGrid(newGrid);
  }, [addLog]);

  // Начальная генерация
  useEffect(() => {
    if (!localStorage.getItem(SAVE_KEY)) {
      generateDungeon(1);
    }
  }, [generateDungeon]);

  // Выбор класса
  const selectClass = useCallback((classType: ClassType) => {
    const stats = CLASSES[classType];
    setPlayer(prev => ({
      ...prev,
      class: classType,
      hp: stats.hp,
      maxHp: stats.maxHp,
      mp: stats.mp,
      maxMp: stats.maxMp,
      atk: stats.atk,
      def: stats.def,
      moves: stats.baseMoves,
      maxMoves: stats.baseMoves,
      xp: 0,
      level: 1,
      nextLevelXp: 100,
      gold: 0,
      dungeonLevel: 1,
      inventory: [],
      equippedWeapon: null,
      equippedArmor: null
    }));
    setHasChosenClass(true);
    addLog(`Выбран класс: ${stats.name}`, 'info');
    generateDungeon(1);
  }, [addLog, generateDungeon]);

  // Экспорт сохранения
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

  // Импорт сохранения
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

  // Сброс сохранения
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
    useItem // <-- Экспортируем функцию
  };
};