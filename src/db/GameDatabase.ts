import Dexie, { type Table } from 'dexie';

// --- Типы для базы данных ---

export type TimeLayer = 'past' | 'present' | 'future';
export type ItemCategory = 'weapon' | 'scroll' | 'clothing' | 'food' | 'quest';

// Определение карты (метаданные)
export interface MapDefinition {
  id?: number;              // auto-increment primary key
  mapId: string;            // Уникальный ID ('world', 'town_1', 'dungeon_1')
  name: string;             // Название ('World Map', 'Town', 'Dungeon Level 1')
  width: number;
  height: number;
  tileSize: number;
  created: Date;
  modified: Date;
}

// Тайл мира (хранится в IndexedDB)
export interface WorldTile {
  id?: number;              // auto-increment
  mapId: string;            // Связь с картой (по умолчанию 'world')
  x: number;
  y: number;
  type: string;             // CellType
  tilesetX?: number;
  tilesetY?: number;
  tilesetSource?: string;
  passable: boolean;
  item?: string | null;     // ItemType
  enemy?: string | null;    // EnemyType
  enemyHp?: number;
  isRevealed: boolean;
  isVisible: boolean;
  // Time-Shift поддержка
  timeLayer: TimeLayer;
  // Entity spawning
  entityId?: string;        // ID сущности для спавна (NPC, Enemy)
}

// Предмет инвентаря
export interface InventoryItem {
  id?: number;              // auto-increment
  slot: number;             // 0-199
  itemType: string;         // ItemType
  category: ItemCategory;
  stackable: boolean;
  quantity: number;
  // Для квестовых предметов
  questId?: string;
  description?: string;
}

// Флаг сюжета
export interface StoryFlag {
  id?: number;
  key: string;              // 'found_ancient_book', 'met_cat', etc.
  value: boolean | number | string;
  timestamp: number;
}

// Данные персонажа (Hero или Cat)
export interface CharacterData {
  id?: number;
  characterType: 'hero' | 'cat';
  name: string;
  x: number;
  y: number;
  facing: 'up' | 'down' | 'left' | 'right';
  // Hero stats
  hp: number;
  maxHp: number;
  stamina?: number;         // Hero only
  maxStamina?: number;      // Hero only
  strength?: number;        // Hero only
  dexterity?: number;       // Hero only
  // Cat stats
  mana?: number;            // Cat only
  maxMana?: number;         // Cat only
  intelligence?: number;    // Cat only
  wisdom?: number;          // Cat only
  // Progression
  xp: number;
  level: number;
  nextLevelXp: number;
  gold: number;
  // Equipment (hero only)
  equippedWeapon?: string | null;
  equippedArmor?: string | null;
}

// Кэш временного слоя
export interface TimeLayerCache {
  id?: number;
  layer: TimeLayer;
  x: number;
  y: number;
  tileData: string;         // JSON сериализованные данные тайла
}

// Состояние игры (meta)
export interface GameMeta {
  id?: number;
  key: string;
  value: string | number | boolean;
}

// --- Класс базы данных ---

export class GameDatabase extends Dexie {
  worldState!: Table<WorldTile>;
  inventory!: Table<InventoryItem>;
  storyFlags!: Table<StoryFlag>;
  characters!: Table<CharacterData>;
  timeLayerCache!: Table<TimeLayerCache>;
  gameMeta!: Table<GameMeta>;
  maps!: Table<MapDefinition>;

  constructor() {
    super('AetheriaGameDB');

    // Version 1 - исходная схема
    this.version(1).stores({
      worldState: '++id, [x+y+timeLayer], timeLayer, type',
      inventory: '++id, slot, category, itemType',
      storyFlags: '++id, &key',
      characters: '++id, &characterType',
      timeLayerCache: '++id, [layer+x+y]',
      gameMeta: '++id, &key'
    });

    // Version 2 - добавлена поддержка множественных карт
    this.version(2).stores({
      worldState: '++id, [mapId+x+y+timeLayer], [mapId+timeLayer], mapId, timeLayer, type',
      inventory: '++id, slot, category, itemType',
      storyFlags: '++id, &key',
      characters: '++id, &characterType',
      timeLayerCache: '++id, [layer+x+y]',
      gameMeta: '++id, &key',
      maps: '++id, &mapId'  // mapId уникальный
    }).upgrade(async (trans) => {
      // Миграция существующих тайлов - добавляем mapId = 'world'
      await trans.table('worldState').toCollection().modify((tile: WorldTile) => {
        if (!tile.mapId) {
          tile.mapId = 'world';
        }
      });
    });
  }

  // --- Вспомогательные методы ---

