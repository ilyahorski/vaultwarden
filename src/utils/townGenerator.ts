import type { CellData } from '../types';
import { GRID_SIZE } from '../constants';
import { rand, createEmptyGrid } from './index';

// =====================================================
// ГЕНЕРАТОР ГОРОДОВ (TOWN GENERATOR)
// =====================================================

export interface TownBuilding {
  type: 'tavern' | 'weapon_shop' | 'armor_shop' | 'house' | 'plaza';
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Генерирует сетку улиц для города
 * @param grid - пустая сетка для заполнения
 * @returns массив координат улиц
 */
const createStreetGrid = (grid: CellData[][]): { x: number; y: number }[] => {
  const streets: { x: number; y: number }[] = [];
  const streetInterval = 7; // Улица каждые 7 клеток

  // Вертикальные улицы
  for (let x = streetInterval; x < GRID_SIZE - 1; x += streetInterval) {
    for (let y = 1; y < GRID_SIZE - 1; y++) {
      grid[y][x].type = 'floor'; // Мощёная дорога
      streets.push({ x, y });
    }
  }

  // Горизонтальные улицы
  for (let y = streetInterval; y < GRID_SIZE - 1; y += streetInterval) {
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      grid[y][x].type = 'floor';
      streets.push({ x, y });
    }
  }

  return streets;
};

/**
 * Проверяет, не пересекается ли здание с улицей или другим зданием
 */
const isValidBuildingPosition = (
  grid: CellData[][],
  x: number,
  y: number,
  w: number,
  h: number
): boolean => {
  // Проверка границ
  if (x < 1 || y < 1 || x + w >= GRID_SIZE - 1 || y + h >= GRID_SIZE - 1) {
    return false;
  }

  // Проверка, не занята ли область
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const cell = grid[y + dy][x + dx];
      // Здание не должно пересекаться с улицами (floor) или другими зданиями
      if (cell.type !== 'wall') {
        return false;
      }
    }
  }

  return true;
};

/**
 * Размещает здание на карте
 */
const placeBuilding = (
  grid: CellData[][],
  x: number,
  y: number,
  w: number,
  h: number,
  type: TownBuilding['type']
): TownBuilding => {
  // Внешние стены здания
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const isWall = dx === 0 || dx === w - 1 || dy === 0 || dy === h - 1;
      grid[y + dy][x + dx].type = isWall ? 'wall' : 'floor';
    }
  }

  // Вход в здание (дверь в нижней стене)
  const doorX = x + Math.floor(w / 2);
  const doorY = y + h - 1;
  grid[doorY][doorX].type = 'door';

  // Специальные маркеры для типов зданий
  const centerX = x + Math.floor(w / 2);
  const centerY = y + Math.floor(h / 2);

  if (type === 'tavern') {
    // Таверна = костёр (точка отдыха)
    grid[centerY][centerX].type = 'bonfire';
  } else if (type === 'weapon_shop' || type === 'armor_shop') {
    // Магазин = торговец
    grid[centerY][centerX].type = 'merchant';
  } else if (type === 'plaza') {
    // Площадь = фонтан (декорация из water)
    grid[centerY][centerX].type = 'water';
  }

  return { type, x, y, w, h };
};

/**
 * Размещает здания в городе между улицами
 */
const placeTownBuildings = (
  grid: CellData[][],
  requiredBuildings: TownBuilding['type'][]
): TownBuilding[] => {
  const buildings: TownBuilding[] = [];
  const buildingSize = { min: 4, max: 6 };

  // Сначала размещаем обязательные здания
  for (const buildingType of requiredBuildings) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      const w = rand(buildingSize.min, buildingSize.max);
      const h = rand(buildingSize.min, buildingSize.max);
      const x = rand(2, GRID_SIZE - w - 2);
      const y = rand(2, GRID_SIZE - h - 2);

      if (isValidBuildingPosition(grid, x, y, w, h)) {
        const building = placeBuilding(grid, x, y, w, h, buildingType);
        buildings.push(building);
        placed = true;
      }

      attempts++;
    }
  }

  // Затем добавляем случайные дома
  const additionalHouses = rand(8, 12);
  for (let i = 0; i < additionalHouses; i++) {
    const w = rand(buildingSize.min, buildingSize.max);
    const h = rand(buildingSize.min, buildingSize.max);
    const x = rand(2, GRID_SIZE - w - 2);
    const y = rand(2, GRID_SIZE - h - 2);

    if (isValidBuildingPosition(grid, x, y, w, h)) {
      const buildingType = rand(0, 100) < 30 ? 'plaza' : 'house';
      const building = placeBuilding(grid, x, y, w, h, buildingType);
      buildings.push(building);
    }
  }

  return buildings;
};

/**
 * Добавляет декорации в город (деревья, фонари)
 */
