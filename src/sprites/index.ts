// Конфигурация спрайтов для пиксельных тайлов 16x16
// Все игровые сущности сохраняются! Если спрайта не хватает - дублируем ближайший подходящий.

export const SPRITE_SIZE = 16;

// Пути к спрайт-листам
export const SPRITE_SHEETS = {
  tileset: '/sprites/tileset.png',
  tileset_new: '/sprites/tileset_new.png',
  characters: '/sprites/characters_new.png',  // Старый спрайт-лист (fallback)
  items: '/sprites/items.png',
  items_rpg: '/sprites/items_rpg.png',        // RPG items (336x432)
  items_sheet: '/sprites/items_sheet.png',    // Comprehensive items (432x416, 27x25 grid)
  // Анимированные спрайт-листы (горизонтальные, 4-6 кадров по 16px)
  torch_lit: '/sprites/torch_lit_anim.png',   // Горящий факел (96x16, 6 кадров)
  torch_off: '/sprites/torch_off_anim.png',   // Потухший факел (96x16, 6 кадров)
  trap: '/sprites/trap_anim.png',             // Ловушка-шипы (80x16, 5 кадров)
  chest: '/sprites/chest_anim.png',           // Сундук (64x16, 4 кадра)
  lava: '/sprites/lava_anim_16.png?v=3',      // Лава (анимированная, 45 кадров, 16x16)
  water: '/sprites/water_anim_16.png?v=3',    // Вода (анимированная, 8 кадров, 16x16)
  grass: '/sprites/grass_16.png?v=3',         // Трава (статичная, 16x16)
  // Персонажи (горизонтальные, 4 кадра по 16px)
  skeleton1: '/sprites/skeleton1_anim.png',   // Скелет-воин
  skeleton2: '/sprites/skeleton2_anim.png',   // Скелет с щитом
  skull: '/sprites/skull_anim.png',           // Летающий череп
  vampire: '/sprites/vampire_anim.png',       // Вампир
  warrior: '/sprites/warrior_anim.png',       // Герой-воин (старый, fallback)
  mage: '/sprites/mage_anim.png',             // Герой-маг (старый, fallback)
  rogue: '/sprites/rogue_anim.png',           // Герой-разбойник (старый, fallback)
  // Герои с направленной анимацией (128x64, 8 кадров × 4 направления)
  hero_warrior: '/sprites/hero_warrior_directional.png',
  hero_mage: '/sprites/hero_mage_directional.png',
  hero_rogue: '/sprites/hero_rogue_directional.png',
} as const;

// Типы для спрайтов
export interface SpritePosition {
  sheet: keyof typeof SPRITE_SHEETS;
  col: number;
  row: number;
}

// ============================================================
// ТАЙЛЫ ЛАНДШАФТА (CellType)
// tileset.png - 160x160, сетка 10x10
// ============================================================
// Row 0: Верхняя рамка стен (col 0-5: углы+горизонтали), плиты пола (col 6-9)
// Row 1: Боковые стены (col 0,5) + внутренние углы (col 1-4), плиты пола (col 6-9)
// Row 2-3: Боковые стены + внутренняя стена + пол с трещинами (col 6-9)
// Row 4: Нижняя рамка стен (col 0-5) + пол с трещинами (col 6-9)
// Row 5-6: Декоративные стены, решётки, пустота (col 6 row 6 = тёмный квадрат)
// Row 7: Колонны
// Row 8: Факелы (col 0-3) + лестницы (col 4-5)
// Row 9: Основания стен с подсветкой + лестница вниз (col 4)
// ============================================================

// Пустое пространство (вне карты / за стенами)
export const VOID_SPRITE: SpritePosition = { sheet: 'tileset', col: 6, row: 6 };

