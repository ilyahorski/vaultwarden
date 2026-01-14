import * as ex from 'excalibur';
import { TILE_CONFIG } from '../config/TileConfig';

/**
 * Цветовая схема для placeholder тайлов (32×32 px квадраты)
 * Эти цвета будут заменены на реальные спрайты в будущем
 */
export const PLACEHOLDER_COLORS: Record<string, string> = {
  // Природные тайлы
  wall: '#4a4a4a',          // Серый
  floor: '#2d2d2d',         // Темно-серый
  grass: '#4caf50',         // Зеленый
  water: '#2196f3',         // Синий
  lava: '#f44336',          // Красный
  mountain: '#757575',      // Светло-серый

  // Интерактивные объекты
  door: '#795548',          // Коричневый
  door_open: '#a1887f',     // Светло-коричневый
  bonfire: '#ff9800',       // Оранжевый
  torch_lit: '#ffc107',     // Желтый (горящий)
  torch: '#9e9e9e',         // Серый (потухший)
  merchant: '#ffeb3b',      // Ярко-желтый

  // Лестницы
  stairs_down: '#ffc107',   // Желтый
  stairs_up: '#00bcd4',     // Голубой

  // Ловушки и опасности
  trap: '#9c27b0',          // Фиолетовый (невидимы, но для дебага)

  // Особые
  chest: '#ffb300',         // Золотой

  // Дефолт для неизвестных типов
  default: '#000000'        // Черный
};

/**
 * Набор типов тайлов, которые являются непроходимыми (solid)
 */
export const SOLID_TILE_TYPES = new Set<string>([
  'wall',
  'mountain',
  'water',
  'lava',
  'door',
  'torch',
  'torch_lit'
]);

/**
 * Глобальный кэш SHARED спрайтов (НЕ клонируем!)
 * Один спрайт используется для всех тайлов этого типа
 */
const sharedSpriteCache = new Map<string, ex.Rectangle>();

/**
 * Создает SHARED спрайт для типа тайла (один на все тайлы этого типа)
 * ВАЖНО: НЕ клонируем! Используем один экземпляр для всех тайлов
 */
export function getSharedSprite(cellType: string): ex.Rectangle {
  // Проверяем кэш
  if (sharedSpriteCache.has(cellType)) {
    return sharedSpriteCache.get(cellType)!;
  }

  const color = PLACEHOLDER_COLORS[cellType] || PLACEHOLDER_COLORS.default;

  const sprite = new ex.Rectangle({
    width: TILE_CONFIG.TILE_SIZE,
    height: TILE_CONFIG.TILE_SIZE,
    color: ex.Color.fromHex(color)
  });

  // Кэшируем для будущего использования
  sharedSpriteCache.set(cellType, sprite);

  return sprite;
}

/**
 * Создает Excalibur Color из hex строки для типа ячейки
 */
export function getColorForCellType(cellType: string): ex.Color {
  const hexColor = PLACEHOLDER_COLORS[cellType] || PLACEHOLDER_COLORS.default;
  return ex.Color.fromHex(hexColor);
}

export default {
  PLACEHOLDER_COLORS,
  getSharedSprite,
  getColorForCellType
};
