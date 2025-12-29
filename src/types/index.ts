import React from 'react';

// --- Типы ячеек ---
export type CellType = 'wall' | 'floor' | 'door' | 'door_open' | 'secret_door' | 'trap' | 'water' | 'lava' | 'grass' | 'stairs_down' | 'stairs_up' | 'torch' | 'torch_lit';

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
  | 'snake'      // Животные
  | 'goblin'     // Животные/Простые
  | 'skeleton'   // Нежить
  | 'zombie'     // Нежить
  | 'lich'       // Нежить (Босс)
  | 'orc'        // Орда
  | 'orc_chief'  // Орда (Босс)
  | 'boss'       // Тёмный Рыцарь (Главный босс)
  | null;

// --- Типы классов ---
export type ClassType = 'warrior' | 'mage' | 'rogue';

// --- Интерфейс навыка ---
export interface Skill {
  id: string;
  name: string;
  mpCost: number;
  desc: string;
  dmgMult?: number;
  heal?: number;
}

// --- Интерфейс класса ---
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

// --- Интерфейс ячейки ---
export interface CellData {
  x: number;
  y: number;
  type: CellType;
  item: ItemType;
  enemy: EnemyType;
  enemyHp?: number;
  isRevealed: boolean;
  isVisible: boolean;
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
export type ActiveMenu = 'main' | 'skills' | 'items';