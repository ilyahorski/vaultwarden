import * as ex from 'excalibur';
import { TILE_CONFIG } from '../config/TileConfig';
import { TILESET_REGISTRY } from '../config/TilesetConfig';

/**
 * Кэш загруженных ImageSource (один на каждый тайлсет)
 */
const imageSourceCache = new Map<string, ex.ImageSource>();

/**
 * Кэш вырезанных спрайтов по координатам (кэш для оптимизации)
 */
const spriteCache = new Map<string, ex.Sprite>();

/**
 * Загружает ImageSource для тайлсета
 * @param tilesetId ID тайлсета ('world', 'town', 'dungeon')
 * @returns Promise с загруженным ImageSource
 */
export async function loadTilesetImage(tilesetId: string): Promise<ex.ImageSource> {
  // Проверяем кэш
  if (imageSourceCache.has(tilesetId)) {
    return imageSourceCache.get(tilesetId)!;
  }

  const tileset = TILESET_REGISTRY[tilesetId];
  if (!tileset) {
    throw new Error(`[ImageSprites] Tileset not found: ${tilesetId}`);
  }

  // Создаем ImageSource
  const imageSource = new ex.ImageSource(tileset.imagePath);

  // Загружаем изображение
  await imageSource.load();

  // Кэшируем
  imageSourceCache.set(tilesetId, imageSource);

  console.log(`[ImageSprites] Loaded tileset: ${tilesetId} (${tileset.imagePath})`);

  return imageSource;
}

/**
 * Получает спрайт из тайлсета по координатам (с кэшированием)
 * @param tilesetId ID тайлсета
 * @param tileX X координата в атласе
 * @param tileY Y координата в атласе
 * @returns Excalibur Sprite или null если тайлсет не загружен
 */
export function getSpriteFromTileset(
  tilesetId: string,
  tileX: number,
  tileY: number
): ex.Sprite | null {
  const cacheKey = `${tilesetId}:${tileX}:${tileY}`;

  // Проверяем кэш
  if (spriteCache.has(cacheKey)) {
    return spriteCache.get(cacheKey)!;
  }

  // Получаем ImageSource
  const imageSource = imageSourceCache.get(tilesetId);
  if (!imageSource || !imageSource.isLoaded()) {
    console.warn(`[ImageSprites] Tileset not loaded: ${tilesetId}`);
    return null;
  }

  const tileset = TILESET_REGISTRY[tilesetId];
  if (!tileset) {
    console.warn(`[ImageSprites] Tileset config not found: ${tilesetId}`);
    return null;
  }

  // Вырезаем спрайт из атласа
  const sprite = ex.Sprite.from(imageSource, {
    sourceView: {
      x: tileX * tileset.tileSize,
      y: tileY * tileset.tileSize,
      width: tileset.tileSize,
      height: tileset.tileSize
    },
    destSize: {
      width: TILE_CONFIG.TILE_SIZE,
      height: TILE_CONFIG.TILE_SIZE
    }
  });

  // Кэшируем спрайт
  spriteCache.set(cacheKey, sprite);

  return sprite;
}

/**
 * Предзагрузка всех тайлсетов из реестра
 * Вызывается при инициализации игры
 */
export async function preloadAllTilesets(): Promise<void> {
  const tilesetIds = Object.keys(TILESET_REGISTRY);

  console.log(`[ImageSprites] Preloading ${tilesetIds.length} tilesets...`);

  try {
    await Promise.all(
      tilesetIds.map(id => loadTilesetImage(id))
    );

    console.log('[ImageSprites] All tilesets preloaded successfully');
  } catch (error) {
    console.error('[ImageSprites] Failed to preload tilesets:', error);
    throw error;
  }
}

/**
 * Очистка кэша спрайтов (для освобождения памяти)
 */
export function clearSpriteCache(): void {
  spriteCache.clear();
  console.log('[ImageSprites] Sprite cache cleared');
}

/**
 * Очистка всех кэшей (изображения и спрайты)
 * ВНИМАНИЕ: После этого нужно заново загружать тайлсеты
 */
export function clearAllCaches(): void {
  spriteCache.clear();
  imageSourceCache.clear();
  console.log('[ImageSprites] All caches cleared');
}

/**
 * Получить информацию о загруженных тайлсетах
 */
export function getLoadedTilesets(): string[] {
  return Array.from(imageSourceCache.keys());
}

/**
 * Проверить, загружен ли тайлсет
 */
export function isTilesetLoaded(tilesetId: string): boolean {
  const imageSource = imageSourceCache.get(tilesetId);
  return imageSource !== undefined && imageSource.isLoaded();
}
