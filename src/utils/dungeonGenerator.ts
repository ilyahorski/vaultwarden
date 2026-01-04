import type { CellData, ItemType, EnemyType } from '../types';
import { GRID_SIZE, MONSTER_STATS } from '../constants';
import { rand, createEmptyGrid } from './index';

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  centerX: number;
  centerY: number;
}

// --- Константы генерации ---
const ROOM_MIN_SIZE = 6;   // Увеличено с 4
const ROOM_MAX_SIZE = 12;  // Увеличено с 9
const ROOM_PADDING = 2;    // Минимальный отступ между комнатами
const MAX_ROOM_ATTEMPTS = 150; // Увеличено для больших комнат

// --- Темы уровней ---
type DungeonTheme = 'crypt' | 'cave' | 'dungeon' | 'ruins' | 'inferno';

interface ThemeConfig {
  name: string;
  waterChance: number;      // Шанс водных комнат
  lavaChance: number;       // Шанс лавовых комнат
  grassChance: number;      // Шанс заросших комнат
  torchChance: number;      // Шанс факелов
  trapMultiplier: number;   // Множитель ловушек
  preferredEnemies: EnemyType[]; // Предпочтительные враги
}

const THEMES: Record<DungeonTheme, ThemeConfig> = {
  crypt: {
    name: 'Склеп',
    waterChance: 5,
    lavaChance: 0,
    grassChance: 0,
    torchChance: 70,
    trapMultiplier: 0.5,
    preferredEnemies: ['skeleton', 'zombie', 'lich']
  },
  cave: {
    name: 'Пещера',
    waterChance: 30,
    lavaChance: 5,
    grassChance: 20,
    torchChance: 20,
    trapMultiplier: 1.0,
    preferredEnemies: ['snake', 'goblin', 'orc']
  },
  dungeon: {
    name: 'Подземелье',
    waterChance: 10,
    lavaChance: 0,
    grassChance: 5,
    torchChance: 60,
    trapMultiplier: 1.5,
    preferredEnemies: ['goblin', 'skeleton', 'orc']
  },
  ruins: {
    name: 'Руины',
    waterChance: 15,
    lavaChance: 0,
    grassChance: 40,
    torchChance: 30,
    trapMultiplier: 0.8,
    preferredEnemies: ['snake', 'skeleton', 'zombie']
  },
  inferno: {
    name: 'Инферно',
    waterChance: 0,
    lavaChance: 40,
    grassChance: 0,
    torchChance: 90,
    trapMultiplier: 2.0,
    preferredEnemies: ['orc', 'orc_chief', 'boss']
  }
};

// --- Выбор темы по глубине ---
const getThemeForDepth = (depth: number): DungeonTheme => {
  // Определённые темы чаще на определённых глубинах
  if (depth <= 2) {
    const themes: DungeonTheme[] = ['cave', 'ruins', 'dungeon'];
    return themes[rand(0, themes.length - 1)];
  }
  if (depth <= 4) {
    const themes: DungeonTheme[] = ['dungeon', 'crypt', 'cave'];
    return themes[rand(0, themes.length - 1)];
  }
  if (depth <= 6) {
    const themes: DungeonTheme[] = ['crypt', 'dungeon', 'inferno'];
    return themes[rand(0, themes.length - 1)];
  }
  // Глубокие уровни — более опасные темы
  const themes: DungeonTheme[] = ['crypt', 'inferno', 'inferno'];
  return themes[rand(0, themes.length - 1)];
};

// --- Проверка пересечения комнат ---
const roomsIntersect = (r1: Room, r2: Room, padding: number = ROOM_PADDING): boolean => {
  return !(
    r1.x + r1.w + padding <= r2.x ||
    r2.x + r2.w + padding <= r1.x ||
    r1.y + r1.h + padding <= r2.y ||
    r2.y + r2.h + padding <= r1.y
  );
};

// --- Создание комнаты ---
const createRoom = (x: number, y: number, w: number, h: number): Room => ({
  x, y, w, h,
  centerX: Math.floor(x + w / 2),
  centerY: Math.floor(y + h / 2)
});

