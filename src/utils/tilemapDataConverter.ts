/**
 * Конвертер данных между форматом tilemap-editor и форматом Excalibur/MapLoader
 */

import type { CellData, CellType } from '../types';
import type {
  TilemapEditorData,
  TilemapMap,
  TileSet,
  FlattenedMapData
} from '../config/tilemapEditorConfig';

/**
 * Интерфейс данных карты для Excalibur (MapLoader)
 */
export interface ExcaliburMapData {
  version: number;
  name: string;
  width: number;
  height: number;
  grid: CellData[][];
}

// === Маппинг логических тайлсетов ===

/**
 * Маппинг тайлов collision.png → passable
 */
const COLLISION_TILESET_MAPPING: Record<number, boolean | undefined> = {
  0: undefined,  // Прозрачный = использовать metadata
  1: false,      // Красный = непроходимый
  2: undefined,  // Желтый = особая логика (пока не используется)
  3: true,       // Зеленый = проходимый
};

/**
 * Маппинг тайлов triggers.png → type
 */
const TRIGGER_TILESET_MAPPING: Record<number, CellType> = {
  0: 'bonfire',
  1: 'trap',
  2: 'lava',
  3: 'merchant',
  4: 'door', // portal -> используем существующий door
  5: 'chest',
  6: 'floor', // npc_spawn -> пока используем floor
  7: 'floor', // enemy_spawn -> пока используем floor
};

/**
 * Определяет является ли тайлсет логическим
 */
function isLogicalTileset(tilesetName: string): 'collision' | 'triggers' | 'time' | null {
  const normalized = tilesetName.toLowerCase();
  if (normalized.includes('collision')) return 'collision';
  if (normalized.includes('trigger')) return 'triggers';
  if (normalized.includes('time')) return 'time';
  return null;
}

/**
 * Парсит символ тайла из tilemap-editor
 * Формат: "tilesetIndex:tileX:tileY" или null
 */
function parseTileSymbol(symbol: string | null): {
  tilesetIndex: number;
  tileX: number;
  tileY: number;
} | null {
  if (!symbol || symbol === '' || symbol === '0') return null;

  // tilemap-editor использует формат "tilesetIndex:tileX:tileY"
  const parts = symbol.split(':');
  if (parts.length >= 3) {
    return {
      tilesetIndex: parseInt(parts[0], 10),
      tileX: parseInt(parts[1], 10),
      tileY: parseInt(parts[2], 10)
    };
  }

  // Альтернативный формат - просто индекс тайла
  const index = parseInt(symbol, 10);
  if (!isNaN(index) && index > 0) {
    // Предполагаем 16 колонок в тайлсете
    const columns = 16;
    return {
      tilesetIndex: 0,
      tileX: (index - 1) % columns,
      tileY: Math.floor((index - 1) / columns)
    };
  }

  return null;
}

/**
 * Определяет тип ячейки на основе тегов тайла
 */
function getCellTypeFromTags(tags: string[] | undefined): CellType {
  if (!tags || tags.length === 0) return 'floor';

  if (tags.includes('solid') || tags.includes('wall')) return 'wall';
  if (tags.includes('water')) return 'water';
  if (tags.includes('lava')) return 'lava';
  if (tags.includes('grass')) return 'grass';
  if (tags.includes('door')) return 'door';
  if (tags.includes('trap')) return 'trap';

  return 'floor';
}

/**
 * Конвертирует данные tilemap-editor в формат Excalibur
 */
