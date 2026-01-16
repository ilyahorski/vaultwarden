import React from 'react';

// --- Типы ячеек ---
export type CellType = 'wall' | 'floor' | 'door' | 'door_open' | 'secret_door' | 'trap' | 'water' | 'lava' | 'grass' | 'stairs_down' | 'stairs_up' | 'torch' | 'torch_lit' | 'merchant' | 'secret_button' | 'secret_button_activated' | 'bonfire' | 'chest';

// --- Типы предметов ---
// HP Зелья
export type PotionHpType = 'potion_weak' | 'potion_mid' | 'potion_strong';
// MP Зелья (теперь градация)
export type PotionMpType = 'potion_mana_weak' | 'potion_mana_mid' | 'potion_mana_strong';
export type PotionType = PotionHpType | PotionMpType;

// Оружие (7 тиров)
export type WeaponType = 
  | 'weapon_rusty'   // Ржавый (бывший weak)
  | 'weapon_dagger'  // Кинжал
  | 'weapon_mace'    // Булава
  | 'weapon_sword'   // Меч (бывший mid)
  | 'weapon_axe'     // Топор
  | 'weapon_greatsword' // Двуручник (бывший strong)
  | 'weapon_legend'; // Легендарный

// Броня (7 тиров)
export type ArmorType = 
  | 'armor_cloth'    // Ткань (бывший weak)
  | 'armor_leather'  // Кожа
  | 'armor_studded'  // Клепаная кожа
  | 'armor_chain'    // Кольчуга (бывший mid)
  | 'armor_plate_light' // Легкие латы
  | 'armor_plate_heavy' // Тяжелые латы (бывший strong)
  | 'armor_legend';  // Легендарная

export type ItemType = PotionType | WeaponType | ArmorType | 'gold' | 'chest' | null;

// --- Типы врагов ---
export type EnemyType =
  // Слабые враги
  | 'snake'
  | 'goblin'
  // Гоблины
  | 'goblin_archer'
  | 'goblin_fanatic'
  | 'goblin_fighter'
  | 'goblin_occultist'
  | 'goblin_wolf_rider'
  // Халфлинги
  | 'halfling_assassin'
  | 'halfling_bard'
  | 'halfling_ranger'
  | 'halfling_rogue'
  | 'halfling_slinger'
  // Ящеролюди
  | 'bestial_lizardfolk'
  | 'lizardfolk_archer'
  | 'lizardfolk_gladiator'
  | 'lizardfolk_scout'
  | 'lizardfolk_spearman'
  // Нежить
  | 'skeleton'
  | 'zombie'
  | 'lich'
  | 'mummy'
  // Гноллы
  | 'gnoll_brute'
  | 'gnoll_grunt'
  | 'gnoll_pikeman'
  | 'gnoll_ripper'
  | 'gnoll_warlord'
  // Гномы
  | 'gnome_alchemist'
  | 'gnome_mage'
  | 'gnome_tinkerer'
  | 'gnome_wanderer'
  | 'gnome_wizard'
  // Орки
  | 'orc'
  | 'orc_grunt'
  | 'orc_warrior'
  | 'orc_berserker'
  | 'orc_captain'
  | 'orc_reaver'
  | 'orc_savage'
  | 'orc_shaman'
  | 'orc_warlock'
  | 'orc_chief'
  // Боссы
  | 'boss'
  | null;

// --- Типы классов (DEPRECATED - используйте DuoParty) ---
/** @deprecated Используйте DuoParty для новой системы персонажей */
export type ClassType = 'warrior' | 'mage' | 'rogue';

// ============================================
// === DUO CHARACTER SYSTEM (Aetheria RPG) ===
// ============================================

// --- Временные слои ---
export type TimeLayer = 'past' | 'present' | 'future';

// --- Категории предметов для инвентаря 2.0 ---
export type ItemCategory = 'weapon' | 'scroll' | 'clothing' | 'food' | 'quest';