// --- Попытка разместить комнату без пересечений ---
const tryPlaceRoom = (existingRooms: Room[], minSize: number, maxSize: number): Room | null => {
  for (let attempt = 0; attempt < MAX_ROOM_ATTEMPTS; attempt++) {
    const w = rand(minSize, maxSize);
    const h = rand(minSize, maxSize);
    const x = rand(2, GRID_SIZE - w - 3);
    const y = rand(2, GRID_SIZE - h - 3);

    const newRoom = createRoom(x, y, w, h);

    // Проверяем пересечение со всеми существующими комнатами
    const intersects = existingRooms.some(room => roomsIntersect(newRoom, room));

    if (!intersects) {
      return newRoom;
    }
  }
  return null;
};

// --- Вырезание комнаты в сетке ---
const carveRoom = (grid: CellData[][], room: Room): void => {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      grid[y][x].type = 'floor';
    }
  }
};

// --- Создание L-образного коридора между комнатами ---
const carveCorridor = (grid: CellData[][], room1: Room, room2: Room): void => {
  let x = room1.centerX;
  let y = room1.centerY;

  const targetX = room2.centerX;
  const targetY = room2.centerY;

  // Случайный порядок: сначала горизонтально или вертикально
  if (rand(0, 1) === 0) {
    // Сначала горизонтально, потом вертикально
    while (x !== targetX) {
      grid[y][x].type = 'floor';
      x += x < targetX ? 1 : -1;
    }
    while (y !== targetY) {
      grid[y][x].type = 'floor';
      y += y < targetY ? 1 : -1;
    }
  } else {
    // Сначала вертикально, потом горизонтально
    while (y !== targetY) {
      grid[y][x].type = 'floor';
      y += y < targetY ? 1 : -1;
    }
    while (x !== targetX) {
      grid[y][x].type = 'floor';
      x += x < targetX ? 1 : -1;
    }
  }
  grid[y][x].type = 'floor'; // Конечная точка
};

// --- Поиск точек входа в комнаты (где коридор соединяется с комнатой) ---
const findRoomEntrances = (grid: CellData[][], rooms: Room[]): { x: number; y: number }[] => {
  const entrances: { x: number; y: number }[] = [];

  for (const room of rooms) {
    // Проверяем каждую сторону комнаты
    // Левая сторона (x = room.x - 1)
    for (let y = room.y; y < room.y + room.h; y++) {
      const wallX = room.x - 1;
      if (wallX >= 0 && wallX < GRID_SIZE) {
        // Если слева от комнаты есть пол (коридор) — это вход
        if (grid[y][wallX].type === 'floor') {
          // Ставим дверь на границе комнаты
          entrances.push({ x: room.x, y });
        }
      }
    }

    // Правая сторона (x = room.x + room.w)
    for (let y = room.y; y < room.y + room.h; y++) {
      const wallX = room.x + room.w;
      if (wallX >= 0 && wallX < GRID_SIZE) {
        if (grid[y][wallX].type === 'floor') {
          entrances.push({ x: room.x + room.w - 1, y });
        }
      }
    }

    // Верхняя сторона (y = room.y - 1)
    for (let x = room.x; x < room.x + room.w; x++) {
      const wallY = room.y - 1;
      if (wallY >= 0 && wallY < GRID_SIZE) {
        if (grid[wallY][x].type === 'floor') {
          entrances.push({ x, y: room.y });
        }
      }
    }

    // Нижняя сторона (y = room.y + room.h)
    for (let x = room.x; x < room.x + room.w; x++) {
      const wallY = room.y + room.h;
      if (wallY >= 0 && wallY < GRID_SIZE) {
        if (grid[wallY][x].type === 'floor') {
          entrances.push({ x, y: room.y + room.h - 1 });
        }
      }
    }
  }

  return entrances;
};

// --- Размещение дверей на входах в комнаты ---
const placeDoors = (grid: CellData[][], rooms: Room[], doorChance: number = 70): void => {
  const entrances = findRoomEntrances(grid, rooms);

  // Убираем дубликаты (одна точка может быть входом для нескольких комнат)
  const uniqueEntrances = entrances.filter((e, i, arr) =>
    arr.findIndex(e2 => e2.x === e.x && e2.y === e.y) === i
  );

  for (const entrance of uniqueEntrances) {
    if (rand(0, 100) < doorChance) {
      grid[entrance.y][entrance.x].type = 'door';
    }
  }
};