export function convertToExcaliburFormat(
  tilemapData: {
    flattenedData?: FlattenedMapData;
    maps: TilemapEditorData['maps'];
    tileSets: TilemapEditorData['tileSets'];
  },
  activeMapName?: string
): ExcaliburMapData {
  // Получаем активную карту
  const mapNames = Object.keys(tilemapData.maps);
  const mapName = activeMapName || mapNames[0] || 'map';
  const map = tilemapData.maps[mapName];

  if (!map) {
    // Возвращаем пустую карту если нет данных
    return {
      version: 1,
      name: 'Empty Map',
      width: 50,
      height: 50,
      grid: createEmptyGrid(50, 50)
    };
  }

  const { width, height, layers } = map;
  const tileSetsList = Object.values(tilemapData.tileSets);

  // Создаём сетку CellData
  const grid: CellData[][] = [];

  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      // Собираем данные из всех слоёв (bottom → middle → top)
      // Верхние слои переопределяют нижние
      let cellType: CellType = 'floor';
      let tilesetX: number | undefined;
      let tilesetY: number | undefined;
      let tilesetSource: string | undefined;

      // Обрабатываем слои в порядке приоритета
      const layerOrder: ('bottom' | 'middle' | 'top')[] = ['bottom', 'middle', 'top'];

      // Переменные для логических слоев
      let passableOverride: boolean | undefined;

      for (const layerName of layerOrder) {
        const layer = layers[layerName];
        if (!layer || !layer[y] || layer[y][x] === null) continue;

        const tileValue = layer[y][x];
        if (tileValue === null || tileValue === 0) continue;

        // Парсим значение тайла
        const tileInfo = parseTileSymbol(String(tileValue));
        if (tileInfo) {
          const tileset = tileSetsList[tileInfo.tilesetIndex];
          if (tileset) {
            const tilesetName = tileset.name || '';
            const logicalType = isLogicalTileset(tilesetName);

            // Обработка логических тайлсетов
            if (logicalType === 'collision') {
              // Collision Layer - определяет passable
              const tileIndex = tileInfo.tileY * (tileset.columns || 16) + tileInfo.tileX;
              passableOverride = COLLISION_TILESET_MAPPING[tileIndex];
              continue; // Не сохраняем визуальные данные
            } else if (logicalType === 'triggers') {
              // Triggers Layer - определяет тип ячейки
              const tileIndex = tileInfo.tileY * (tileset.columns || 16) + tileInfo.tileX;
              const triggeredType = TRIGGER_TILESET_MAPPING[tileIndex];
              if (triggeredType) {
                cellType = triggeredType;
              }
              continue; // Не сохраняем визуальные данные
            } else if (logicalType === 'time') {
              // Time Layers - пока не обрабатываем
              continue;
            }

            // Обычный визуальный тайлсет
            tilesetX = tileInfo.tileX;
            tilesetY = tileInfo.tileY;
            tilesetSource = tilesetName || `tileset_${tileInfo.tilesetIndex}`;

            // Определяем тип ячейки из тегов тайла
            const tileKey = `${tileInfo.tileX}:${tileInfo.tileY}`;
            const tileData = tileset.tiles?.[tileKey];
            const tagBasedType = getCellTypeFromTags(tileData?.tags);
            if (tagBasedType !== 'floor') {
              cellType = tagBasedType;
            }
          }
        }
      }

      grid[y][x] = {
        x,
        y,
        type: cellType,
        tilesetX,
        tilesetY,
        tilesetSource,
        passable: passableOverride, // Логический слой коллизий
        item: null,
        enemy: null,
        isRevealed: false,
        isVisible: false
      };
    }
  }

  return {
    version: 1,
    name: mapName,
    width,
    height,
    grid
  };
}

/**
 * Конвертирует данные Excalibur в формат tilemap-editor
 */
export function convertFromExcaliburFormat(
  mapData: ExcaliburMapData,
  tileSets?: Record<string, TileSet>
): TilemapEditorData {
  const { width, height, grid, name } = mapData;

  // Создаём слои для tilemap-editor
  const layers: TilemapMap['layers'] = {
    bottom: createEmptyLayer(width, height),
    middle: createEmptyLayer(width, height),
    top: createEmptyLayer(width, height)
  };

  // Заполняем bottom слой данными из grid
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y]?.[x];
      if (!cell) continue;

      if (cell.tilesetX !== undefined && cell.tilesetY !== undefined) {
        // Формируем символ тайла: "tilesetIndex:tileX:tileY"
        // Для простоты используем индекс 0 для первого тайлсета
        const tilesetIndex = 0;
        layers.bottom[y][x] = `${tilesetIndex}:${cell.tilesetX}:${cell.tilesetY}` as unknown as number;
      }
    }
  }

  return {
    maps: {
      [name || 'map']: {
        name: name || 'map',
        width,
        height,
        tileSize: 16,
        layers
      }
    },
    tileSets: tileSets || {}
  };
}

/**
 * Создаёт пустую сетку CellData
 */
function createEmptyGrid(width: number, height: number): CellData[][] {
  const grid: CellData[][] = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = {
        x,
        y,
        type: 'floor',
        item: null,
        enemy: null,
        isRevealed: false,
        isVisible: false
      };
    }
  }
  return grid;
}

/**
 * Создаёт пустой слой для tilemap-editor
 */
function createEmptyLayer(width: number, height: number): (number | null)[][] {
  const layer: (number | null)[][] = [];
  for (let y = 0; y < height; y++) {
    layer[y] = [];
    for (let x = 0; x < width; x++) {
      layer[y][x] = null;
    }
  }
  return layer;
}

/**
 * Применяет данные из tilemap-editor к существующей карте Excalibur
 * (для обновления только изменённых тайлов)
 */
export function applyTilemapChanges(
  existingGrid: CellData[][],
  tilemapData: {
    flattenedData?: FlattenedMapData;
    maps: TilemapEditorData['maps'];
    tileSets: TilemapEditorData['tileSets'];
  }
): CellData[][] {
  const newMapData = convertToExcaliburFormat(tilemapData);

  // Создаём новую сетку с данными из tilemap-editor
  const width = Math.max(existingGrid[0]?.length || 0, newMapData.width);
  const height = Math.max(existingGrid.length || 0, newMapData.height);

  const newGrid: CellData[][] = [];

  for (let y = 0; y < height; y++) {
    newGrid[y] = [];
    for (let x = 0; x < width; x++) {
      // Берём данные из новой карты, если есть
      if (y < newMapData.height && x < newMapData.width) {
        newGrid[y][x] = newMapData.grid[y][x];
      }
      // Иначе сохраняем существующие данные
      else if (y < existingGrid.length && x < existingGrid[y].length) {
        newGrid[y][x] = existingGrid[y][x];
      }
      // Иначе создаём пустую ячейку
      else {
        newGrid[y][x] = {
          x,
          y,
          type: 'floor',
          item: null,
          enemy: null,
          isRevealed: false,
          isVisible: false
        };
      }
    }
  }

  return newGrid;
}
