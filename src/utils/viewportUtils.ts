import type { CellData } from '../types';
import { GRID_SIZE } from '../constants';

/**
 * Извлекает viewport (видимую область) из большой карты
 * @param fullMap - полная карта любого размера
 * @param centerX - X координата центра viewport (позиция игрока)
 * @param centerY - Y координата центра viewport (позиция игрока)
 * @param viewportSize - размер viewport (по умолчанию GRID_SIZE)
 * @returns viewport сетка размером viewportSize×viewportSize
 */
export function extractViewport(
  fullMap: CellData[][],
  centerX: number,
  centerY: number,
  viewportSize: number = GRID_SIZE
): { viewport: CellData[][], offsetX: number, offsetY: number } {
  const mapHeight = fullMap.length;
  const mapWidth = fullMap[0]?.length || 0;

  // Вычисляем границы viewport
  const halfSize = Math.floor(viewportSize / 2);

  let startX = centerX - halfSize;
  let startY = centerY - halfSize;

  // Корректируем границы если viewport выходит за карту
  if (startX < 0) startX = 0;
  if (startY < 0) startY = 0;
  if (startX + viewportSize > mapWidth) startX = mapWidth - viewportSize;
  if (startY + viewportSize > mapHeight) startY = mapHeight - viewportSize;

  // Убеждаемся что начало не отрицательное
  if (startX < 0) startX = 0;
  if (startY < 0) startY = 0;

  // Создаём viewport
  const viewport: CellData[][] = [];

  for (let y = 0; y < viewportSize; y++) {
    const row: CellData[] = [];

    for (let x = 0; x < viewportSize; x++) {
      const mapY = startY + y;
      const mapX = startX + x;

      // Если выходим за границы карты, создаём пустую клетку (void)
      if (mapY >= mapHeight || mapX >= mapWidth || mapY < 0 || mapX < 0) {
        row.push({
          x,
          y,
          type: 'wall', // За границами = стена
          item: null,
          enemy: null,
          isRevealed: false,
          isVisible: false
        });
      } else {
        // Копируем клетку из полной карты с обновлёнными координатами для viewport
        const cell = fullMap[mapY][mapX];
        row.push({
          ...cell,
          x, // Локальные координаты в viewport
          y
        });
      }
    }

    viewport.push(row);
  }

  return {
    viewport,
    offsetX: startX, // Смещение viewport относительно полной карты
    offsetY: startY
  };
}

/**
 * Обновляет полную карту из viewport (для сохранения изменений)
 * @param fullMap - полная карта
 * @param viewport - viewport с изменениями
 * @param offsetX - X смещение viewport
 * @param offsetY - Y смещение viewport
 */
export function updateFullMapFromViewport(
  fullMap: CellData[][],
  viewport: CellData[][],
  offsetX: number,
  offsetY: number
): void {
  const mapHeight = fullMap.length;
  const mapWidth = fullMap[0]?.length || 0;

  viewport.forEach((row, y) => {
    row.forEach((cell, x) => {
      const mapY = offsetY + y;
      const mapX = offsetX + x;

      // Проверяем границы
      if (mapY >= 0 && mapY < mapHeight && mapX >= 0 && mapX < mapWidth) {
        // Обновляем клетку в полной карте
        // Сохраняем оригинальные координаты полной карты
        fullMap[mapY][mapX] = {
          ...cell,
          x: mapX,
          y: mapY
        };
      }
    });
  });
}

/**
 * Проверяет, нужно ли обновить viewport (игрок вышел за границы)
 * @param playerX - текущая позиция игрока X в viewport
 * @param playerY - текущая позиция игрока Y в viewport
 * @param viewportSize - размер viewport
 * @param margin - отступ от края для обновления (по умолчанию 5)
 * @returns true если нужно обновить viewport
 */
export function shouldUpdateViewport(
  playerX: number,
  playerY: number,
  viewportSize: number = GRID_SIZE,
  margin: number = 5
): boolean {
  return (
    playerX < margin ||
    playerY < margin ||
    playerX >= viewportSize - margin ||
    playerY >= viewportSize - margin
  );
}
