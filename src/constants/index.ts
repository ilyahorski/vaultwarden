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
  // --- ОРУЖИЕ ---
  weapon_rusty:      { val: 2,  name: 'Ржавый меч',      type: 'atk', color: 'text-stone-400' },
  weapon_dagger:     { val: 4,  name: 'Кинжал убийцы',   type: 'atk', color: 'text-stone-500' },
  weapon_mace:       { val: 6,  name: 'Тяжелая булава',  type: 'atk', color: 'text-slate-400' },
  weapon_sword:      { val: 8,  name: 'Стальной меч',    type: 'atk', color: 'text-slate-300' },
  weapon_axe:        { val: 12, name: 'Боевой топор',    type: 'atk', color: 'text-slate-200' },
  weapon_greatsword: { val: 16, name: 'Мифриловый меч',  type: 'atk', color: 'text-sky-300' },
  weapon_legend:     { val: 25, name: 'Клинок Богов',    type: 'atk', color: 'text-yellow-400' },

  // --- БРОНЯ ---
  armor_cloth:       { val: 1,  name: 'Ветхая рубаха',   type: 'def', color: 'text-stone-400' },
  armor_leather:     { val: 3,  name: 'Кожаная куртка',  type: 'def', color: 'text-orange-900' },
  armor_studded:     { val: 5,  name: 'Клепаная броня',  type: 'def', color: 'text-orange-800' },
  armor_chain:       { val: 8,  name: 'Кольчуга',        type: 'def', color: 'text-slate-400' },
  armor_plate_light: { val: 12, name: 'Латный нагрудник',type: 'def', color: 'text-slate-300' },
  armor_plate_heavy: { val: 18, name: 'Тяжелые латы',    type: 'def', color: 'text-slate-200' },
  armor_legend:      { val: 30, name: 'Эгида Бессмертия',type: 'def', color: 'text-yellow-400' },
};

// --- Характеристики зелий ---
export const POTION_STATS: Record<string, PotionStats> = {
  // HP
  potion_weak:   { heal: 30,  mana: 0, name: 'Малое зелье лечения',   color: 'red-300', type: 'hp' },
  potion_mid:    { heal: 60,  mana: 0, name: 'Среднее зелье лечения', color: 'red-500', type: 'hp' },
  potion_strong: { heal: 100, mana: 0, name: 'Большое зелье лечения', color: 'red-700', type: 'hp' },
  // MP
  potion_mana_weak:   { heal: 0, mana: 20,  name: 'Малое зелье маны',   color: 'blue-300', type: 'mp' },
  potion_mana_mid:    { heal: 0, mana: 50,  name: 'Среднее зелье маны', color: 'blue-500', type: 'mp' },
  potion_mana_strong: { heal: 0, mana: 100, name: 'Большое зелье маны', color: 'blue-700', type: 'mp' },
};

// --- Характеристики монстров ---
export const MONSTER_STATS: Record<string, MonsterStats> = {
  // Животные
  snake:     { hp: 15,  atk: 4,  xp: 10,  gold: 2,  name: 'Змея',         color: 'text-lime-400',  iconType: 'snake' },
  goblin:    { hp: 30,  atk: 8,  xp: 20,  gold: 5,  name: 'Гоблин',       color: 'text-green-500', iconType: 'ghost' },
  
  // Нежить
  skeleton:  { hp: 45,  atk: 12, xp: 35,  gold: 8,  name: 'Скелет',       color: 'text-slate-300', iconType: 'skull' },
  zombie:    { hp: 80,  atk: 10, xp: 45,  gold: 12, name: 'Зомби',        color: 'text-emerald-700', iconType: 'ghost' },
  lich:      { hp: 200, atk: 40, xp: 500, gold: 200, name: 'Лич',          color: 'text-purple-400', iconType: 'crown' },
  
  // Орда
  orc:       { hp: 60,  atk: 15, xp: 50,  gold: 15, name: 'Орк',          color: 'text-green-700', iconType: 'skull' },
  orc_chief: { hp: 140, atk: 25, xp: 150, gold: 60, name: 'Вождь Орков',  color: 'text-red-600',   iconType: 'crown' },
  
  // Боссы
  boss:      { hp: 300, atk: 35, xp: 1000,gold: 500, name: 'Тёмный Рыцарь',color: 'text-rose-900',  iconType: 'crown' },
};

// --- Классы ---
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