// === СТЕНЫ (autotiling) ===
// Внешние стены (рамка комнаты)
export const WALL_SPRITES = {
  // Углы внешние (углы комнаты)
  corner_top_left:     { sheet: 'tileset', col: 0, row: 7 },  // левый верхний угол комнаты
  corner_top_right:    { sheet: 'tileset', col: 1, row: 7 },  // правый верхний угол комнаты
  corner_bottom_left:  { sheet: 'tileset', col: 2, row: 0 },  // левый нижний угол комнаты
  corner_bottom_right: { sheet: 'tileset', col: 2, row: 0 },  // правый нижний угол комнаты

  // Горизонтальные стены (поменяны для правильной тени)
  top:    { sheet: 'tileset', col: 2, row: 4 },  // верхняя стена (кирпичи без тени)
  bottom: { sheet: 'tileset', col: 2, row: 0 },  // нижняя стена (кирпичи с тенью)

  // Вертикальные стены (тень падает внутрь комнаты)
  left:   { sheet: 'tileset', col: 5, row: 2 },  // левая стена комнаты
  right:  { sheet: 'tileset', col: 0, row: 2 },  // правая стена комнаты

  // Внутренние углы (для L-образных коридоров)
  inner_top_left:     { sheet: 'tileset', col: 1, row: 1 },
  inner_top_right:    { sheet: 'tileset', col: 4, row: 1 },
  inner_bottom_left:  { sheet: 'tileset', col: 1, row: 3 },  // используем тень
  inner_bottom_right: { sheet: 'tileset', col: 4, row: 3 },

  // Центральная стена (заполнитель)
  center: { sheet: 'tileset', col: 8, row: 7 },
} as const;

// === ПОЛ (autotiling) ===
export const FLOOR_SPRITES = {
  // Пол у стен (с тенями)
  top_left:     { sheet: 'tileset', col: 6, row: 2 },
  top:          { sheet: 'tileset', col: 7, row: 2 },
  top_right:    { sheet: 'tileset', col: 9, row: 2 },
  left:         { sheet: 'tileset', col: 6, row: 3 },
  center:       { sheet: 'tileset', col: 7, row: 3 },  // основной пол
  right:        { sheet: 'tileset', col: 9, row: 3 },
  bottom_left:  { sheet: 'tileset', col: 6, row: 4 },
  bottom:       { sheet: 'tileset', col: 7, row: 4 },
  bottom_right: { sheet: 'tileset', col: 9, row: 4 },

  // Чистый пол без теней
  clean:        { sheet: 'tileset', col: 6, row: 0 },
  clean_alt:    { sheet: 'tileset', col: 7, row: 0 },
} as const;

// Простой маппинг для базовых типов (fallback)
export const TILE_SPRITES: Record<string, SpritePosition> = {
  // Базовые - будут переопределены autotiling логикой
  wall:        WALL_SPRITES.center,
  floor:       FLOOR_SPRITES.center,

  // Двери
  door:        { sheet: 'tileset_new', col: 7, row: 3 },     // железная укреплённая дверь
  door_open:   { sheet: 'tileset_new', col: 7, row: 4 },                   // пол (дверь открыта = проход)
  secret_door: FLOOR_SPRITES.center,                   // выглядит как пол (секрет!)

  // Ловушки - пол (ловушка скрыта)
  trap:        FLOOR_SPRITES.center,

  // Жидкости и природа
  water:       { sheet: 'water', col: 0, row: 0 },  // Вода (анимированная, начинается с кадра 3)
  lava:        { sheet: 'lava', col: 0, row: 0 },   // Лава (анимированная, 45 кадров)
  grass:       { sheet: 'grass', col: 0, row: 0 },  // Трава (статичная, одиночный спрайт)
  // Лестницы
  stairs_down: { sheet: 'tileset', col: 4, row: 9 },   // лестница вниз
  stairs_up:   { sheet: 'tileset', col: 4, row: 9 },   // лестница вверх

  // Секретные кнопки
  secret_button: { sheet: 'tileset', col: 3, row: 9 }, // секретная кнопка (неактивная)
  secret_button_activated: { sheet: 'tileset', col: 3, row: 9 }, // секретная кнопка (активированная)

  // Освещение (факелы)
  torch:       { sheet: 'tileset', col: 2, row: 8 },   // потухший факел
  torch_lit:   { sheet: 'tileset', col: 3, row: 8 },   // горящий факел

  // Торговец
  merchant:    FLOOR_SPRITES.center,
};

