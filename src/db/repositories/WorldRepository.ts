import { gameDB, type WorldTile, type TimeLayer } from '../GameDatabase';
import type { CellData, CellType, ItemType, EnemyType } from '../../types';

/**
 * Репозиторий для работы с тайлами мира
 */
export class WorldRepository {
  /**
   * Конвертация CellData в WorldTile для хранения
   */
  static cellDataToWorldTile(cell: CellData, timeLayer: TimeLayer = 'present'): Omit<WorldTile, 'id'> {
    return {
      x: cell.x,
      y: cell.y,
      type: cell.type,
      tilesetX: cell.tilesetX,
      tilesetY: cell.tilesetY,
      tilesetSource: cell.tilesetSource,
      passable: !['wall', 'water', 'lava'].includes(cell.type),
      item: cell.item,
      enemy: cell.enemy,
      enemyHp: cell.enemyHp,
      isRevealed: cell.isRevealed,
      isVisible: cell.isVisible,
      timeLayer
    };
  }

  /**
   * Конвертация WorldTile в CellData для использования
   */
  static worldTileToCellData(tile: WorldTile): CellData {
    return {
      x: tile.x,
      y: tile.y,
      type: tile.type as CellType,
      tilesetX: tile.tilesetX,
      tilesetY: tile.tilesetY,
      tilesetSource: tile.tilesetSource,
      item: tile.item as ItemType,
      enemy: tile.enemy as EnemyType,
      enemyHp: tile.enemyHp,
      isRevealed: tile.isRevealed,
      isVisible: tile.isVisible
    };
  }

  /**
   * Загрузить всю карту для текущего слоя времени
   */
  static async loadWorldMap(
    width: number,
    height: number,
    timeLayer: TimeLayer = 'present'
  ): Promise<CellData[][]> {
    const tiles = await gameDB.worldState
      .where('timeLayer')
      .equals(timeLayer)
      .toArray();

    // Создаем пустую сетку
    const grid: CellData[][] = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        grid[y][x] = {
          x, y,
          type: 'floor',
          item: null,
          enemy: null,
          isRevealed: false,
          isVisible: false
        };
      }
    }

    // Заполняем данными из БД
    for (const tile of tiles) {
      if (tile.x >= 0 && tile.x < width && tile.y >= 0 && tile.y < height) {
        grid[tile.y][tile.x] = this.worldTileToCellData(tile);
      }
    }

    return grid;
  }

  /**
   * Сохранить карту в БД (bulk операция)
   */
  static async saveWorldMap(
    grid: CellData[][],
    timeLayer: TimeLayer = 'present'
  ): Promise<void> {
    const tiles: Omit<WorldTile, 'id'>[] = [];

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        tiles.push(this.cellDataToWorldTile(grid[y][x], timeLayer));
      }
    }

    // Очищаем старые данные для этого слоя
    await gameDB.worldState.where('timeLayer').equals(timeLayer).delete();

    // Записываем новые данные батчами по 10000
    const BATCH_SIZE = 10000;
    for (let i = 0; i < tiles.length; i += BATCH_SIZE) {
      const batch = tiles.slice(i, i + BATCH_SIZE);
      await gameDB.worldState.bulkAdd(batch as WorldTile[]);
    }
  }

  /**
   * Обновить один тайл
   */
  static async updateTile(
    x: number,
    y: number,
    updates: Partial<CellData>,
    timeLayer: TimeLayer = 'present'
  ): Promise<void> {
    const tile = await gameDB.getTile(x, y, timeLayer);
    if (tile?.id) {
      await gameDB.worldState.update(tile.id, {
        ...updates,
        type: updates.type || tile.type
      });
    }
  }

  /**
   * Загрузить тайлы для viewport (оптимизированная загрузка)
   */
  static async loadViewport(
    startX: number,
    startY: number,
    width: number,
    height: number,
    timeLayer: TimeLayer = 'present'
  ): Promise<CellData[][]> {
    const tiles = await gameDB.getTilesInViewport(startX, startY, width, height, timeLayer);

    // Создаем локальную сетку
    const grid: CellData[][] = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        grid[y][x] = {
          x: startX + x,
          y: startY + y,
          type: 'floor',
          item: null,
          enemy: null,
          isRevealed: false,
          isVisible: false
        };
      }
    }

    // Заполняем данными
    for (const tile of tiles) {
      const localX = tile.x - startX;
      const localY = tile.y - startY;
      if (localX >= 0 && localX < width && localY >= 0 && localY < height) {
        grid[localY][localX] = this.worldTileToCellData(tile);
      }
    }

    return grid;
  }

  /**
   * Проверить существование мира в БД
   */
  static async hasWorldData(): Promise<boolean> {
    const count = await gameDB.worldState.count();
    return count > 0;
  }

  /**
   * Получить размеры сохраненного мира
   */
  static async getWorldDimensions(): Promise<{ width: number; height: number } | null> {
    const tiles = await gameDB.worldState.toArray();
    if (tiles.length === 0) return null;

    let maxX = 0;
    let maxY = 0;
    for (const tile of tiles) {
      if (tile.x > maxX) maxX = tile.x;
      if (tile.y > maxY) maxY = tile.y;
    }

    return { width: maxX + 1, height: maxY + 1 };
  }
}

export default WorldRepository;