// --- Таблица лута по глубине ---
// Возвращает предмет на основе броска и уровня подземелья
const rollLoot = (depth: number): ItemType => {
  const roll = rand(0, 100);
  const depthBonus = depth * 3; // Бонус за глубину

  // Легендарные предметы (только на глубоких уровнях)
  if (depth >= 5 && roll + depthBonus > 115) {
    return rand(0, 1) === 0 ? 'weapon_legend' : 'armor_legend';
  }

  // Редкое снаряжение
  if (roll + depthBonus > 100) {
    const rareItems: ItemType[] = ['weapon_greatsword', 'armor_plate_heavy', 'weapon_axe', 'armor_plate_light'];
    return rareItems[rand(0, rareItems.length - 1)];
  }

  // Хорошее снаряжение
  if (roll + depthBonus > 85) {
    const goodItems: ItemType[] = ['weapon_sword', 'armor_chain', 'weapon_mace', 'armor_studded', 'potion_strong', 'potion_mana_strong'];
    return goodItems[rand(0, goodItems.length - 1)];
  }

  // Среднее снаряжение
  if (roll > 60) {
    const midItems: ItemType[] = ['weapon_dagger', 'armor_leather', 'potion_mid', 'potion_mana_mid'];
    return midItems[rand(0, midItems.length - 1)];
  }

  // Базовое снаряжение и зелья
  if (roll > 30) {
    const basicItems: ItemType[] = ['potion_weak', 'potion_mana_weak', 'weapon_rusty', 'armor_cloth'];
    return basicItems[rand(0, basicItems.length - 1)];
  }

  // Золото или сундук
  return rand(0, 2) === 0 ? 'chest' : 'gold';
};

// --- Размещение ловушек в коридорах ---
const placeTraps = (grid: CellData[][], rooms: Room[], depth: number): void => {
  const trapChance = 5 + depth * 3; // Больше ловушек на глубине

  for (let y = 1; y < GRID_SIZE - 1; y++) {
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      // Ловушки только на полу
      if (grid[y][x].type !== 'floor') continue;
      // Не в комнатах — только в коридорах
      const inRoom = rooms.some(r =>
        x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h
      );
      if (inRoom) continue;

      // Проверяем что это коридор (узкий проход)
      const neighbors = [
        grid[y - 1][x].type,
        grid[y + 1][x].type,
        grid[y][x - 1].type,
        grid[y][x + 1].type
      ];
      const wallCount = neighbors.filter(t => t === 'wall').length;

      // Узкий коридор: 2 стены по бокам
      if (wallCount === 2 && rand(0, 100) < trapChance) {
        grid[y][x].type = 'trap';
      }
    }
  }
};

