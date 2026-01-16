import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  CellData,
  DuoParty,
  HeroStats,
  CatStats,
  LogEntry,
  GameMode,
  CombatTarget,
  ActiveMenu,
  TimeLayer,
  InventorySlot,
  ItemCategory,
  ExtendedItemType
} from '../types';
import { INITIAL_PARTY, GRID_SIZE } from '../constants';
import { createLogEntry, createEmptyGrid } from '../utils';
import { MapManager } from '../managers/MapManager';
import { gameDB, WorldRepository, InventoryRepository, StoryFlagRepository } from '../db';

interface UsePartyStateProps {
  initialMode?: GameMode;
}

/**
 * Новый хук состояния игры с поддержкой:
 * - DuoParty (Героиня + Кот)
 * - IndexedDB через Dexie.js
 * - Time-Shift система
 */
export const usePartyState = ({ initialMode = 'player' }: UsePartyStateProps = {}) => {
  // --- Состояние партии ---
  const [party, setParty] = useState<DuoParty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStartedGame, setHasStartedGame] = useState(false);

  // --- Состояние мира ---
  const [grid, setGrid] = useState<CellData[][]>(() => createEmptyGrid());
  const [currentTimeLayer, setCurrentTimeLayer] = useState<TimeLayer>('present');

  // --- UI состояние ---
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [combatTarget, setCombatTarget] = useState<CombatTarget | null>(null);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('main');
  const [mainMenuIndex, setMainMenuIndex] = useState(0);
  const [subMenuIndex, setSubMenuIndex] = useState(0);

  // --- Редактор ---
  const [selectedTool, setSelectedTool] = useState<string>('wall');

  // --- Viewport для большой карты ---
  const [viewportOffset, setViewportOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // --- Refs ---
  const lastLogRef = useRef<{ text: string; timestamp: number } | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Логирование ---
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    const now = Date.now();
    if (lastLogRef.current &&
        lastLogRef.current.text === text &&
        now - lastLogRef.current.timestamp < 100) {
      return;
    }
    lastLogRef.current = { text, timestamp: now };
    setLogs(prev => [...prev, createLogEntry(text, type)].slice(-50));
  }, []);

  // --- Инициализация: проверка существующей игры в IndexedDB ---
  useEffect(() => {
    const initializeFromDB = async () => {
      try {
        // Проверяем есть ли сохраненные персонажи
        const hero = await gameDB.getCharacter('hero');
        const cat = await gameDB.getCharacter('cat');

        if (hero && cat) {
          // Загружаем сохраненную игру
          const savedParty: DuoParty = {
            hero: {
              name: hero.name,
              x: hero.x,
              y: hero.y,
              facing: hero.facing,
              hp: hero.hp,
              maxHp: hero.maxHp,
              stamina: hero.stamina || 80,
              maxStamina: hero.maxStamina || 80,
              strength: hero.strength || 8,
              dexterity: hero.dexterity || 6,
              xp: hero.xp,
              level: hero.level,
              nextLevelXp: hero.nextLevelXp,
              equippedWeapon: hero.equippedWeapon as HeroStats['equippedWeapon'],
              equippedArmor: hero.equippedArmor as HeroStats['equippedArmor'],
              equippedClothing: null,
              tools: []
            },
            cat: {
              name: cat.name,
              x: cat.x,
              y: cat.y,
              facing: cat.facing,
              hp: cat.hp,
              maxHp: cat.maxHp,
              mana: cat.mana || 120,
              maxMana: cat.maxMana || 120,
              intelligence: cat.intelligence || 10,
              wisdom: cat.wisdom || 8,
              xp: cat.xp,
              level: cat.level,
              nextLevelXp: cat.nextLevelXp,
              lore: []
            },
            activeCharacter: 'hero',
            gold: hero.gold,
            inventory: [],
            currentTimeLayer: 'present'
          };

          // Загружаем инвентарь
          const inventoryItems = await InventoryRepository.getAll();
          savedParty.inventory = inventoryItems.map(item => ({
            id: String(item.id),
            slot: item.slot,
            itemType: item.itemType as ExtendedItemType,
            category: item.category,
            stackable: item.stackable,
            quantity: item.quantity,
            questId: item.questId,
            description: item.description
          }));

          // Загружаем текущий временной слой
          const timeLayer = await StoryFlagRepository.getCurrentTimeLayer();
          savedParty.currentTimeLayer = timeLayer;

          setParty(savedParty);
          setCurrentTimeLayer(timeLayer);
          setHasStartedGame(true);

          // Загружаем карту
          const hasWorld = await WorldRepository.hasWorldData();
          if (hasWorld) {
            const dimensions = await WorldRepository.getWorldDimensions();
            if (dimensions) {
              const loadedGrid = await WorldRepository.loadWorldMap(
                dimensions.width,
                dimensions.height,
                timeLayer
              );
              setGrid(loadedGrid);
            }
          }

          addLog('Игра загружена из базы данных', 'info');
        }
      } catch (error) {
        console.error('Failed to load from IndexedDB:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeFromDB();
  }, [addLog]);

  // --- Автосохранение в IndexedDB ---
  useEffect(() => {
    if (!hasStartedGame || !party) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Сохраняем героиню
        const existingHero = await gameDB.getCharacter('hero');
        const heroData = {
          characterType: 'hero' as const,
          name: party.hero.name,
          x: party.hero.x,
          y: party.hero.y,
          facing: party.hero.facing,
          hp: party.hero.hp,
          maxHp: party.hero.maxHp,
          stamina: party.hero.stamina,
          maxStamina: party.hero.maxStamina,
          strength: party.hero.strength,
          dexterity: party.hero.dexterity,
          xp: party.hero.xp,
          level: party.hero.level,
          nextLevelXp: party.hero.nextLevelXp,
          gold: party.gold,
          equippedWeapon: party.hero.equippedWeapon,
          equippedArmor: party.hero.equippedArmor
        };

        if (existingHero?.id) {
          await gameDB.characters.update(existingHero.id, heroData);
        } else {
          await gameDB.characters.add(heroData);
        }

        // Сохраняем кота
        const existingCat = await gameDB.getCharacter('cat');
        const catData = {
          characterType: 'cat' as const,
          name: party.cat.name,
          x: party.cat.x,
          y: party.cat.y,
          facing: party.cat.facing,
          hp: party.cat.hp,
          maxHp: party.cat.maxHp,
          mana: party.cat.mana,
          maxMana: party.cat.maxMana,
          intelligence: party.cat.intelligence,
          wisdom: party.cat.wisdom,
          xp: party.cat.xp,
          level: party.cat.level,
          nextLevelXp: party.cat.nextLevelXp,
          gold: 0
        };

        if (existingCat?.id) {
          await gameDB.characters.update(existingCat.id, catData);
        } else {
          await gameDB.characters.add(catData);
        }

        // Сохраняем временной слой
        await StoryFlagRepository.setCurrentTimeLayer(party.currentTimeLayer);

      } catch (error) {
        console.error('Failed to save to IndexedDB:', error);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [party, hasStartedGame]);

  // --- Инициализация новой партии ---
  const initializeParty = useCallback(async (heroName: string, catName: string) => {
    const newParty: DuoParty = {
      ...INITIAL_PARTY,
      hero: {
        ...INITIAL_PARTY.hero,
        name: heroName || 'Археолог'
      },
      cat: {
        ...INITIAL_PARTY.cat,
        name: catName || 'Кот-учёный'
      }
    };

    // Очищаем старые данные
    await gameDB.clearAllData();

    // Загружаем начальную карту мира через MapManager
    try {
      const mapData = await MapManager.loadMap('world', '/maps/interdest_map.json');
      console.log(`[startNewGame] Loaded world map: ${mapData.width}x${mapData.height}`);

      // Для party mode используется полная карта, а не viewport
      // Извлекаем viewport для совместимости с GRID_SIZE
      const halfSize = Math.floor(GRID_SIZE / 2);
      const centerX = Math.floor(mapData.width / 2);
      const centerY = Math.floor(mapData.height / 2);

      // Извлекаем viewport вокруг центра
      let offsetX = centerX - halfSize;
      let offsetY = centerY - halfSize;
      if (offsetX < 0) offsetX = 0;
      if (offsetY < 0) offsetY = 0;
      if (offsetX + GRID_SIZE > mapData.width) offsetX = mapData.width - GRID_SIZE;
      if (offsetY + GRID_SIZE > mapData.height) offsetY = mapData.height - GRID_SIZE;

      const worldGrid: CellData[][] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        worldGrid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
          const globalX = offsetX + x;
          const globalY = offsetY + y;
          if (globalY < mapData.height && globalX < mapData.width) {
            worldGrid[y][x] = mapData.grid[globalY][globalX];
          } else {
            worldGrid[y][x] = {
              x, y, type: 'water', item: null, enemy: null, isRevealed: false, isVisible: false
            };
          }
        }
      }

      // Устанавливаем начальные позиции в центре viewport
      newParty.hero.x = halfSize;
      newParty.hero.y = halfSize;
      newParty.cat.x = halfSize + 1;
      newParty.cat.y = halfSize;

      // Сохраняем карту в IndexedDB
      await WorldRepository.saveWorldMap(worldGrid, 'present', 'world');

      setParty(newParty);
      setGrid(worldGrid);
      setHasStartedGame(true);
      setCurrentTimeLayer('present');

      addLog(`${heroName || 'Археолог'} и ${catName || 'Кот-учёный'} начинают своё путешествие!`, 'info');
    } catch (error) {
      console.error('[startNewGame] Failed to load world map:', error);
      addLog('Ошибка загрузки карты мира!', 'fail');
      // Используем пустую сетку как fallback
      const emptyGrid = createEmptyGrid();
      setParty(newParty);
      setGrid(emptyGrid);
      setHasStartedGame(true);
      setCurrentTimeLayer('present');
    }
  }, [addLog]);

  // --- Переключение активного персонажа ---
  const switchActiveCharacter = useCallback(() => {
    if (!party) return;

    setParty(prev => {
      if (!prev) return prev;
      const newActive = prev.activeCharacter === 'hero' ? 'cat' : 'hero';
      addLog(`Управление переключено на ${newActive === 'hero' ? 'Героиню' : 'Кота'}`, 'info');
      return {
        ...prev,
        activeCharacter: newActive
      };
    });
  }, [party, addLog]);

  // --- Обновление позиции активного персонажа ---
  const updateActiveCharacterPosition = useCallback((x: number, y: number, facing?: HeroStats['facing']) => {
    if (!party) return;

    setParty(prev => {
      if (!prev) return prev;

      if (prev.activeCharacter === 'hero') {
        return {
          ...prev,
          hero: {
            ...prev.hero,
            x,
            y,
            ...(facing && { facing })
          }
        };
      } else {
        return {
          ...prev,
          cat: {
            ...prev.cat,
            x,
            y,
            ...(facing && { facing })
          }
        };
      }
    });
  }, [party]);

  // --- Получить активного персонажа ---
  const getActiveCharacter = useCallback((): HeroStats | CatStats | null => {
    if (!party) return null;
    return party.activeCharacter === 'hero' ? party.hero : party.cat;
  }, [party]);

  // --- Переключение временного слоя ---
  const shiftTimeLayer = useCallback(async (newLayer: TimeLayer) => {
    if (!party || currentTimeLayer === newLayer) return;

    addLog(`Переход во временной слой: ${newLayer === 'past' ? 'Прошлое' : newLayer === 'present' ? 'Настоящее' : 'Будущее'}`, 'info');

    // Сохраняем текущий слой
    await WorldRepository.saveWorldMap(grid, currentTimeLayer);

    // Загружаем новый слой
    const dimensions = await WorldRepository.getWorldDimensions();
    if (dimensions) {
      const newGrid = await WorldRepository.loadWorldMap(dimensions.width, dimensions.height, newLayer);
      setGrid(newGrid);
    }

    setCurrentTimeLayer(newLayer);
    setParty(prev => prev ? { ...prev, currentTimeLayer: newLayer } : prev);
  }, [party, currentTimeLayer, grid, addLog]);

  // --- Добавить предмет в инвентарь ---
  const addToInventory = useCallback(async (
    itemType: ExtendedItemType,
    category: ItemCategory,
    options: { stackable?: boolean; quantity?: number } = {}
  ): Promise<boolean> => {
    if (!party || !itemType) return false;

    const result = await InventoryRepository.addItem(itemType, category, options);

    if (result.success && result.slot !== undefined) {
      setParty(prev => {
        if (!prev) return prev;

        const newItem: InventorySlot = {
          id: `item_${Date.now()}`,
          slot: result.slot!,
          itemType,
          category,
          stackable: options.stackable || false,
          quantity: options.quantity || 1
        };

        return {
          ...prev,
          inventory: [...prev.inventory, newItem]
        };
      });

      addLog(`Получен предмет: ${itemType}`, 'loot');
      return true;
    } else {
      addLog(result.error || 'Не удалось добавить предмет', 'fail');
      return false;
    }
  }, [party, addLog]);

  // --- Сброс игры ---
  const resetGame = useCallback(async () => {
    await gameDB.clearAllData();
    setParty(null);
    setGrid(createEmptyGrid());
    setHasStartedGame(false);
    setLogs([]);
    setCombatTarget(null);
    addLog('Игра сброшена', 'info');
  }, [addLog]);

  // --- Обновить партию ---
  const updateParty = useCallback((updates: Partial<DuoParty>) => {
    setParty(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  // --- Обновить героиню ---
  const updateHero = useCallback((updates: Partial<HeroStats>) => {
    setParty(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        hero: { ...prev.hero, ...updates }
      };
    });
  }, []);

  // --- Обновить кота ---
  const updateCat = useCallback((updates: Partial<CatStats>) => {
    setParty(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        cat: { ...prev.cat, ...updates }
      };
    });
  }, []);

  return {
    // Состояние партии
    party,
    isLoading,
    hasStartedGame,
    currentTimeLayer,

    // Состояние мира
    grid,
    setGrid,

    // UI состояние
    mode,
    setMode,
    logs,
    addLog,
    combatTarget,
    setCombatTarget,
    activeMenu,
    setActiveMenu,
    mainMenuIndex,
    setMainMenuIndex,
    subMenuIndex,
    setSubMenuIndex,

    // Редактор
    selectedTool,
    setSelectedTool,

    // Viewport
    viewportOffset,
    setViewportOffset,

    // Методы партии
    initializeParty,
    switchActiveCharacter,
    updateActiveCharacterPosition,
    getActiveCharacter,
    updateParty,
    updateHero,
    updateCat,

    // Time-Shift
    shiftTimeLayer,

    // Инвентарь
    addToInventory,

    // Управление игрой
    resetGame
  };
};

export default usePartyState;
