import React from 'react';
import { Sword, Shield, Zap } from 'lucide-react';
import type { ClassData, MonsterStats, PotionStats, GearStats, Artifact } from '../types';

// --- Конфигурация карты ---
export const GRID_SIZE = 50;
export const CELL_SIZE = 15;
export const VISIBILITY_RADIUS = 3;
export const AGGRO_RADIUS = 6;
export const MAX_INVENTORY_SIZE = 100;
export const SAVE_KEY = 'dungeon_save_v1';

// --- Стартовый игрок ---
export const INITIAL_PLAYER = {
  x: 1,
  y: 1,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  atk: 5,
  def: 0,
  moves: 4,
  maxMoves: 4,
  xp: 0,
  level: 1,
  nextLevelXp: 100,
  gold: 0,
  name: 'Hero',
  class: 'warrior',
  inventory: [],
  equippedWeapon: null,
  equippedArmor: null,
  dungeonLevel: 1
};

// --- Характеристики снаряжения ---
export const GEAR_STATS: Record<string, GearStats> = {
  // Оружие
  weapon_weak: { val: 2, name: 'Ржавый меч', type: 'atk' },
  weapon_mid: { val: 5, name: 'Стальной меч', type: 'atk' },
  weapon_strong: { val: 9, name: 'Мифриловый клинок', type: 'atk' },
  // Броня
  armor_weak: { val: 1, name: 'Кожаная куртка', type: 'def' },
  armor_mid: { val: 3, name: 'Кольчуга', type: 'def' },
  armor_strong: { val: 6, name: 'Латный доспех', type: 'def' },
};

// --- Характеристики зелий ---
export const POTION_STATS: Record<string, PotionStats> = {
  potion_weak: { heal: 30, mana: 0, name: 'Малое зелье лечения', color: 'red', type: 'hp' },
  potion_mid: { heal: 60, mana: 0, name: 'Среднее зелье лечения', color: 'red', type: 'hp' },
  potion_strong: { heal: 100, mana: 0, name: 'Большое зелье лечения', color: 'red', type: 'hp' },
  potion_mana: { heal: 0, mana: 30, name: 'Зелье маны', color: 'blue', type: 'mp' },
};

// --- Характеристики монстров ---
export const MONSTER_STATS: Record<string, MonsterStats> = {
  goblin: { hp: 30, atk: 8, xp: 20, gold: 5, name: 'Гоблин', color: 'green' },
  orc: { hp: 60, atk: 15, xp: 50, gold: 15, name: 'Орк', color: 'emerald' },
  boss: { hp: 150, atk: 25, xp: 200, gold: 100, name: 'Тёмный Рыцарь', color: 'purple' },
};

// --- Классы ---
// (В React компонентах иконки создаются через React.createElement)
export const CLASSES: Record<string, ClassData> = {
  warrior: {
    name: 'Воин',
    hp: 120, maxHp: 120,
    mp: 20, maxMp: 20,
    atk: 8, def: 2,
    baseMoves: 4,
    desc: 'Мастер ближнего боя. Высокое здоровье и урон.',
    icon: React.createElement(Sword, { size: 24 }),
    skills: [
      { id: 'heavy_strike', name: 'Тяжелый удар', mpCost: 5, desc: 'Наносит 200% урона', dmgMult: 2 },
      { id: 'rage', name: 'Ярость', mpCost: 10, desc: 'Восстанавливает 20 HP и бьет врага', heal: 20, dmgMult: 1 }
    ]
  },
  mage: {
    name: 'Маг',
    hp: 70, maxHp: 70,
    mp: 100, maxMp: 100,
    atk: 4, def: 0,
    baseMoves: 4,
    desc: 'Владеет мощными заклинаниями, но слаб телом.',
    icon: React.createElement(Zap, { size: 24 }),
    skills: [
      { id: 'fireball', name: 'Огненный шар', mpCost: 15, desc: 'Мощный магический урон (300%)', dmgMult: 3 },
      { id: 'heal', name: 'Лечение', mpCost: 20, desc: 'Восстанавливает 40 HP', heal: 40 }
    ]
  },
  rogue: {
    name: 'Разбойник',
    hp: 90, maxHp: 90,
    mp: 40, maxMp: 40,
    atk: 6, def: 1,
    baseMoves: 5,
    desc: 'Быстрый и ловкий. Умеет избегать ударов.',
    icon: React.createElement(Shield, { size: 24 }),
    skills: [
      { id: 'backstab', name: 'Удар в спину', mpCost: 10, desc: 'Критический удар (250%)', dmgMult: 2.5 },
      { id: 'quick_heal', name: 'Перевязка', mpCost: 10, desc: 'Быстрое лечение (+25 HP)', heal: 25 }
    ]
  }
};

// --- Редкие артефакты ---
export const RARE_ARTIFACTS: Artifact[] = [
  { name: 'Золотой Идол', val: 250 },
  { name: 'Древний Рубин', val: 400 },
  { name: 'Корона Короля', val: 600 },
  { name: 'Сапфировый Ключ', val: 300 },
  { name: 'Кольцо Власти', val: 500 }
];