// --- Создание секретной комнаты ---
const createSecretRoom = (grid: CellData[][], existingRooms: Room[], depth: number): Room | null => {
  // Пытаемся разместить маленькую секретную комнату
  const room = tryPlaceRoom(existingRooms, 3, 5);
  if (!room) return null;

  // Вырезаем комнату
  carveRoom(grid, room);

  // Находим стену, граничащую с коридором или другой комнатой
  let secretDoorPlaced = false;

  // Проверяем каждую сторону комнаты
  const sides = [
    { dx: -1, dy: 0, edge: 'left' },   // левая стена
    { dx: 1, dy: 0, edge: 'right' },   // правая стена
    { dx: 0, dy: -1, edge: 'top' },    // верхняя стена
    { dx: 0, dy: 1, edge: 'bottom' }   // нижняя стена
  ];

  for (const side of sides) {
    if (secretDoorPlaced) break;

    let checkX: number, checkY: number;
    let doorX: number, doorY: number;

    if (side.edge === 'left') {
      doorX = room.x - 1;
      doorY = room.centerY;
      checkX = doorX - 1;
      checkY = doorY;
    } else if (side.edge === 'right') {
      doorX = room.x + room.w;
      doorY = room.centerY;
      checkX = doorX + 1;
      checkY = doorY;
    } else if (side.edge === 'top') {
      doorX = room.centerX;
      doorY = room.y - 1;
      checkX = doorX;
      checkY = doorY - 1;
    } else {
      doorX = room.centerX;
      doorY = room.y + room.h;
      checkX = doorX;
      checkY = doorY + 1;
    }

    // Проверяем границы
    if (checkX < 0 || checkX >= GRID_SIZE || checkY < 0 || checkY >= GRID_SIZE) continue;
    if (doorX < 0 || doorX >= GRID_SIZE || doorY < 0 || doorY >= GRID_SIZE) continue;

    // Если за стеной есть пол — ставим секретную дверь
    if (grid[checkY][checkX].type === 'floor') {
      grid[doorY][doorX].type = 'secret_door';
      secretDoorPlaced = true;
    }
  }

  // Если не удалось поставить секретную дверь — создаём коридор к ближайшей комнате
  if (!secretDoorPlaced && existingRooms.length > 0) {
    const nearestRoom = existingRooms[rand(0, existingRooms.length - 1)];
    carveCorridor(grid, room, nearestRoom);

    // Ставим секретную дверь на входе
    const doorX = room.centerX;
    const doorY = room.centerY;
    // Находим направление к коридору
    if (nearestRoom.centerX < room.centerX && grid[doorY][room.x - 1]?.type === 'floor') {
      grid[doorY][room.x].type = 'secret_door';
    } else if (nearestRoom.centerX > room.centerX && grid[doorY][room.x + room.w]?.type === 'floor') {
      grid[doorY][room.x + room.w - 1].type = 'secret_door';
    } else if (nearestRoom.centerY < room.centerY && grid[room.y - 1]?.[doorX]?.type === 'floor') {
      grid[room.y][doorX].type = 'secret_door';
    } else if (nearestRoom.centerY > room.centerY && grid[room.y + room.h]?.[doorX]?.type === 'floor') {
      grid[room.y + room.h - 1][doorX].type = 'secret_door';
    }
  }

  // Добавляем ценный лут в секретную комнату
  const lootX = room.centerX;
  const lootY = room.centerY;
  if (grid[lootY][lootX].type === 'floor') {
    // Гарантированно хороший лут
    const goodLoot: ItemType[] = [
      'chest', 'weapon_greatsword', 'armor_plate_heavy',
      'potion_strong', 'weapon_axe', 'armor_chain'
    ];
    if (depth >= 4) {
      goodLoot.push('weapon_legend', 'armor_legend');
    }
    grid[lootY][lootX].item = goodLoot[rand(0, goodLoot.length - 1)];
  }

  return room;
};