const addTownDecorations = (grid: CellData[][]): void => {
  // Размещаем факелы вдоль улиц
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x].type === 'floor') {
        // Шанс разместить факел на углах улиц
        const hasWallNearby =
          (x > 0 && grid[y][x - 1].type === 'wall') ||
          (x < GRID_SIZE - 1 && grid[y][x + 1].type === 'wall') ||
          (y > 0 && grid[y - 1][x].type === 'wall') ||
          (y < GRID_SIZE - 1 && grid[y + 1][x].type === 'wall');

        if (hasWallNearby && rand(0, 100) < 15) {
          grid[y][x].type = 'torch_lit';
        }
      }

      // Добавляем траву вокруг зданий
      if (grid[y][x].type === 'wall') {
        const isExteriorWall =
          (x > 0 && grid[y][x - 1].type === 'wall') ||
          (x < GRID_SIZE - 1 && grid[y][x + 1].type === 'wall') ||
          (y > 0 && grid[y - 1][x].type === 'wall') ||
          (y < GRID_SIZE - 1 && grid[y + 1][x].type === 'wall');

        if (isExteriorWall && rand(0, 100) < 5) {
          grid[y][x].type = 'grass';
        }
      }
    }
  }
};

/**
 * Основная функция генерации города
 * @param townName - название города (для будущего использования)
 * @returns сгенерированная сетка города и список зданий
 */
export const generateTownGrid = (townName: string = 'Town'): {
  grid: CellData[][];
  buildings: TownBuilding[];
} => {
  const newGrid = createEmptyGrid();

  // Создаём сетку улиц
  createStreetGrid(newGrid);

  // Размещаем обязательные здания
  const requiredBuildings: TownBuilding['type'][] = [
    'tavern',
    'weapon_shop',
    'armor_shop'
  ];

  const buildings = placeTownBuildings(newGrid, requiredBuildings);

  // Добавляем декорации
  addTownDecorations(newGrid);

  // Размещаем выход из города (лестница вверх в центре)
  const exitX = Math.floor(GRID_SIZE / 2);
  const exitY = Math.floor(GRID_SIZE / 2);

  // Убеждаемся, что точка выхода на улице
  let foundExit = false;
  for (let radius = 0; radius < 10 && !foundExit; radius++) {
    for (let dy = -radius; dy <= radius && !foundExit; dy++) {
      for (let dx = -radius; dx <= radius && !foundExit; dx++) {
        const x = exitX + dx;
        const y = exitY + dy;

        if (x > 0 && x < GRID_SIZE - 1 && y > 0 && y < GRID_SIZE - 1) {
          if (newGrid[y][x].type === 'floor' && !newGrid[y][x].item && !newGrid[y][x].enemy) {
            newGrid[y][x].type = 'stairs_up';
            foundExit = true;
          }
        }
      }
    }
  }

  return { grid: newGrid, buildings };
};

/**
 * Генерирует базовую карту мира
 * @returns сгенерированная сетка карты мира
 */
export const generateWorldMapGrid = (): CellData[][] => {
  const newGrid = createEmptyGrid();

  // Заполняем всю карту травой
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      newGrid[y][x].type = 'grass';
    }
  }

  // Добавляем границы из стен
  for (let x = 0; x < GRID_SIZE; x++) {
    newGrid[0][x].type = 'wall';
    newGrid[GRID_SIZE - 1][x].type = 'wall';
  }
  for (let y = 0; y < GRID_SIZE; y++) {
    newGrid[y][0].type = 'wall';
    newGrid[y][GRID_SIZE - 1].type = 'wall';
  }

  // Добавляем водоём в верхнем левом углу
  for (let y = 3; y < 10; y++) {
    for (let x = 3; x < 12; x++) {
      if (rand(0, 100) < 80) {
        newGrid[y][x].type = 'water';
      }
    }
  }

  // Добавляем лес (стены) в правой части
  for (let y = 5; y < 35; y++) {
    for (let x = 35; x < 42; x++) {
      if (rand(0, 100) < 60) {
        newGrid[y][x].type = 'wall';
      }
    }
  }

  // Добавляем горы (стены) в нижней части
  for (let y = 35; y < 42; y++) {
    for (let x = 10; x < 30; x++) {
      if (rand(0, 100) < 70) {
        newGrid[y][x].type = 'wall';
      }
    }
  }

  // Размещаем вход в город (лестница вниз) в центре
  const townEntranceX = 22;
  const townEntranceY = 22;
  newGrid[townEntranceY][townEntranceX].type = 'stairs_down';

  // Очищаем область вокруг входа
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = townEntranceX + dx;
      const y = townEntranceY + dy;
      if (x > 0 && x < GRID_SIZE - 1 && y > 0 && y < GRID_SIZE - 1) {
        if (newGrid[y][x].type !== 'stairs_down') {
          newGrid[y][x].type = 'grass';
        }
      }
    }
  }

  // Размещаем несколько врагов по карте мира
  const enemies: Array<{ x: number; y: number; type: string }> = [
    { x: 15, y: 15, type: 'slime' },
    { x: 30, y: 15, type: 'rat' },
    { x: 15, y: 30, type: 'snake' },
    { x: 30, y: 30, type: 'goblin_fighter' }
  ];

  enemies.forEach(({ x, y, type }) => {
    if (newGrid[y][x].type === 'grass') {
      newGrid[y][x].enemy = type as any;
    }
  });

  return newGrid;
};