// --- Типы свитков ---
export type ScrollType =
  | 'scroll_fireball'
  | 'scroll_heal'
  | 'scroll_teleport'
  | 'scroll_time_shift'
  | 'scroll_reveal';

// --- Типы еды ---
export type FoodType =
  | 'food_bread'
  | 'food_meat'
  | 'food_cheese'
  | 'food_apple'
  | 'food_fish'
  | 'food_stew';

// --- Типы одежды (для героини) ---
export type ClothingType =
  | 'clothing_explorer_hat'
  | 'clothing_archaeologist_vest'
  | 'clothing_travel_cloak'
  | 'clothing_sturdy_boots';

// --- Типы квестовых предметов ---
export type QuestItemType =
  | 'quest_ancient_key'
  | 'quest_time_crystal'
  | 'quest_cat_collar'
  | 'quest_essence_past'
  | 'quest_essence_present'
  | 'quest_essence_future'
  | 'quest_codex_page';

// --- Расширенный тип предметов (без null для Record) ---
export type ExtendedItemTypeNonNull =
  | PotionType
  | WeaponType
  | ArmorType
  | ScrollType
  | FoodType
  | ClothingType
  | QuestItemType
  | 'gold'
  | 'chest';

// --- Расширенный тип предметов (с null) ---
export type ExtendedItemType = ExtendedItemTypeNonNull | null;

// --- Навык инструмента (для героини) ---
export interface ToolSkill {
  id: string;
  name: string;
  desc: string;
  staminaCost: number;
  unlockLevel: number;
}

// --- Навык знаний (для кота) ---
export interface LoreSkill {
  id: string;
  name: string;
  desc: string;
  manaCost: number;
  unlockLevel: number;
}

// --- Статистика Героини (Археолог) ---
export interface HeroStats {
  name: string;
  x: number;
  y: number;
  facing: Direction;
  // Боевые статы
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  // Атрибуты
  strength: number;     // Физический урон
  dexterity: number;    // Уклонение, крит
  // Прогрессия
  xp: number;
  level: number;
  nextLevelXp: number;
  // Снаряжение
  equippedWeapon: WeaponType | null;
  equippedArmor: ArmorType | null;
  equippedClothing: ClothingType | null;
  // Навыки
  tools: ToolSkill[];
}

// --- Статистика Кота (бывший ученый) ---
export interface CatStats {
  name: string;
  x: number;
  y: number;
  facing: Direction;
  // Боевые статы
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  // Атрибуты
  intelligence: number;  // Магический урон
  wisdom: number;        // Мана реген, обнаружение
  // Прогрессия
  xp: number;
  level: number;
  nextLevelXp: number;
  // Навыки
  lore: LoreSkill[];
}

// --- Предмет инвентаря (новая система) ---
export interface InventorySlot {
  id: string;
  slot: number;           // 0-199
  itemType: ExtendedItemType;
  category: ItemCategory;
  stackable: boolean;
  quantity: number;
  // Для квестовых предметов
  questId?: string;
  description?: string;
}

// --- Дуэт персонажей (главная структура) ---
export interface DuoParty {
  hero: HeroStats;
  cat: CatStats;
  activeCharacter: 'hero' | 'cat';  // Кто управляется сейчас
  gold: number;                      // Общее золото
  inventory: InventorySlot[];        // Общий инвентарь (до 200 слотов)
  currentTimeLayer: TimeLayer;       // Текущий временной слой
}

// --- Направления движения ---
export type Direction = 'left' | 'right' | 'up' | 'down';

// --- Интерфейс навыка ---
export interface Skill {
  id: string;
  name: string;
  mpCost: number;
  desc: string;
  dmgMult?: number;
  heal?: number;
}

// --- Интерфейс класса (DEPRECATED) ---
/** @deprecated Используйте HeroStats и CatStats для новой системы персонажей */
export interface ClassData {
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  baseMoves: number;
  desc: string;
  icon: React.ReactNode;
  skills: Skill[];
  startingWeapon?: WeaponType;
  startingArmor?: ArmorType;
}