// ============================================================
// ВРАГИ (EnemyType)
// characters_new.png - 112x64, 7 персонажей × 4 кадра анимации
// Col 0: Priest1 (рыцарь в синем) - используем как NPC/торговец
// Col 1: Priest2 (маг в капюшоне)
// Col 2: Priest3 (разбойник)
// Col 3: Skeleton1 (скелет-воин)
// Col 4: Skeleton2 (скелет с щитом)
// Col 5: Skull (летающий череп)
// Col 6: Vampire (вампир в плаще)
// Row 0-3: 4 кадра idle-анимации
// ============================================================

export const ENEMY_SPRITES: Record<string, SpritePosition> = {
  // Слабые враги
  snake:      { sheet: 'characters', col: 3, row: 0 },  // skeleton1 (для змеи пока нет спрайта)
  goblin:     { sheet: 'characters', col: 4, row: 0 },  // skeleton2 (для гоблина пока нет)

  // Нежить
  skeleton:   { sheet: 'characters', col: 3, row: 0 },  // Skeleton1 - скелет-воин
  zombie:     { sheet: 'characters', col: 4, row: 0 },  // Skeleton2 - скелет с щитом (как зомби)
  lich:       { sheet: 'characters', col: 6, row: 0 },  // Vampire - вампир в плаще

  // Орда
  orc:        { sheet: 'characters', col: 4, row: 0 },  // Skeleton2 (для орка пока нет)
  orc_chief:  { sheet: 'characters', col: 6, row: 0 },  // Vampire (вождь)

  // Боссы
  boss:       { sheet: 'characters', col: 5, row: 0 },  // Skull - летающий череп (босс)
};

// ============================================================
// ИГРОК (по классам)
// Используем Priest'ов из characters_new.png - они выглядят как герои
// Col 0: Priest1 - рыцарь в синем (warrior)
// Col 1: Priest2 - маг в капюшоне (mage)
// Col 2: Priest3 - разбойник (rogue)
// ============================================================

export const PLAYER_SPRITES: Record<string, SpritePosition> = {
  warrior:    { sheet: 'characters', col: 0, row: 0 },  // Priest1 - рыцарь в синей броне
  mage:       { sheet: 'characters', col: 1, row: 0 },  // Priest2 - маг в капюшоне
  rogue:      { sheet: 'characters', col: 2, row: 0 },  // Priest3 - разбойник
};

// ============================================================
// ПРЕДМЕТЫ (ItemType)
// items.png - 192x80, сетка 12x5
// ============================================================
// Row 0: Кубки-трофеи (верх), переключатель
// Row 1: Кубки (низ), колокол, драгоценные камни (синие col 3-6, оранжевые col 7-10)
// Row 2: Стол, табурет, колонны, ящики, синие зелья (col 8-9), яблоко, книга
// Row 3: Рычаг, щит красный, кости, золотая монета, мешок, двери, железная дверь, красные зелья (col 8-9), груша, свиток
// Row 4: Лестница, щит синий, кости, медная монета, бочка, сундук большой, сундук малый, указатель, ключи, кубок, свиток
// ============================================================

