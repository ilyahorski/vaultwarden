import type { CellType, TimeLayer, EnemyType } from '../../types';

// === Типы триггеров для Visual Metadata Editor ===
export type TriggerType =
  | 'on_enter'          // При входе на клетку
  | 'on_exit'           // При выходе из клетки
  | 'on_interact'       // При взаимодействии (E)
  | 'on_time_shift'     // При смене временного слоя
  | 'on_item_use'       // При использовании предмета
  | 'proximity'         // При приближении (радиус)
  | 'timed'             // По таймеру
  | 'conditional';      // По условию (флаг истории)

// === Типы сущностей для Entity Layer ===
export type EntityType = 'npc' | 'enemy' | 'trigger' | 'interactable' | 'spawn_point';

// === Конфигурация триггера ===
export interface TriggerConfig {
  type: TriggerType;
  action?: string;         // ID действия или скрипта
  targetId?: string;       // ID целевой сущности/ячейки
  condition?: string;      // Условие для conditional триггера
  radius?: number;         // Радиус для proximity триггера
  cooldown?: number;       // Кулдаун в мс
  oneShot?: boolean;       // Срабатывает только один раз
}

// === Конфигурация сущности ===
export interface EntityConfig {
  entityId: string;        // Уникальный ID сущности
  entityType: EntityType;  // Тип сущности
  enemyType?: EnemyType;   // Тип врага (если entityType === 'enemy')
  npcId?: string;          // ID NPC (если entityType === 'npc')
  dialogueId?: string;     // ID диалога
  patrolPath?: { x: number; y: number }[];  // Маршрут патрулирования
  respawnable?: boolean;   // Можно ли респавнить
  respawnTime?: number;    // Время респавна в мс
}

/**
 * Метаданные одного тайла в тайлсете
 * Расширено для Visual Metadata Editor
 */
export interface TilesetTileMetadata {
  x: number;           // X координата в атласе
  y: number;           // Y координата в атласе
  type: CellType;      // Тип ячейки для игровой логики
  passable: boolean;   // Проходимость (true = можно ходить, false = solid)
  name?: string;       // Человекочитаемое имя для UI
  category?: string;   // Категория (terrain, structure, decoration)

  // === Time-Shift система ===
  timeLayer?: TimeLayer;           // В каком временном слое существует (past/present/future)
  timeExclusive?: boolean;         // true = существует ТОЛЬКО в указанном слое

  // === Entity система ===
  entitySpawnPoint?: boolean;      // Является точкой спавна сущности
  defaultEntity?: EntityConfig;    // Сущность по умолчанию для этого тайла

  // === Триггеры ===
  triggers?: TriggerConfig[];      // Массив триггеров на этом тайле

  // === Визуальные эффекты ===
  animated?: boolean;              // Анимированный тайл
  animationFrames?: number;        // Количество кадров анимации
  animationSpeed?: number;         // Скорость анимации (мс на кадр)
  emissive?: boolean;              // Излучает свет
  lightRadius?: number;            // Радиус освещения
  lightColor?: string;             // Цвет света (hex)
}

/**
 * Конфигурация тайлсета
 */
export interface TilesetConfig {
  id: string;          // Уникальный идентификатор ('world', 'town', 'dungeon')
  name: string;        // Человекочитаемое имя
  imagePath: string;   // Путь к PNG атласу (относительно public/)
  tileSize: number;    // Размер тайла в пикселях (16)
  columns: number;     // Количество колонок в атласе
  rows: number;        // Количество строк в атласе
  tiles: TilesetTileMetadata[];  // Метаданные каждого тайла
}

/**
 * Реестр всех тайлсетов
 *
 * ВАЖНО: Заполните массив tiles для каждого тайлсета вашими данными.
 * Сейчас это базовая конфигурация с примерами.
 */