// --- Вариант тайла для Time-Shift ---
export interface TileVariant {
  tilesetX: number;
  tilesetY: number;
  tilesetSource: string;
  passable: boolean;
  type?: CellType;
  enemy?: EnemyType;
  item?: ItemType;
}

// --- Интерфейс ячейки ---
export interface CellData {
  x: number;
  y: number;
  type: CellType;

  // Координаты тайлсета (для профессиональной системы тайлсетов)
  tilesetX?: number;        // X координата в атласе тайлсета
  tilesetY?: number;        // Y координата в атласе тайлсета
  tilesetSource?: string;   // ID тайлсета ('world', 'town', 'dungeon')

  // Альтернативные имена для совместимости
  tileX?: number;           // Alias для tilesetX
  tileY?: number;           // Alias для tilesetY

  item: ItemType;
  enemy: EnemyType;
  enemyHp?: number;
  isRevealed: boolean;
  isVisible: boolean;
  isSecretTrigger?: boolean; // Для secret_button: true = открывает комнату, false = ложная кнопка
  isHiddenRoom?: boolean; // Помечает клетки, которые являются частью скрытой комнаты
  originalType?: CellType; // Сохраняет оригинальный тип клетки до скрытия

  // === Time-Shift система ===
  timeVariants?: {
    past?: TileVariant;
    present?: TileVariant;
    future?: TileVariant;
  };

  // === Entity Layer ===
  entityId?: string;        // ID сущности для спавна (NPC, враг)
  entityType?: 'npc' | 'enemy' | 'trigger';
}

// --- Интерфейс записи лога ---
export interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'combat' | 'loot' | 'roll' | 'level' | 'fail' | 'success' | 'rest';
  timestamp: string;
}

// --- Интерфейс игрока ---
export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  moves: number;
  maxMoves: number;
  xp: number;
  level: number;
  nextLevelXp: number;
  gold: number;
  name: string;
  class: ClassType;
  inventory: (PotionType | WeaponType | ArmorType)[];
  equippedWeapon: WeaponType | null;
  equippedArmor: ArmorType | null;
  dungeonLevel: number;
  facing?: Direction; // Направление, куда смотрит игрок
}

// --- Интерфейс статистики монстра ---
export interface MonsterStats {
  hp: number;
  atk: number;
  xp: number;
  gold: number;
  name: string;
  color: string; // tailwind color class
  iconType: 'ghost' | 'skull' | 'crown' | 'snake' | 'user'; // для выбора иконки
}

// --- Интерфейс статистики зелья ---
export interface PotionStats {
  heal: number;
  mana: number;
  name: string;
  color: string; // tailwind color
  type: 'hp' | 'mp';
}

// --- Интерфейс статистики снаряжения ---
export interface GearStats {
  val: number;
  name: string;
  type: 'atk' | 'def';
  color: string; // цвет для градации (text-slate-400 etc)
}

// --- Интерфейс артефакта ---
export interface Artifact {
  name: string;
  val: number;
}

// --- Интерфейс цели боя ---
export interface CombatTarget {
  x: number;
  y: number;
  enemy: EnemyType;
}

// --- Интерфейс Кампании (для запароленных подземелий) ---
export interface DungeonCampaign {
  name: string;
  password?: string;
  levels: Record<number, CellData[][]>;
}

// --- Тип режима игры ---
export type GameMode = 'dm' | 'player';

// --- Тип активного меню ---
export type ActiveMenu = 'main' | 'skills' | 'items' | 'shop';

// --- Интерфейс товара в магазине ---
export interface ShopItem {
  id: string;
  itemType: PotionType | WeaponType | ArmorType;
  price: number;
  stock: number; // -1 = бесконечно
}

// --- Интерфейс торговца ---
export interface MerchantData {
  name: string;
  greeting: string;
  items: ShopItem[];
}

// --- Alias для CellData (для совместимости) ---
export type Cell = CellData;