export const ITEM_SPRITES: Record<string, SpritePosition> = {
  // --- Зелья HP (красные) ---
  potion_weak:       { sheet: 'items', col: 10, row: 2 },   // Красное яблоко (малое HP)
  potion_mid:        { sheet: 'items', col: 9, row: 2 },  // Красная колба (среднее HP)
  potion_strong:     { sheet: 'items', col: 9, row: 2 },  // Большая красная колба (сильное HP)

  // --- Зелья MP (синие) ---
  potion_mana_weak:   { sheet: 'items', col: 10, row: 3 }, // Черника (малая MP)
  potion_mana_mid:    { sheet: 'items', col: 9, row: 3 }, // Синяя колба (средняя MP)
  potion_mana_strong: { sheet: 'items', col: 8, row: 3 }, // Большая синяя колба (сильная MP)

  // --- Оружие (7 тиров) - из Row 0 (Swords) ---
  weapon_rusty:      { sheet: 'items_sheet', col: 0, row: 0 },   // Ржавый меч
  weapon_dagger:     { sheet: 'items_sheet', col: 1, row: 0 },   // Кинжал
  weapon_mace:       { sheet: 'items_sheet', col: 2, row: 0 },   // Булава/клинок
  weapon_sword:      { sheet: 'items_sheet', col: 3, row: 0 },  // Стальной меч
  weapon_axe:        { sheet: 'items_sheet', col: 0, row: 2 },  // Боевой топор
  weapon_greatsword: { sheet: 'items_sheet', col: 5, row: 0 },  // Мифриловый меч
  weapon_legend:     { sheet: 'items_sheet', col: 11, row: 0 },  // Легендарный меч

  // --- Броня (7 тиров) - из Row 3-4 (Armor/Clothing) ---
  armor_cloth:       { sheet: 'items_sheet', col: 1, row: 5 },   // Ветхая рубаха
  armor_leather:     { sheet: 'items_sheet', col: 2, row: 5 },   // Кожаная куртка
  armor_studded:     { sheet: 'items_sheet', col: 3, row: 5 },   // Клепаная броня
  armor_chain:       { sheet: 'items_sheet', col: 4, row: 5 },  // Кольчуга
  armor_plate_light: { sheet: 'items_sheet', col: 5, row: 5 },  // Латный нагрудник
  armor_plate_heavy: { sheet: 'items_sheet', col: 6, row: 5 },  // Тяжелые латы
  armor_legend:      { sheet: 'items_sheet', col: 7, row: 5 },  // Легендарная броня

  // --- Особые предметы ---
  gold:              { sheet: 'items_sheet', col: 17, row: 11 },   // Золотая руда/монета
  chest:             { sheet: 'items_sheet', col: 19, row: 11 }, // Сундук из Row 11
  chest_open:        { sheet: 'items_sheet', col: 20, row: 11 }, // Открытый сундук

  // --- Декор для торговца ---
  merchant_npc:      { sheet: 'characters', col: 0, row: 0 },    // Priest1 - рыцарь как торговец
};

// ============================================================
// AUTOTILING - умный выбор спрайта на основе соседей
// ============================================================

export interface NeighborInfo {
  top: boolean;      // есть стена сверху?
  bottom: boolean;   // есть стена снизу?
  left: boolean;     // есть стена слева?
  right: boolean;    // есть стена справа?
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
}

// Определить спрайт стены на основе соседей
export function getWallSprite(neighbors: NeighborInfo): SpritePosition {
  const { top, bottom, left, right } = neighbors;

  // Торцы стен-разделителей (стена с соседом только с одной стороны)
  // Вертикальный разделитель: сосед только сверху или только снизу
  if (top && !bottom && !left && !right) return WALL_SPRITES.center;  // торец снизу
  if (!top && bottom && !left && !right) return WALL_SPRITES.center;  // торец сверху
  // Горизонтальный разделитель: сосед только слева или только справа
  if (!top && !bottom && left && !right) return WALL_SPRITES.center;  // торец справа
  if (!top && !bottom && !left && right) return WALL_SPRITES.center;  // торец слева
  // Одиночная стена (без соседей)
  if (!top && !bottom && !left && !right) return WALL_SPRITES.center;

  // Внешние углы (стена окружена пустотой с двух смежных сторон)
  if (!top && !left && bottom && right) return WALL_SPRITES.corner_top_left;
  if (!top && !right && bottom && left) return WALL_SPRITES.corner_top_right;
  if (!bottom && !left && top && right) return WALL_SPRITES.corner_bottom_left;
  if (!bottom && !right && top && left) return WALL_SPRITES.corner_bottom_right;

  // Горизонтальные стены
  if (!top && bottom) return WALL_SPRITES.top;
  if (!bottom && top) return WALL_SPRITES.bottom;

  // Вертикальные стены
  if (!left && right) return WALL_SPRITES.left;
  if (!right && left) return WALL_SPRITES.right;

  // Внутренние углы (для L-образных коридоров)
  if (top && left && !neighbors.topLeft) return WALL_SPRITES.inner_top_left;
  if (top && right && !neighbors.topRight) return WALL_SPRITES.inner_top_right;
  if (bottom && left && !neighbors.bottomLeft) return WALL_SPRITES.inner_bottom_left;
  if (bottom && right && !neighbors.bottomRight) return WALL_SPRITES.inner_bottom_right;

  // Центральная стена (окружена стенами со всех сторон)
  return WALL_SPRITES.center;
}

