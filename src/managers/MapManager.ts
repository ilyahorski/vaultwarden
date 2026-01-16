import { WorldRepository } from '../db/repositories/WorldRepository';
import { MapLoader, type MapData } from '../excalibur/loaders/MapLoader';
import type { CellData, TimeLayer } from '../types';

/**
 * MapManager - централизованное управление картами всех уровней
 *
 * Приоритет загрузки: IndexedDB → JSON → Error
 */
export class MapManager {
  /**
   * Загружает карту с приоритетом: IndexedDB → JSON → Error
   *
   * @param mapId - Уникальный идентификатор карты ('world', 'town_1', 'dungeon_1')
   * @param jsonPath - Опциональный путь к JSON файлу для fallback
   * @param timeLayer - Временной слой (по умолчанию 'present')
   * @returns MapData с загруженной картой
   * @throws Error если карта не найдена ни в IndexedDB, ни в JSON
   */
  static async loadMap(
    mapId: string,
    jsonPath?: string,
    timeLayer: TimeLayer = 'present'
  ): Promise<MapData> {
    console.log(`[MapManager] Loading map: ${mapId}`);

    // Шаг 1: Проверяем IndexedDB
    const savedMap = await WorldRepository.loadMap(mapId, timeLayer);
    if (savedMap) {
      console.log(`[MapManager] Loaded ${mapId} from IndexedDB`);
      return {
        version: 1,
        name: savedMap.mapDef.name,
        width: savedMap.mapDef.width,
        height: savedMap.mapDef.height,
        grid: savedMap.grid,
      };
    }

    // Шаг 2: Загружаем из JSON (если путь указан)
    if (jsonPath) {
      console.log(`[MapManager] Loading ${mapId} from JSON: ${jsonPath}`);
      const mapData = await MapLoader.load(jsonPath);

      // Автосохранение в IndexedDB
      console.log(`[MapManager] Saving ${mapId} to IndexedDB...`);
      await WorldRepository.saveMap(mapId, mapData.name, mapData.grid, timeLayer);
      console.log(`[MapManager] ${mapId} saved to IndexedDB`);

      return mapData;
    }

    throw new Error(`[MapManager] Map ${mapId} not found in IndexedDB or JSON`);
  }

  /**
   * Сохранить текущую карту
   *
   * @param mapId - Уникальный идентификатор карты
   * @param mapName - Название карты
   * @param grid - Сетка тайлов
   * @param timeLayer - Временной слой
   */
  static async saveMap(
    mapId: string,
    mapName: string,
    grid: CellData[][],
    timeLayer: TimeLayer = 'present'
  ): Promise<void> {
    await WorldRepository.saveMap(mapId, mapName, grid, timeLayer);
  }

  /**
   * Получить список доступных карт
   *
   * @returns Массив идентификаторов карт
   */
  static async listMaps(): Promise<string[]> {
    const maps = await WorldRepository.getAllMaps();
    return maps.map((m) => m.mapId);
  }

  /**
   * Проверить существование карты
   *
   * @param mapId - Уникальный идентификатор карты
   * @returns true если карта существует в IndexedDB
   */
  static async hasMap(mapId: string): Promise<boolean> {
    return await WorldRepository.hasWorldData(mapId);
  }

  /**
   * Удалить карту из IndexedDB
   *
   * @param mapId - Уникальный идентификатор карты
   */
  static async deleteMap(mapId: string): Promise<void> {
    await WorldRepository.deleteMap(mapId);
    console.log(`[MapManager] Deleted map: ${mapId}`);
  }
}