// --- Размещение декораций в комнате (с учётом темы) ---
const decorateRoom = (grid: CellData[][], room: Room, depth: number, theme: ThemeConfig): void => {
  // Факелы в комнатах (теперь для комнат любого размера >= 4x4)
  if (room.w >= 4 && room.h >= 4 && rand(0, 100) < theme.torchChance) {
    // Позиции для факелов - по углам или вдоль стен
    const torchPositions: { x: number; y: number }[] = [];

    // Углы (с отступом 1 от края)
    torchPositions.push({ x: room.x + 1, y: room.y + 1 });
    torchPositions.push({ x: room.x + room.w - 2, y: room.y + 1 });
    torchPositions.push({ x: room.x + 1, y: room.y + room.h - 2 });
    torchPositions.push({ x: room.x + room.w - 2, y: room.y + room.h - 2 });

    // Для больших комнат добавляем факелы посередине стен
    if (room.w >= 7) {
      const midX = room.x + Math.floor(room.w / 2);
      torchPositions.push({ x: midX, y: room.y + 1 });
      torchPositions.push({ x: midX, y: room.y + room.h - 2 });
    }
    if (room.h >= 7) {
      const midY = room.y + Math.floor(room.h / 2);
      torchPositions.push({ x: room.x + 1, y: midY });
      torchPositions.push({ x: room.x + room.w - 2, y: midY });
    }

    // Размещаем 1-4 факела в зависимости от размера комнаты
    const maxTorches = Math.min(4, Math.floor((room.w + room.h) / 4));
    const torchCount = rand(1, maxTorches);

    // Перемешиваем позиции и берём нужное количество
    const shuffled = torchPositions.sort(() => Math.random() - 0.5);

    for (let i = 0; i < torchCount && i < shuffled.length; i++) {
      const pos = shuffled[i];
      // Проверяем границы
      if (pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE) {
        if (grid[pos.y][pos.x].type === 'floor' && !grid[pos.y][pos.x].item && !grid[pos.y][pos.x].enemy) {
          // На глубине факелы чаще потухшие
          grid[pos.y][pos.x].type = rand(0, 100) > depth * 10 ? 'torch_lit' : 'torch';
        }
      }
    }
  }

  // Водные комнаты
  if (rand(0, 100) < theme.waterChance) {
    const waterCells = Math.floor(room.w * room.h * 0.3);
    for (let i = 0; i < waterCells; i++) {
      const wx = rand(room.x + 1, room.x + room.w - 2);
      const wy = rand(room.y + 1, room.y + room.h - 2);
      if (grid[wy][wx].type === 'floor' && !grid[wy][wx].item && !grid[wy][wx].enemy) {
        grid[wy][wx].type = 'water';
      }
    }
  }

  // Лавовые комнаты
  if (rand(0, 100) < theme.lavaChance) {
    const lavaCells = Math.floor(room.w * room.h * 0.2);
    for (let i = 0; i < lavaCells; i++) {
      const lx = rand(room.x + 1, room.x + room.w - 2);
      const ly = rand(room.y + 1, room.y + room.h - 2);
      if (grid[ly][lx].type === 'floor' && !grid[ly][lx].item && !grid[ly][lx].enemy) {
        grid[ly][lx].type = 'lava';
      }
    }
  }

  // Заросшие комнаты
  if (rand(0, 100) < theme.grassChance) {
    const grassCells = Math.floor(room.w * room.h * 0.4);
    for (let i = 0; i < grassCells; i++) {
      const gx = rand(room.x, room.x + room.w - 1);
      const gy = rand(room.y, room.y + room.h - 1);
      if (grid[gy][gx].type === 'floor' && !grid[gy][gx].item && !grid[gy][gx].enemy) {
        grid[gy][gx].type = 'grass';
      }
    }
  }
};

// --- Таблица врагов по глубине (с учётом темы) ---
// Возвращает тип врага на основе броска, уровня подземелья и темы
const rollEnemy = (depth: number, theme?: ThemeConfig): EnemyType => {
  const roll = rand(0, 100);
  const depthBonus = depth * 5;

  // Боссы (очень редко, чаще на глубине)
  if (roll + depthBonus > 120) {
    // Главный босс только на глубине 4+
    if (depth >= 4 && rand(0, 100) > 70) return 'boss';
    // Мини-боссы
    return rand(0, 1) === 0 ? 'lich' : 'orc_chief';
  }

  // 50% шанс использовать врага из темы
  if (theme && rand(0, 100) < 50) {
    return theme.preferredEnemies[rand(0, theme.preferredEnemies.length - 1)];
  }

  // Сильные враги
  if (roll + depthBonus > 90) {
    const strongEnemies: EnemyType[] = ['orc', 'zombie', 'orc_chief'];
    return strongEnemies[rand(0, strongEnemies.length - 1)];
  }

  // Средние враги
  if (roll + depthBonus > 60) {
    const midEnemies: EnemyType[] = ['skeleton', 'orc', 'zombie'];
    return midEnemies[rand(0, midEnemies.length - 1)];
  }

  // Слабые враги (чаще на первых уровнях)
  if (roll > 20 || depth <= 2) {
    const weakEnemies: EnemyType[] = ['snake', 'goblin', 'skeleton'];
    return weakEnemies[rand(0, weakEnemies.length - 1)];
  }

  // Базовые враги
  return rand(0, 1) === 0 ? 'snake' : 'goblin';
};

