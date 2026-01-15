import * as ex from 'excalibur';
import { TILE_CONFIG } from '../config/TileConfig';
import { TILESET_REGISTRY } from '../config/TilesetConfig';

/**
 * Кэш загруженных ImageSource (один на каждый тайлсет)
 */
const imageSourceCache = new Map<string, ex.ImageSource>();

/**
 * Кэш SpriteSheet (один на каждый тайлсет)
 */
const spriteSheetCache = new Map<string, ex.SpriteSheet>();

/**
 * Кэш вырезанных спрайтов по координатам (кэш для оптимизации)
 */
const spriteCache = new Map<string, ex.Sprite>();

/**
 * Загружает ImageSource и создает SpriteSheet для тайлсета
 * @param tilesetId ID тайлсета ('grassBiome', 'desertBiome', и т.д.)
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

  // Кэшируем ImageSource
  imageSourceCache.set(tilesetId, imageSource);

  // Создаем SpriteSheet из загруженного изображения
  const spriteSheet = ex.SpriteSheet.fromImageSource({
    image: imageSource,
    grid: {
      rows: tileset.rows,
      columns: tileset.columns,
      spriteWidth: tileset.tileSize,
      spriteHeight: tileset.tileSize
    }
  });

  // Кэшируем SpriteSheet
  spriteSheetCache.set(tilesetId, spriteSheet);

  console.log(`[ImageSprites] Loaded tileset: ${tilesetId} (${tileset.columns}x${tileset.rows}, ${tileset.imagePath})`);

  return imageSource;
}

/**
 * Получает спрайт из тайлсета по координатам (с кэшированием)
 * @param tilesetId ID тайлсета
 * @param tileX X координата в атласе (0-based)
 * @param tileY Y координата в атласе (0-based)
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

  // Получаем SpriteSheet
  const spriteSheet = spriteSheetCache.get(tilesetId);
  if (!spriteSheet) {
    console.warn(`[ImageSprites] SpriteSheet not loaded for tileset: ${tilesetId}`);
    return null;
  }

  console.log(`[ImageSprites] SpriteSheet for ${tilesetId}:`, {
    columns: spriteSheet.columns,
    rows: spriteSheet.rows,
    totalSprites: spriteSheet.sprites.length,
    requestedTile: `(${tileX}, ${tileY})`
  });

  const tileset = TILESET_REGISTRY[tilesetId];
  if (!tileset) {
    console.warn(`[ImageSprites] Tileset config not found: ${tilesetId}`);
    return null;
  }

  console.log(`[ImageSprites] Tileset config for ${tilesetId}:`, {
    configColumns: tileset.columns,
    configRows: tileset.rows,
    expectedTotal: tileset.columns * tileset.rows
  });

  // Проверяем валидность координат
  if (tileX < 0 || tileX >= tileset.columns || tileY < 0 || tileY >= tileset.rows) {
    console.warn(`[ImageSprites] Invalid tile coordinates: (${tileX}, ${tileY}) for tileset ${tilesetId} (max: ${tileset.columns}x${tileset.rows})`);
    return null;
  }

  // ИСПРАВЛЕНО: getSprite принимает координаты (x, y), а не индекс!
  const sprite = spriteSheet.getSprite(tileX, tileY);
  console.log(`[ImageSprites] Got sprite at (${tileX}, ${tileY})`);

  if (!sprite) {
    console.warn(`[ImageSprites] Failed to get sprite at (${tileX}, ${tileY}) from ${tilesetId}`);
    return null;
  }

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
 * Очистка всех кэшей (изображения, SpriteSheet и спрайты)
 * ВНИМАНИЕ: После этого нужно заново загружать тайлсеты
 */
export function clearAllCaches(): void {
  spriteCache.clear();
  spriteSheetCache.clear();
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
