import type { CellType } from '../../types';

/**
 * Метаданные одного тайла в тайлсете
 */
export interface TilesetTileMetadata {
  x: number;           // X координата в атласе
  y: number;           // Y координата в атласе
  type: CellType;      // Тип ячейки для игровой логики
  passable: boolean;   // Проходимость (true = можно ходить, false = solid)
  name?: string;       // Человекочитаемое имя для UI
  category?: string;   // Категория (terrain, structure, decoration)
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