// --- Генерация подземелья ---
export const generateDungeonGrid = (levelIndex: number = 1): { grid: CellData[][], rooms: Room[] } => {
  const newGrid = createEmptyGrid();
  const rooms: Room[] = [];

  // Количество комнат увеличивается с глубиной
  const targetRooms = Math.min(8 + Math.floor(levelIndex * 1.5), 18);

  // Размер комнат может варьироваться с глубиной
  const minSize = ROOM_MIN_SIZE;
  const maxSize = Math.min(ROOM_MAX_SIZE, ROOM_MIN_SIZE + 2 + Math.floor(levelIndex / 2));

  // Генерируем комнаты без пересечений
  for (let i = 0; i < targetRooms; i++) {
    const room = tryPlaceRoom(rooms, minSize, maxSize);
    if (room) {
      rooms.push(room);
      carveRoom(newGrid, room);
    }
  }

  // Соединяем комнаты коридорами (каждую со следующей)
  for (let i = 0; i < rooms.length - 1; i++) {
    carveCorridor(newGrid, rooms[i], rooms[i + 1]);
  }

  // Добавляем несколько дополнительных коридоров для связности
  const extraCorridors = Math.floor(rooms.length / 4);
  for (let i = 0; i < extraCorridors; i++) {
    const r1 = rand(0, rooms.length - 1);
    let r2 = rand(0, rooms.length - 1);
    while (r2 === r1) r2 = rand(0, rooms.length - 1);
    carveCorridor(newGrid, rooms[r1], rooms[r2]);
  }

  // Размещаем двери на входах в комнаты
  placeDoors(newGrid, rooms, 60);

  // Выбираем тему уровня
  const themeName = getThemeForDepth(levelIndex);
  const theme = THEMES[themeName];

  // Размещаем ловушки в коридорах (с учётом темы)
  placeTraps(newGrid, rooms, Math.floor(levelIndex * theme.trapMultiplier));

  // Создаём секретные комнаты (1-2 на уровень, шанс растёт с глубиной)
  const secretRoomCount = rand(0, 100) < 30 + levelIndex * 10 ? rand(1, 2) : 0;
  for (let i = 0; i < secretRoomCount; i++) {
    const secretRoom = createSecretRoom(newGrid, rooms, levelIndex);
    if (secretRoom) {
      rooms.push(secretRoom);
    }
  }

  // Размещение объектов с учетом уровня сложности
  rooms.forEach((room, index) => {
    // Первая комната - Старт (только декорации)
    if (index === 0) {
      decorateRoom(newGrid, room, levelIndex, theme);
      return;
    }

    // Последняя комната - Выход
    if (index === rooms.length - 1) {
      newGrid[room.centerY][room.centerX].type = 'stairs_down';
      decorateRoom(newGrid, room, levelIndex, theme);
      return;
    }

    // Декорируем комнату
    decorateRoom(newGrid, room, levelIndex, theme);

    // Размещение лута
    if (rand(0, 100) > 35) {
      const cx = rand(room.x, room.x + room.w - 1);
      const cy = rand(room.y, room.y + room.h - 1);
      const item = rollLoot(levelIndex);
      newGrid[cy][cx].item = item;
    }

    // Размещение врагов
    if (rand(0, 100) > (25 - levelIndex * 2)) {
      const ex = rand(room.x, room.x + room.w - 1);
      const ey = rand(room.y, room.y + room.h - 1);
      if (!newGrid[ey][ex].item && newGrid[ey][ex].type === 'floor') {
        const enemyType = rollEnemy(levelIndex, theme);
        if (enemyType) {
          newGrid[ey][ex].enemy = enemyType;

          // Расчет и сохранение HP врага с бонусом от глубины
          const stats = MONSTER_STATS[enemyType];
          const maxHp = Math.floor(stats.hp * (1 + (levelIndex - 1) * 0.15));
          newGrid[ey][ex].enemyHp = maxHp;
        }
      }
    }

    // Шанс на второго врага в больших комнатах
    if (room.w * room.h >= 25 && rand(0, 100) > 60) {
      const ex = rand(room.x, room.x + room.w - 1);
      const ey = rand(room.y, room.y + room.h - 1);
      if (!newGrid[ey][ex].item && !newGrid[ey][ex].enemy && newGrid[ey][ex].type === 'floor') {
        const enemyType = rollEnemy(levelIndex, theme);
        if (enemyType) {
          newGrid[ey][ex].enemy = enemyType;
          const stats = MONSTER_STATS[enemyType];
          const maxHp = Math.floor(stats.hp * (1 + (levelIndex - 1) * 0.15));
          newGrid[ey][ex].enemyHp = maxHp;
        }
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
    x: startRoom.centerX,
    y: startRoom.centerY
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