export const TILESET_REGISTRY: Record<string, TilesetConfig> = {
  grassBiome: {
    id: 'grassBiome',
    name: 'Grass Biome',
    imagePath: '/maps/open_world_tiles/grassBiome_singleLayer.png',
    tileSize: 16,
    columns: 32,
    rows: 46,
    tiles: [
      // Примеры базовых тайлов (заполнить конкретные координаты позже)
      { x: 0, y: 0, type: 'grass', passable: true, name: 'Grass', category: 'terrain' },
      { x: 1, y: 0, type: 'grass', passable: true, name: 'Grass 2', category: 'terrain' },
      { x: 2, y: 0, type: 'grass', passable: true, name: 'Grass 3', category: 'terrain' },
      { x: 0, y: 1, type: 'grass', passable: true, name: 'Grass 4', category: 'terrain' },
      { x: 1, y: 1, type: 'grass', passable: true, name: 'Grass 5', category: 'terrain' },
      { x: 0, y: 2, type: 'wall', passable: false, name: 'Tree', category: 'terrain' },
      { x: 1, y: 2, type: 'wall', passable: false, name: 'Tree 2', category: 'terrain' },
      { x: 0, y: 3, type: 'water', passable: false, name: 'Water', category: 'terrain' },
      { x: 1, y: 3, type: 'water', passable: false, name: 'Water 2', category: 'terrain' },
      // TODO: Добавить все 1472 тайла (32×46)
    ]
  },

  desertBiome: {
    id: 'desertBiome',
    name: 'Desert Biome',
    imagePath: '/maps/open_world_tiles/desertBiome_singleLayer.png',
    tileSize: 16,
    columns: 32,
    rows: 46,
    tiles: [
      { x: 0, y: 0, type: 'floor', passable: true, name: 'Sand', category: 'terrain' },
      { x: 1, y: 0, type: 'floor', passable: true, name: 'Sand 2', category: 'terrain' },
      { x: 0, y: 1, type: 'wall', passable: false, name: 'Cactus', category: 'terrain' },
      { x: 1, y: 1, type: 'wall', passable: false, name: 'Rock', category: 'terrain' },
      // TODO: Добавить остальные тайлы пустыни
    ]
  },

  snowBiome: {
    id: 'snowBiome',
    name: 'Snow Biome',
    imagePath: '/maps/open_world_tiles/snowBiome_singleLayer.png',
    tileSize: 16,
    columns: 32,
    rows: 46,
    tiles: [
      { x: 0, y: 0, type: 'floor', passable: true, name: 'Snow', category: 'terrain' },
      { x: 1, y: 0, type: 'floor', passable: true, name: 'Snow 2', category: 'terrain' },
      { x: 0, y: 1, type: 'wall', passable: false, name: 'Ice', category: 'terrain' },
      // TODO: Добавить остальные снежные тайлы
    ]
  },

  villageTerrain: {
    id: 'villageTerrain',
    name: 'Village Terrain',
    imagePath: '/maps/open_world_tiles/Village_TerrainTiles.png',
    tileSize: 16,
    columns: 32,
    rows: 32,
    tiles: [
      { x: 0, y: 0, type: 'floor', passable: true, name: 'Road', category: 'terrain' },
      { x: 1, y: 0, type: 'grass', passable: true, name: 'Village Grass', category: 'terrain' },
      { x: 2, y: 0, type: 'floor', passable: true, name: 'Stone Path', category: 'terrain' },
      // TODO: Добавить остальные тайлы местности деревни
    ]
  },

  villageBuilding: {
    id: 'villageBuilding',
    name: 'Village Buildings',
    imagePath: '/maps/open_world_tiles/Village_BuildingTiles.png',
    tileSize: 16,
    columns: 32,
    rows: 32,
    tiles: [
      { x: 0, y: 0, type: 'wall', passable: false, name: 'Wall', category: 'structure' },
      { x: 1, y: 0, type: 'wall', passable: false, name: 'Wall 2', category: 'structure' },
      { x: 2, y: 0, type: 'door', passable: false, name: 'Door', category: 'structure' },
      { x: 3, y: 0, type: 'door_open', passable: true, name: 'Door Open', category: 'structure' },
      // TODO: Добавить остальные строительные элементы
    ]
  },

  villageObjects: {
    id: 'villageObjects',
    name: 'Village Objects',
    imagePath: '/maps/open_world_tiles/Village_ObjectTiles.png',
    tileSize: 16,
    columns: 32,
    rows: 32,
    tiles: [
      { x: 0, y: 0, type: 'bonfire', passable: true, name: 'Campfire', category: 'structure' },
      { x: 1, y: 0, type: 'chest', passable: true, name: 'Chest', category: 'structure' },
      { x: 2, y: 0, type: 'merchant', passable: true, name: 'Market Stall', category: 'structure' },
      // TODO: Добавить остальные объекты деревни
    ]
  },

  villageInteriorStructure: {
    id: 'villageInteriorStructure',
    name: 'Interior Structure',
    imagePath: '/maps/open_world_tiles/VillageInterior_Structure.png',
    tileSize: 16,
    columns: 32,
    rows: 32,
    tiles: [
      { x: 0, y: 0, type: 'floor', passable: true, name: 'Wood Floor', category: 'terrain' },
      { x: 1, y: 0, type: 'wall', passable: false, name: 'Interior Wall', category: 'structure' },
      // TODO: Добавить интерьерные элементы
    ]
  },

  villageInteriorObjects: {
    id: 'villageInteriorObjects',
    name: 'Interior Objects',
    imagePath: '/maps/open_world_tiles/VillageInterior_Objects.png',
    tileSize: 16,
    columns: 32,
    rows: 32,
    tiles: [
      { x: 0, y: 0, type: 'floor', passable: true, name: 'Table', category: 'decoration' },
      { x: 1, y: 0, type: 'floor', passable: true, name: 'Chair', category: 'decoration' },
      { x: 2, y: 0, type: 'chest', passable: true, name: 'Furniture', category: 'decoration' },
      // TODO: Добавить мебель и декорации
    ]
  }
};

