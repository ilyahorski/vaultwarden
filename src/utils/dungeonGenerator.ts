import type { CellData, ItemType, EnemyType } from '../types';
import { GRID_SIZE, MONSTER_STATS } from '../constants';
import { rand, createEmptyGrid } from './index';

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

// --- Генерация подземелья ---
export const generateDungeonGrid = (levelIndex: number = 1): { grid: CellData[][], rooms: Room[] } => {
  const newGrid = createEmptyGrid();
  const rooms: Room[] = [];
  const MAX_ROOMS = 12 + Math.min(5, levelIndex);

  // Создание комнат
  for (let i = 0; i < MAX_ROOMS; i++) {
    const w = rand(4, 8);
    const h = rand(4, 8);
    const x = rand(1, GRID_SIZE - w - 2);
    const y = rand(1, GRID_SIZE - h - 2);

    rooms.push({ x, y, w, h });
    for (let ry = y; ry < y + h; ry++) {
      for (let rx = x; rx < x + w; rx++) {
        newGrid[ry][rx].type = 'floor';
      }
    }
  }

  // Создание коридоров между комнатами
  for (let i = 0; i < rooms.length - 1; i++) {
    const p1 = { x: Math.floor(rooms[i].x + rooms[i].w / 2), y: Math.floor(rooms[i].y + rooms[i].h / 2) };
    const p2 = { x: Math.floor(rooms[i + 1].x + rooms[i + 1].w / 2), y: Math.floor(rooms[i + 1].y + rooms[i + 1].h / 2) };

    let curX = p1.x;
    let curY = p1.y;

    while (curX !== p2.x) {
      newGrid[curY][curX].type = 'floor';
      curX += curX < p2.x ? 1 : -1;
    }
    while (curY !== p2.y) {
      newGrid[curY][curX].type = 'floor';
      curY += curY < p2.y ? 1 : -1;
    }
  }

  // Размещение объектов с учетом уровня сложности
  rooms.forEach((room, index) => {
    // Первая комната - Старт
    if (index === 0) return;

    // Последняя комната - Выход
    if (index === rooms.length - 1) {
      const cx = Math.floor(room.x + room.w / 2);
      const cy = Math.floor(room.y + room.h / 2);
      newGrid[cy][cx].type = 'stairs_down';
      return;
    }

    // Генерация факелов (шанс 15%)
    if (rand(0, 100) > 85) {
      const cx = rand(room.x, room.x + room.w - 1);
      const cy = rand(room.y, room.y + room.h - 1);
      if (newGrid[cy][cx].type === 'floor' && !newGrid[cy][cx].item && !newGrid[cy][cx].enemy) {
         newGrid[cy][cx].type = 'torch';
      }
    }

    // Размещение лута
    if (rand(0, 100) > 40) {
      const cx = rand(room.x, room.x + room.w - 1);
      const cy = rand(room.y, room.y + room.h - 1);
      // Не ставим лут там, где уже стоит что-то важное (лестница, факел)
      if (newGrid[cy][cx].type === 'floor') {
          const lootRoll = rand(0, 100);
          let item: ItemType = 'potion_weak';
          const depthBonus = levelIndex * 2;

          if (lootRoll + depthBonus > 95) item = 'weapon_greatsword';
          else if (lootRoll + depthBonus > 85) item = 'armor_chain';
          else if (lootRoll > 75) item = 'potion_strong';
          else if (lootRoll > 65) item = 'weapon_sword';
          else if (lootRoll > 50) item = 'potion_mid';
          else if (lootRoll > 40) item = 'potion_mana_weak';
          newGrid[cy][cx].item = item;
      }
    }

    // Размещение врагов
    if (rand(0, 100) > (30 - levelIndex)) {
      const ex = rand(room.x, room.x + room.w - 1);
      const ey = rand(room.y, room.y + room.h - 1);
      if (!newGrid[ey][ex].item && newGrid[ey][ex].type === 'floor') {
        const enemyRoll = rand(0, 100);
        let enemyType: EnemyType = 'goblin';
        
        if (enemyRoll + levelIndex > 95) enemyType = 'boss';
        else if (enemyRoll + levelIndex * 2 > 80) enemyType = 'orc';
        
        newGrid[ey][ex].enemy = enemyType;
        
        // Расчет и сохранение HP врага
        const stats = MONSTER_STATS[enemyType];
        const maxHp = Math.floor(stats.hp * (1 + (levelIndex - 1) * 0.1));
        newGrid[ey][ex].enemyHp = maxHp;
      }
    }
  });

  return { grid: newGrid, rooms };
};

// --- Получение стартовой позиции ---
export const getStartPosition = (rooms: Room[]): { x: number, y: number } => {
  if (rooms.length === 0) return { x: 1, y: 1 };
  const startRoom = rooms[0];
  return {
    x: Math.floor(startRoom.x + startRoom.w / 2),
    y: Math.floor(startRoom.y + startRoom.h / 2)
  };
};

// --- Поиск лестницы на карте ---
export const findStairs = (grid: CellData[][], type: 'stairs_up' | 'stairs_down'): { x: number, y: number } | null => {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x].type === type) {
        return { x, y };
      }
    }
  }
  return null;
};