// Определить спрайт пола на основе соседних стен
export function getFloorSprite(wallNeighbors: NeighborInfo): SpritePosition {
  const { top, bottom, left, right } = wallNeighbors;

  // Углы (пол у угла стены)
  if (top && left) return FLOOR_SPRITES.top_left;
  if (top && right) return FLOOR_SPRITES.top_right;
  if (bottom && left) return FLOOR_SPRITES.bottom_left;
  if (bottom && right) return FLOOR_SPRITES.bottom_right;

  // Края (пол у стены)
  if (top) return FLOOR_SPRITES.top;
  if (bottom) return FLOOR_SPRITES.bottom;
  if (left) return FLOOR_SPRITES.left;
  if (right) return FLOOR_SPRITES.right;

  // Центральный пол (нет стен рядом)
  return FLOOR_SPRITES.center;
}

// Проверить, является ли тип ячейки "проходимым" (не стена)
export function isPassable(cellType: string | undefined): boolean {
  if (!cellType) return false;
  return cellType !== 'wall';
}

// ============================================================
// ХЕЛПЕРЫ
// ============================================================

// Получить полный CSS-стиль для спрайта
export function getSpriteStyle(sprite: SpritePosition): React.CSSProperties {
  const sheet = SPRITE_SHEETS[sprite.sheet];
  return {
    backgroundImage: `url(${sheet})`,
    backgroundPosition: `-${sprite.col * SPRITE_SIZE}px -${sprite.row * SPRITE_SIZE}px`,
    backgroundSize: 'auto',
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
  };
}

// Получить background-position строку
export function getSpritePosition(sprite: SpritePosition): string {
  return `-${sprite.col * SPRITE_SIZE}px -${sprite.row * SPRITE_SIZE}px`;
}

// Получить URL спрайт-листа
export function getSpriteSheet(sprite: SpritePosition): string {
  return SPRITE_SHEETS[sprite.sheet];
}

// ============================================================
// СИСТЕМА АНИМАЦИИ
// ============================================================

// Конфигурация анимаций для персонажей (4 кадра idle)
// characters_new.png: колонка = персонаж, ряд = кадр анимации (0-3)
export interface AnimationConfig {
  frames: number;       // количество кадров
  frameTime: number;    // время кадра в мс
  sheet: keyof typeof SPRITE_SHEETS;
}

// Конфигурации анимаций для разных типов
export const ANIMATION_CONFIGS = {
  character: { frames: 4, frameTime: 200 },  // 5 FPS для idle персонажей
  torch: { frames: 6, frameTime: 120 },      // ~8 FPS для огня (6 кадров)
  trap: { frames: 5, frameTime: 500 },       // 10 FPS для ловушки (5 кадров)
  chest: { frames: 4, frameTime: 1000 },      // 4 FPS для сундука

  water:     { frames: 2, frameTime: 100 }, // Плавная вода (первые 4 кадра из 8)
  lava:      { frames: 45, frameTime: 80 }, // Лава (720px / 16px = 45 кадров)
} as const;

// Глобальная скорость анимации (используется в GameGrid)
export const CHARACTER_ANIMATION: AnimationConfig = {
  frames: 4,
  frameTime: 200,
  sheet: 'warrior',  // fallback
};

// Маппинг врагов на их анимированные спрайт-листы
export const ENEMY_ANIM_SHEETS: Record<string, keyof typeof SPRITE_SHEETS> = {
  snake: 'skeleton1',
  goblin: 'skeleton2',
  skeleton: 'skeleton1',
  zombie: 'skeleton2',
  lich: 'vampire',
  orc: 'skeleton2',
  orc_chief: 'vampire',
  boss: 'skull',
};

// Маппинг игроков на их анимированные спрайт-листы
export const PLAYER_ANIM_SHEETS: Record<string, keyof typeof SPRITE_SHEETS> = {
  warrior: 'warrior',
  mage: 'mage',
  rogue: 'rogue',
};

