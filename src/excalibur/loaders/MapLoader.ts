import * as ex from 'excalibur';
import { getSharedSprite, SOLID_TILE_TYPES } from '../resources/PlaceholderSprites';
import type { CellData } from '../../types';

export interface MapData {
  version: number;
  name: string;
  width: number;
  height: number;
  grid: CellData[][];
}

/**
 * MapLoader - загружает и конвертирует JSON карту в Excalibur TileMap
 */
export class MapLoader {
  /**
   * Загружает JSON карту из указанного пути
   */
  static async load(path: string): Promise<MapData> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load map: ${response.statusText}`);
      }
      const data = await response.json();
      return data as MapData;
    } catch (error) {
      console.error('Error loading map:', error);
      throw error;
    }
  }

  /**
   * Заполняет Excalibur TileMap данными из JSON (асинхронно порциями)
   */
  static async populateTileMap(tileMap: ex.TileMap, mapData: MapData): Promise<void> {
    const { grid, width, height } = mapData;

    console.log(`Populating TileMap: ${width}×${height} (${width * height} tiles)`);

    const BATCH_SIZE = 10000; // Обрабатываем по 10000 тайлов за раз (shared sprites быстрее)
    let processedTiles = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cellData = grid[y]?.[x];
        if (!cellData) continue;

        const tile = tileMap.getTile(x, y);
        if (!tile) continue;

        // Используем SHARED спрайт (один на все тайлы этого типа)
        const sprite = getSharedSprite(cellData.type);
        tile.addGraphic(sprite);

        // Настраиваем коллизию для непроходимых тайлов
        if (SOLID_TILE_TYPES.has(cellData.type)) {
          tile.solid = true;
        }

        processedTiles++;

        // Каждые BATCH_SIZE тайлов делаем паузу для предотвращения зависания
        if (processedTiles % BATCH_SIZE === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }

    console.log('TileMap populated successfully');
  }

  /**
   * Извлекает позиции триггеров из карты (костры, ловушки, лава, торговцы)
   */
  static extractTriggers(mapData: MapData): Array<{
    x: number;
    y: number;
    type: 'bonfire' | 'trap' | 'lava' | 'merchant';
  }> {
    const triggers: Array<{
      x: number;
      y: number;
      type: 'bonfire' | 'trap' | 'lava' | 'merchant';
    }> = [];

    const { grid, width, height } = mapData;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cellData = grid[y]?.[x];
        if (!cellData) continue;

        // Костры
        if (cellData.type === 'bonfire') {
          triggers.push({ x, y, type: 'bonfire' });
        }

        // Ловушки
        if (cellData.type === 'trap') {
          triggers.push({ x, y, type: 'trap' });
        }

        // Лава
        if (cellData.type === 'lava') {
          triggers.push({ x, y, type: 'lava' });
        }

        // Торговцы (если в ячейке есть merchant)
        // Предполагаем, что торговцы хранятся в cellData.item или специальном поле
        // Для прототипа можно пока не добавлять
      }
    }

    console.log(`Extracted ${triggers.length} triggers from map`);
    return triggers;
  }

  /**
   * Находит стартовую позицию игрока на карте
   */
  static findPlayerStartPosition(mapData: MapData): { x: number; y: number } {
    // Для мировой карты 402×305 стартовая позиция в центре: (201, 152)
    return {
      x: Math.floor(mapData.width / 2),
      y: Math.floor(mapData.height / 2)
    };
  }
}

export default MapLoader;
