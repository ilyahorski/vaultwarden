import { useState, useEffect, useCallback, useRef } from 'react';
import type { CellData, Player, LogEntry, GameMode, ClassType, CombatTarget, ActiveMenu } from '../types';
import { CLASSES, INITIAL_PLAYER, SAVE_KEY } from '../constants';
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

  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Автоскролл логов
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Добавление записи в лог
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, createLogEntry(text, type)].slice(-50));
  }, []);

  // Загрузка сохранения при старте
  useEffect(() => {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.player && parsed.grid) {
          setPlayer(parsed.player);
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

    // Лестница вверх на старте (если это не 1 этаж)
    if (levelIndex > 1) {
      newGrid[startPos.y][startPos.x].type = 'stairs_up';
    } else {
      newGrid[startPos.y][startPos.x].type = 'floor';
    }

    // Очистка стартовой позиции
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
      dungeonLevel: 1
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
    // Состояние
    grid,
    setGrid,
    mode,
    setMode,
    hasChosenClass,
    setHasChosenClass,
    levelHistory,
    setLevelHistory,
    player,
    setPlayer,
    selectedTool,
    setSelectedTool,
    logs,
    setLogs,
    isMovingEnemy,
    setIsMovingEnemy,
    activeRoll,
    setActiveRoll,
    combatTarget,
    setCombatTarget,
    activeMenu,
    setActiveMenu,
    mainMenuIndex,
    setMainMenuIndex,
    subMenuIndex,
    setSubMenuIndex,
    logsEndRef,
    fileInputRef,
    
    // Методы
    addLog,
    generateDungeon,
    selectClass,
    handleExport,
    handleImport,
    clearSave
  };
};