  // Получить тайл по координатам и слою времени
  async getTile(
    x: number,
    y: number,
    layer: TimeLayer = 'present',
    mapId: string = 'world'
  ): Promise<WorldTile | undefined> {
    return this.worldState
      .where({ mapId, x, y, timeLayer: layer })
      .first();
  }

  // Получить все тайлы в viewport
  async getTilesInViewport(
    startX: number,
    startY: number,
    width: number,
    height: number,
    layer: TimeLayer = 'present',
    mapId: string = 'world'
  ): Promise<WorldTile[]> {
    return this.worldState
      .where('[mapId+timeLayer]').equals([mapId, layer])
      .filter(tile =>
        tile.x >= startX && tile.x < startX + width &&
        tile.y >= startY && tile.y < startY + height
      )
      .toArray();
  }

  // Bulk upsert тайлов (для загрузки карты)
  async bulkUpsertTiles(tiles: Omit<WorldTile, 'id'>[]): Promise<void> {
    await this.worldState.bulkPut(tiles as WorldTile[]);
  }

  // Получить персонажа по типу
  async getCharacter(type: 'hero' | 'cat'): Promise<CharacterData | undefined> {
    return this.characters.where('characterType').equals(type).first();
  }

  // Обновить позицию персонажа
  async updateCharacterPosition(
    type: 'hero' | 'cat',
    x: number,
    y: number,
    facing?: 'up' | 'down' | 'left' | 'right'
  ): Promise<void> {
    const char = await this.getCharacter(type);
    if (char?.id) {
      await this.characters.update(char.id, { x, y, ...(facing && { facing }) });
    }
  }

  // Получить флаг сюжета
  async getStoryFlag(key: string): Promise<boolean | number | string | undefined> {
    const flag = await this.storyFlags.where('key').equals(key).first();
    return flag?.value;
  }

  // Установить флаг сюжета
  async setStoryFlag(key: string, value: boolean | number | string): Promise<void> {
    const existing = await this.storyFlags.where('key').equals(key).first();
    if (existing?.id) {
      await this.storyFlags.update(existing.id, { value, timestamp: Date.now() });
    } else {
      await this.storyFlags.add({ key, value, timestamp: Date.now() });
    }
  }

  // Получить все предметы инвентаря
  async getInventory(): Promise<InventoryItem[]> {
    return this.inventory.orderBy('slot').toArray();
  }

  // Получить предметы по категории
  async getInventoryByCategory(category: ItemCategory): Promise<InventoryItem[]> {
    return this.inventory.where('category').equals(category).toArray();
  }

  // Добавить предмет в инвентарь
  async addToInventory(item: Omit<InventoryItem, 'id'>): Promise<number> {
    return this.inventory.add(item as InventoryItem);
  }

  // Найти свободный слот
  async findFreeSlot(): Promise<number | null> {
    const items = await this.inventory.toArray();
    const usedSlots = new Set(items.map(i => i.slot));
    for (let i = 0; i < 200; i++) {
      if (!usedSlots.has(i)) return i;
    }
    return null;
  }

  // Очистить все данные (новая игра)
  async clearAllData(): Promise<void> {
    await Promise.all([
      this.worldState.clear(),
      this.inventory.clear(),
      this.storyFlags.clear(),
      this.characters.clear(),
      this.timeLayerCache.clear(),
      this.gameMeta.clear()
    ]);
  }

  // Получить мета-значение
  async getMeta(key: string): Promise<string | number | boolean | undefined> {
    const meta = await this.gameMeta.where('key').equals(key).first();
    return meta?.value;
  }

  // Установить мета-значение
  async setMeta(key: string, value: string | number | boolean): Promise<void> {
    const existing = await this.gameMeta.where('key').equals(key).first();
    if (existing?.id) {
      await this.gameMeta.update(existing.id, { value });
    } else {
      await this.gameMeta.add({ key, value });
    }
  }

  // --- Методы для работы с картами ---

  // Получить карту по mapId
  async getMap(mapId: string): Promise<MapDefinition | undefined> {
    return this.maps.where('mapId').equals(mapId).first();
  }

  // Создать или обновить карту
  async upsertMap(map: Omit<MapDefinition, 'id'>): Promise<void> {
    const existing = await this.maps.where('mapId').equals(map.mapId).first();
    if (existing?.id) {
      await this.maps.update(existing.id, { ...map, modified: new Date() });
    } else {
      await this.maps.add(map as MapDefinition);
    }
  }

  // Получить все карты
  async getAllMaps(): Promise<MapDefinition[]> {
    return this.maps.toArray();
  }

  // Удалить карту и все её тайлы
  async deleteMap(mapId: string): Promise<void> {
    await this.worldState.where('mapId').equals(mapId).delete();
    await this.maps.where('mapId').equals(mapId).delete();
  }
}

// Singleton экземпляр базы данных
export const gameDB = new GameDatabase();
