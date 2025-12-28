import React from 'react';
import { Sword, Zap, Ghost } from 'lucide-react';
import type { ClassType, ClassData, MonsterStats, PotionType, PotionStats, GearStats, Artifact } from '../types';

// --- Конфигурация карты ---
export const GRID_SIZE = 40;
export const CELL_SIZE = 15;
export const VISIBILITY_RADIUS = 3;
export const AGGRO_RADIUS = 6;

// --- Классы персонажей ---
export const CLASSES: Record<ClassType, ClassData> = {
  warrior: {
    name: 'Воин',
    hp: 120, maxHp: 120, mp: 20, maxMp: 20, atk: 14, def: 8,
    baseMoves: 4,
    desc: 'Мастер ближнего боя. Высокая выживаемость.',
    icon: React.createElement(Sword, { size: 32, className: 'text-orange-500' }),
    skills: [
      { id: 'bash', name: 'Сокрушение', mpCost: 5, desc: 'Урон x1.5', dmgMult: 1.5 },
      { id: 'rally', name: 'Второе дыхание', mpCost: 10, desc: '+20 HP', heal: 20 }
    ]
  },
  mage: {
    name: 'Маг',
    hp: 70, maxHp: 70, mp: 60, maxMp: 60, atk: 6, def: 3,
    baseMoves: 5,
    desc: 'Хрупкий, но обладает разрушительной магией.',
    icon: React.createElement(Zap, { size: 32, className: 'text-blue-500' }),
    skills: [
      { id: 'fireball', name: 'Огненный Шар', mpCost: 10, desc: 'Урон x2.5', dmgMult: 2.5 },
      { id: 'drain', name: 'Вампиризм', mpCost: 15, desc: 'Урон x1.5 + Лечение 15', dmgMult: 1.5, heal: 15 }
    ]
  },
  rogue: {
    name: 'Плут',
    hp: 90, maxHp: 90, mp: 30, maxMp: 30, atk: 12, def: 5,
    baseMoves: 6,
    desc: 'Ловкий и быстрый. Критические удары.',
    icon: React.createElement(Ghost, { size: 32, className: 'text-green-500' }),
    skills: [
      { id: 'backstab', name: 'Удар в спину', mpCost: 8, desc: 'Урон x2.0', dmgMult: 2.0 },
      { id: 'bandage', name: 'Перевязка', mpCost: 5, desc: '+25 HP', heal: 25 }
    ]
  }
};

// --- Статистика монстров ---
export const MONSTER_STATS: Record<string, MonsterStats> = {
  goblin: { hp: 20, atk: 8, xp: 20, gold: 15, name: 'Гоблин', color: 'text-green-500' },
  orc: { hp: 50, atk: 15, xp: 50, gold: 40, name: 'Орк', color: 'text-red-500' },
  boss: { hp: 150, atk: 30, xp: 200, gold: 300, name: 'Демон', color: 'text-purple-600' }
};

// --- Статистика зелий ---
export const POTION_STATS: Record<PotionType, PotionStats> = {
  potion_weak: { heal: 20, mana: 0, name: 'Малое зелье', color: 'bg-red-400', type: 'hp' },
  potion_mid: { heal: 50, mana: 0, name: 'Среднее зелье', color: 'bg-red-500', type: 'hp' },
  potion_strong: { heal: 100, mana: 0, name: 'Мощное зелье', color: 'bg-red-600', type: 'hp' },
  potion_mana: { heal: 0, mana: 30, name: 'Эликсир Маны', color: 'bg-blue-500', type: 'mp' }
};

// --- Статистика снаряжения ---
export const GEAR_STATS: Record<string, GearStats> = {
  weapon_weak: { val: 15, name: 'Ржавый меч', type: 'atk' },
  weapon_mid: { val: 25, name: 'Стальной меч', type: 'atk' },
  weapon_strong: { val: 50, name: 'Меч Героя', type: 'atk' },
  armor_weak: { val: 12, name: 'Кожаная куртка', type: 'def' },
  armor_mid: { val: 20, name: 'Кольчуга', type: 'def' },
  armor_strong: { val: 35, name: 'Латный доспех', type: 'def' },
};

// --- Редкие артефакты ---
export const RARE_ARTIFACTS: Artifact[] = [
  { name: 'Золотой Идол', val: 250 },
  { name: 'Древний Рубин', val: 400 },
  { name: 'Корона Короля', val: 600 },
  { name: 'Сапфировый Ключ', val: 300 },
  { name: 'Кольцо Власти', val: 500 }
];

// --- Начальное состояние игрока ---
export const INITIAL_PLAYER = {
  x: 1,
  y: 1,
  hp: 100,
  maxHp: 100,
  mp: 20,
  maxMp: 20,
  atk: 10,
  def: 5,
  moves: 4,
  maxMoves: 4,
  xp: 0,
  level: 1,
  nextLevelXp: 100,
  gold: 0,
  name: 'Игрок',
  class: 'warrior' as ClassType,
  inventory: ['potion_weak' as const],
  dungeonLevel: 1
};

// --- Ключ сохранения ---
export const SAVE_KEY = 'dungeon_save_v1';