/**
 * Получить метаданные тайла по координатам
 */
export function getTileMetadata(
  tilesetId: string,
  tileX: number,
  tileY: number
): TilesetTileMetadata | undefined {
  const tileset = TILESET_REGISTRY[tilesetId];
  if (!tileset) return undefined;

  return tileset.tiles.find(t => t.x === tileX && t.y === tileY);
}

/**
 * Получить все тайлы определенной категории
 */
export function getTilesByCategory(
  tilesetId: string,
  category: string
): TilesetTileMetadata[] {
  const tileset = TILESET_REGISTRY[tilesetId];
  if (!tileset) return [];

  return tileset.tiles.filter(t => t.category === category);
}

/**
 * Получить все тайлы определенного типа
 */
export function getTilesByType(
  tilesetId: string,
  cellType: CellType
): TilesetTileMetadata[] {
  const tileset = TILESET_REGISTRY[tilesetId];
  if (!tileset) return [];

  return tileset.tiles.filter(t => t.type === cellType);
}

/**
 * Получить все тайлы по временному слою
 */
export function getTilesByTimeLayer(
  tilesetId: string,
  timeLayer: TimeLayer
): TilesetTileMetadata[] {
  const tileset = TILESET_REGISTRY[tilesetId];
  if (!tileset) return [];

  return tileset.tiles.filter(t => t.timeLayer === timeLayer);
}

/**
 * Получить все тайлы со спавн-точками
 */
export function getSpawnPointTiles(
  tilesetId: string
): TilesetTileMetadata[] {
  const tileset = TILESET_REGISTRY[tilesetId];
  if (!tileset) return [];

  return tileset.tiles.filter(t => t.entitySpawnPoint === true);
}

