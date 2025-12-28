import React from 'react';

// --- Типы ячеек ---
export type CellType = 'wall' | 'floor' | 'door' | 'door_open' | 'secret_door' | 'trap' | 'water' | 'lava' | 'grass' | 'stairs_down' | 'stairs_up';

// --- Типы предметов ---
export type PotionType = 'potion_weak' | 'potion_mid' | 'potion_strong' | 'potion_mana';
export type WeaponType = 'weapon_weak' | 'weapon_mid' | 'weapon_strong';
export type ArmorType = 'armor_weak' | 'armor_mid' | 'armor_strong';
export type ItemType = PotionType | WeaponType | ArmorType | 'gold' | 'chest' | null;

// --- Типы врагов ---
export type EnemyType = 'goblin' | 'orc' | 'boss' | null;

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
  inventory: (PotionType | WeaponType | ArmorType)[]; // Обновили тип инвентаря
  equippedWeapon: WeaponType | null; // <-- НОВОЕ ПОЛЕ
  equippedArmor: ArmorType | null;   // <-- НОВОЕ ПОЛЕ
  dungeonLevel: number;
}

// --- Интерфейс статистики монстра ---
export interface MonsterStats {
  hp: number;
  atk: number;
  xp: number;
  gold: number;
  name: string;
  color: string;
}

// --- Интерфейс статистики зелья ---
export interface PotionStats {
  heal: number;
  mana: number;
  name: string;
  color: string;
  type: 'hp' | 'mp';
}

// --- Интерфейс статистики снаряжения ---
export interface GearStats {
  val: number;
  name: string;
  type: 'atk' | 'def'; // Уточнили тип
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

// --- Тип режима игры ---
export type GameMode = 'dm' | 'player';

// --- Тип активного меню ---
export type ActiveMenu = 'main' | 'skills' | 'items';