// Получить анимированный спрайт для горизонтального спрайт-листа
// Все новые спрайт-листы: кадры идут по горизонтали (col = frame)
export function getAnimatedSprite(
  sheet: keyof typeof SPRITE_SHEETS,
  frame: number,
  totalFrames: number = 4
): SpritePosition {
  return {
    sheet,
    col: frame % totalFrames,
    row: 0,
  };
}

// Получить спрайт врага с анимацией
export function getAnimatedEnemySprite(enemyType: string, frame: number): SpritePosition {
  const sheet = ENEMY_ANIM_SHEETS[enemyType] || 'skeleton1';
  return getAnimatedSprite(sheet, frame, ANIMATION_CONFIGS.character.frames);
}

// Получить спрайт игрока с анимацией (старый метод, для обратной совместимости)
export function getAnimatedPlayerSprite(playerClass: string, frame: number): SpritePosition {
  const sheet = PLAYER_ANIM_SHEETS[playerClass] || 'warrior';
  return getAnimatedSprite(sheet, frame, ANIMATION_CONFIGS.character.frames);
}

// Получить спрайт игрока с направленной анимацией
export function getDirectionalPlayerSprite(
  playerClass: string,
  frame: number,
  direction: 'left' | 'right' | 'up' | 'down' = 'down'
): SpritePosition {
  // Маппинг классов на новые направленные спрайт-листы
  const heroSheetMap: Record<string, keyof typeof SPRITE_SHEETS> = {
    warrior: 'hero_warrior',
    mage: 'hero_mage',
    rogue: 'hero_rogue',
  };

  const sheet = heroSheetMap[playerClass] || 'hero_warrior';

  // Маппинг направления на ряд в спрайт-листе
  const directionRowMap = {
    left: 1,
    right: 0,
    up: 2,
    down: 3,
  };

  const row = directionRowMap[direction];

  return {
    sheet,
    col: frame % 8, // 8 кадров анимации
    row,
  };
}

// Получить спрайт факела с анимацией
export function getAnimatedTorchSprite(frame: number, isLit: boolean = true): SpritePosition {
  return getAnimatedSprite(
    isLit ? 'torch_lit' : 'torch_off',
    frame,
    ANIMATION_CONFIGS.torch.frames
  );
}

// Получить спрайт ловушки с анимацией
export function getAnimatedTrapSprite(frame: number): SpritePosition {
  return getAnimatedSprite('trap', frame, ANIMATION_CONFIGS.trap.frames);
}

// Получить спрайт сундука с анимацией
export function getAnimatedChestSprite(frame: number): SpritePosition {
  return getAnimatedSprite('chest', frame, ANIMATION_CONFIGS.chest.frames);
}

// Получить спрайт воды с анимацией (горизонтальный спрайт-лист, начиная с кадра 3)
export function getAnimatedWaterSprite(frame: number): SpritePosition {
  const startFrame = 4; // Начинаем с 3-го кадра
  const col = startFrame + (frame % ANIMATION_CONFIGS.water.frames);
  return {
    sheet: 'water',
    col,
    row: 0,
  };
}

// Получить спрайт лавы с анимацией
export function getAnimatedLavaSprite(frame: number): SpritePosition {
  return getAnimatedSprite('lava', frame, ANIMATION_CONFIGS.lava.frames);
}

// Legacy функция для совместимости (использует старый characters sheet)
export function getAnimatedCharacterSprite(
  baseSprite: SpritePosition,
  frame: number
): SpritePosition {
  // Если это старый characters sheet - анимация по вертикали (row = frame)
  if (baseSprite.sheet === 'characters') {
    return {
      ...baseSprite,
      row: frame % ANIMATION_CONFIGS.character.frames,
    };
  }
  // Для новых листов - анимация по горизонтали (col = frame)
  return {
    ...baseSprite,
    col: frame % ANIMATION_CONFIGS.character.frames,
  };
}

// Хук для анимации (возвращает номер текущего кадра)
export function getAnimationFrame(
  timestamp: number,
  config: AnimationConfig
): number {
  return Math.floor(timestamp / config.frameTime) % config.frames;
}