/**
 * Обновить метаданные тайла (для редактора)
 * Возвращает обновленный тайл или undefined если не найден
 */
export function updateTileMetadata(
  tilesetId: string,
  tileX: number,
  tileY: number,
  updates: Partial<TilesetTileMetadata>
): TilesetTileMetadata | undefined {
  const tileset = TILESET_REGISTRY[tilesetId];
  if (!tileset) return undefined;

  const tileIndex = tileset.tiles.findIndex(t => t.x === tileX && t.y === tileY);

  if (tileIndex === -1) {
    // Тайл не найден - создаем новый
    const newTile: TilesetTileMetadata = {
      x: tileX,
      y: tileY,
      type: updates.type || 'floor',
      passable: updates.passable ?? true,
      ...updates
    };
    tileset.tiles.push(newTile);
    return newTile;
  }

  // Обновляем существующий тайл
  tileset.tiles[tileIndex] = {
    ...tileset.tiles[tileIndex],
    ...updates
  };

  return tileset.tiles[tileIndex];
}

/**
 * Добавить триггер к тайлу
 */
export function addTriggerToTile(
  tilesetId: string,
  tileX: number,
  tileY: number,
  trigger: TriggerConfig
): boolean {
  const tileset = TILESET_REGISTRY[tilesetId];
  if (!tileset) return false;

  const tile = tileset.tiles.find(t => t.x === tileX && t.y === tileY);
  if (!tile) return false;

  if (!tile.triggers) {
    tile.triggers = [];
  }

  tile.triggers.push(trigger);
  return true;
}

/**
 * Удалить триггер с тайла по индексу
 */
export function removeTriggerFromTile(
  tilesetId: string,
  tileX: number,
  tileY: number,
  triggerIndex: number
): boolean {
  const tileset = TILESET_REGISTRY[tilesetId];
  if (!tileset) return false;

  const tile = tileset.tiles.find(t => t.x === tileX && t.y === tileY);
  if (!tile || !tile.triggers) return false;

  if (triggerIndex >= 0 && triggerIndex < tile.triggers.length) {
    tile.triggers.splice(triggerIndex, 1);
    return true;
  }

  return false;
}

/**
 * Установить сущность на тайл
 */
export function setEntityOnTile(
  tilesetId: string,
  tileX: number,
  tileY: number,
  entity: EntityConfig | undefined
): boolean {
  const tileset = TILESET_REGISTRY[tilesetId];
  if (!tileset) return false;

  const tile = tileset.tiles.find(t => t.x === tileX && t.y === tileY);
  if (!tile) return false;

  tile.defaultEntity = entity;
  tile.entitySpawnPoint = !!entity;
  return true;
}

// === Экспорт списка всех доступных категорий тайлов ===
export const TILE_CATEGORIES = [
  'terrain',     // Ландшафт (трава, песок, снег, вода)
  'structure',   // Структуры (стены, двери, колонны)
  'decoration',  // Декорации (мебель, растения)
  'interactive', // Интерактивные (сундуки, рычаги)
  'special'      // Специальные (порталы, точки спавна)
] as const;

export type TileCategory = typeof TILE_CATEGORIES[number];

// === Экспорт списка типов ячеек с названиями ===
export const CELL_TYPE_NAMES: Record<CellType, string> = {
  floor: 'Пол',
  wall: 'Стена',
  door: 'Дверь (закрыта)',
  door_open: 'Дверь (открыта)',
  secret_door: 'Секретная дверь',
  trap: 'Ловушка',
  water: 'Вода',
  lava: 'Лава',
  grass: 'Трава',
  stairs_down: 'Лестница вниз',
  stairs_up: 'Лестница вверх',
  torch: 'Факел (потух)',
  torch_lit: 'Факел (горит)',
  merchant: 'Торговец',
  secret_button: 'Секретная кнопка',
  secret_button_activated: 'Кнопка (активна)',
  bonfire: 'Костёр',
  chest: 'Сундук'
};
