import React from 'react';
import { Sword, Shield, Zap } from 'lucide-react';
import type { ClassData, MonsterStats, PotionStats, GearStats, Artifact } from '../types';

// --- Конфигурация карты ---
export const GRID_SIZE = 45;
export const CELL_SIZE = 16; // Изменено с 15 на 16 для соответствия размеру спрайтов
export const VISIBILITY_RADIUS = 5;
export const AGGRO_RADIUS = 4;
export const TORCH_LIGHT_RADIUS = 8;
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
  moves: 10,
  maxMoves: 10,
  xp: 0,
  level: 1,
  nextLevelXp: 100,
  gold: 0,
  name: 'Hero',
  class: 'warrior',
  inventory: [],
  equippedWeapon: null,
  equippedArmor: null,
  dungeonLevel: 1,
  facing: 'down'
};

// --- Характеристики снаряжения ---
export const GEAR_STATS: Record<string, GearStats> = {
  // --- ОРУЖИЕ ---
  weapon_rusty:      { val: 2,  name: 'Ржавый меч',      type: 'atk', color: 'text-stone-200' },
  weapon_dagger:     { val: 4,  name: 'Кинжал убийцы',   type: 'atk', color: 'text-stone-300' },
  weapon_mace:       { val: 6,  name: 'Тяжелая булава',  type: 'atk', color: 'text-stone-400' },
  weapon_sword:      { val: 8,  name: 'Стальной меч',    type: 'atk', color: 'text-stone-500' },
  weapon_axe:        { val: 12, name: 'Боевой топор',    type: 'atk', color: 'text-stone-600' },
  weapon_greatsword: { val: 16, name: 'Мифриловый меч',  type: 'atk', color: 'text-sky-300' },
  weapon_legend:     { val: 25, name: 'Клинок Богов',    type: 'atk', color: 'text-yellow-400' },

  // --- БРОНЯ ---
  armor_cloth:       { val: 1,  name: 'Ветхая рубаха',   type: 'def', color: 'text-stone-200' },
  armor_leather:     { val: 3,  name: 'Кожаная куртка',  type: 'def', color: 'text-stone-300' },
  armor_studded:     { val: 5,  name: 'Клепаная броня',  type: 'def', color: 'text-stone-400' },
  armor_chain:       { val: 8,  name: 'Кольчуга',        type: 'def', color: 'text-stone-500' },
  armor_plate_light: { val: 12, name: 'Латный нагрудник',type: 'def', color: 'text-stone-600' },
  armor_plate_heavy: { val: 18, name: 'Тяжелые латы',    type: 'def', color: 'text-sky-300' },
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
// Прогрессия силы: Слабые (15-30 HP) -> Обычные (35-70 HP) -> Сильные (75-120 HP) -> Элитные (125-180 HP) -> Боссы (200+ HP)
export const MONSTER_STATS: Record<string, MonsterStats> = {
  // === СЛАБЫЕ ВРАГИ (Уровень 1-2) ===
  snake:     { hp: 15,  atk: 4,  xp: 10,  gold: 2,  name: 'Змея',         color: 'text-lime-400',  iconType: 'snake' },
  goblin:    { hp: 30,  atk: 8,  xp: 20,  gold: 5,  name: 'Гоблин',       color: 'text-green-500', iconType: 'ghost' },

  // === ГОБЛИНЫ (Уровень 2-4) ===
  goblin_archer:     { hp: 35,  atk: 9,  xp: 25,  gold: 6,  name: 'Гоблин-лучник',      color: 'text-green-400', iconType: 'ghost' },
  goblin_fighter:    { hp: 42,  atk: 10, xp: 28,  gold: 7,  name: 'Гоблин-воин',        color: 'text-green-600', iconType: 'ghost' },
  goblin_fanatic:    { hp: 38,  atk: 12, xp: 30,  gold: 8,  name: 'Гоблин-фанатик',     color: 'text-green-500', iconType: 'ghost' },
  goblin_occultist:  { hp: 40,  atk: 11, xp: 32,  gold: 9,  name: 'Гоблин-оккультист',  color: 'text-purple-500', iconType: 'ghost' },
  goblin_wolf_rider: { hp: 55,  atk: 14, xp: 40,  gold: 12, name: 'Наездник на волке',   color: 'text-green-700', iconType: 'ghost' },

  // === ХАЛФЛИНГИ (Уровень 3-5) - Быстрые и ловкие ===
  halfling_rogue:    { hp: 40,  atk: 10, xp: 30,  gold: 8,  name: 'Халфлинг-плут',      color: 'text-slate-500', iconType: 'ghost' },
  halfling_slinger:  { hp: 35,  atk: 11, xp: 32,  gold: 9,  name: 'Халфлинг-пращник',   color: 'text-amber-600', iconType: 'ghost' },
  halfling_bard:     { hp: 42,  atk: 9,  xp: 28,  gold: 10, name: 'Халфлинг-бард',      color: 'text-yellow-500', iconType: 'ghost' },
  halfling_ranger:   { hp: 50,  atk: 13, xp: 38,  gold: 11, name: 'Халфлинг-рейнджер',  color: 'text-green-600', iconType: 'ghost' },
  halfling_assassin: { hp: 55,  atk: 16, xp: 45,  gold: 15, name: 'Халфлинг-ассасин',   color: 'text-red-600', iconType: 'ghost' },

  // === ЯЩЕРОЛЮДИ (Уровень 4-6) - Жёсткие и живучие ===
  bestial_lizardfolk:    { hp: 50,  atk: 12, xp: 35,  gold: 10, name: 'Звероящер',            color: 'text-teal-400', iconType: 'snake' },
  lizardfolk_scout:      { hp: 55,  atk: 13, xp: 40,  gold: 12, name: 'Ящер-разведчик',       color: 'text-teal-400', iconType: 'ghost' },
  lizardfolk_archer:     { hp: 60,  atk: 14, xp: 42,  gold: 13, name: 'Ящер-лучник',          color: 'text-teal-500', iconType: 'ghost' },
  lizardfolk_spearman:   { hp: 70,  atk: 16, xp: 50,  gold: 16, name: 'Ящер-копейщик',        color: 'text-teal-700', iconType: 'skull' },
  lizardfolk_gladiator:  { hp: 85,  atk: 18, xp: 60,  gold: 20, name: 'Ящер-гладиатор',       color: 'text-teal-600', iconType: 'skull' },

  // === НЕЖИТЬ (Уровень 3-7) ===
  skeleton:  { hp: 45,  atk: 10, xp: 35,  gold: 8,  name: 'Скелет',       color: 'text-slate-300', iconType: 'skull' },
  zombie:    { hp: 80,  atk: 15, xp: 45,  gold: 12, name: 'Зомби',        color: 'text-emerald-700', iconType: 'ghost' },
  lich:      { hp: 200, atk: 30, xp: 500, gold: 200, name: 'Лич',          color: 'text-purple-400', iconType: 'crown' },

  // === ГНОЛЛЫ (Уровень 5-7) - Агрессивные и опасные ===
  gnoll_grunt:   { hp: 65,  atk: 14, xp: 45,  gold: 13, name: 'Гнолл-пехотинец',   color: 'text-amber-600', iconType: 'ghost' },
  gnoll_brute:   { hp: 75,  atk: 16, xp: 52,  gold: 16, name: 'Гнолл-громила',     color: 'text-amber-700', iconType: 'skull' },
  gnoll_pikeman: { hp: 70,  atk: 15, xp: 48,  gold: 15, name: 'Гнолл-пикинёр',     color: 'text-amber-500', iconType: 'skull' },
  gnoll_ripper:  { hp: 80,  atk: 18, xp: 60,  gold: 18, name: 'Гнолл-потрошитель', color: 'text-red-700', iconType: 'skull' },
  gnoll_warlord: { hp: 120, atk: 22, xp: 100, gold: 40, name: 'Гнолл-полководец',  color: 'text-amber-500', iconType: 'crown' },

  // === ГНОМЫ (Уровень 4-6) - Магические и хитрые ===
  gnome_wanderer:  { hp: 48,  atk: 10, xp: 35,  gold: 12, name: 'Гном-странник',      color: 'text-cyan-600', iconType: 'ghost' },
  gnome_tinkerer:  { hp: 52,  atk: 11, xp: 38,  gold: 14, name: 'Гном-изобретатель',  color: 'text-slate-400', iconType: 'ghost' },
  gnome_alchemist: { hp: 55,  atk: 12, xp: 42,  gold: 15, name: 'Гном-алхимик',       color: 'text-green-500', iconType: 'ghost' },
  gnome_mage:      { hp: 60,  atk: 15, xp: 50,  gold: 18, name: 'Гном-маг',           color: 'text-cyan-500', iconType: 'ghost' },
  gnome_wizard:    { hp: 70,  atk: 18, xp: 60,  gold: 22, name: 'Гном-волшебник',     color: 'text-purple-500', iconType: 'ghost' },

  // === ОРКИ (Уровень 6-8) - Сильные воины ===
  orc:           { hp: 60,  atk: 15, xp: 50,  gold: 15, name: 'Орк',           color: 'text-green-700', iconType: 'skull' },
  orc_savage:    { hp: 75,  atk: 17, xp: 55,  gold: 17, name: 'Орк-дикарь',    color: 'text-red-800', iconType: 'skull' },
  orc_reaver:    { hp: 85,  atk: 19, xp: 65,  gold: 20, name: 'Орк-налётчик',  color: 'text-red-700', iconType: 'skull' },
  orc_shaman:    { hp: 90,  atk: 20, xp: 70,  gold: 25, name: 'Орк-шаман',     color: 'text-purple-600', iconType: 'ghost' },
  orc_warlock:   { hp: 100, atk: 22, xp: 80,  gold: 28, name: 'Орк-колдун',    color: 'text-purple-700', iconType: 'ghost' },
  orc_captain:   { hp: 120, atk: 24, xp: 100, gold: 35, name: 'Орк-капитан',   color: 'text-red-600', iconType: 'crown' },
  orc_chief:     { hp: 140, atk: 25, xp: 150, gold: 60, name: 'Вождь Орков',   color: 'text-red-500', iconType: 'crown' },

  // === БОССЫ (Уровень 8+) ===
  boss:          { hp: 300, atk: 45, xp: 1000, gold: 500, name: 'Тёмный Рыцарь', color: 'text-rose-900', iconType: 'crown' },
};

// --- Классы ---
export const CLASSES: Record<string, ClassData> = {
  warrior: {
    name: 'Воин',
    hp: 120, maxHp: 120,
    mp: 20, maxMp: 20,
    atk: 8, def: 2,
    baseMoves: 8,
    desc: 'Мастер ближнего боя. Высокое здоровье и урон.',
    icon: React.createElement(Sword, { size: 24 }),
    skills: [
      { id: 'heavy_strike', name: 'Тяжелый удар', mpCost: 5, desc: 'Наносит 200% урона', dmgMult: 2 },
      { id: 'rage', name: 'Ярость', mpCost: 10, desc: 'Восстанавливает 20 HP и бьет врага', heal: 20, dmgMult: 2 }
    ],
    startingWeapon: 'weapon_rusty',
    startingArmor: 'armor_leather'
  },
  mage: {
    name: 'Маг',
    hp: 70, maxHp: 70,
    mp: 100, maxMp: 100,
    atk: 4, def: 0,
    baseMoves: 10,
    desc: 'Владеет мощными заклинаниями, но слаб телом.',
    icon: React.createElement(Zap, { size: 24 }),
    skills: [
      { id: 'fireball', name: 'Огненный шар', mpCost: 15, desc: 'Мощный магический урон (300%)', dmgMult: 3 },
      { id: 'heal', name: 'Лечение', mpCost: 20, desc: 'Восстанавливает 40 HP', heal: 40 }
    ],
    startingWeapon: 'weapon_dagger',
    startingArmor: 'armor_cloth'
  },
  rogue: {
    name: 'Разбойник',
    hp: 90, maxHp: 90,
    mp: 40, maxMp: 40,
    atk: 6, def: 1,
    baseMoves: 12,
    desc: 'Быстрый и ловкий. Умеет избегать ударов.',
    icon: React.createElement(Shield, { size: 24 }),
    skills: [
      { id: 'backstab', name: 'Удар в спину', mpCost: 10, desc: 'Критический удар (250%)', dmgMult: 2.5 },
      { id: 'quick_heal', name: 'Перевязка', mpCost: 10, desc: 'Быстрое лечение (+25 HP)', heal: 25 }
    ],
    startingWeapon: 'weapon_dagger',
    startingArmor: 'armor_leather'
  }
};

// --- Редкие артефакты ---
export const RARE_ARTIFACTS: Artifact[] = [
  { name: 'Золотой Идол', val: 100 },
  { name: 'Древний Рубин', val: 150 },
  { name: 'Корона Короля', val: 200 },
  { name: 'Сапфировый Ключ', val: 300 },
  { name: 'Кольцо Власти', val: 400 }
];

// --- Цены предметов (покупка/продажа) ---
export const ITEM_PRICES: Record<string, { buy: number; sell: number }> = {
  // Зелья HP
  potion_weak:   { buy: 25,  sell: 10 },
  potion_mid:    { buy: 60,  sell: 25 },
  potion_strong: { buy: 120, sell: 50 },
  // Зелья MP
  potion_mana_weak:   { buy: 30,  sell: 12 },
  potion_mana_mid:    { buy: 75,  sell: 30 },
  potion_mana_strong: { buy: 150, sell: 60 },
  // Оружие
  weapon_rusty:      { buy: 20,   sell: 5 },
  weapon_dagger:     { buy: 50,   sell: 15 },
  weapon_mace:       { buy: 100,  sell: 35 },
  weapon_sword:      { buy: 180,  sell: 60 },
  weapon_axe:        { buy: 300,  sell: 100 },
  weapon_greatsword: { buy: 500,  sell: 180 },
  weapon_legend:     { buy: 1500, sell: 600 },
  // Броня
  armor_cloth:       { buy: 15,   sell: 5 },
  armor_leather:     { buy: 40,   sell: 15 },
  armor_studded:     { buy: 80,   sell: 30 },
  armor_chain:       { buy: 150,  sell: 55 },
  armor_plate_light: { buy: 280,  sell: 100 },
  armor_plate_heavy: { buy: 500,  sell: 180 },
  armor_legend:      { buy: 1500, sell: 600 },
};

// --- Генерация ассортимента торговца по уровню подземелья ---
export const generateMerchantStock = (dungeonLevel: number): Array<{ itemType: string; price: number }> => {
  const stock: Array<{ itemType: string; price: number }> = [];

  // Всегда есть зелья
  stock.push({ itemType: 'potion_weak', price: ITEM_PRICES.potion_weak.buy });
  stock.push({ itemType: 'potion_mana_weak', price: ITEM_PRICES.potion_mana_weak.buy });

  if (dungeonLevel >= 2) {
    stock.push({ itemType: 'potion_mid', price: ITEM_PRICES.potion_mid.buy });
    stock.push({ itemType: 'potion_mana_mid', price: ITEM_PRICES.potion_mana_mid.buy });
  }

  if (dungeonLevel >= 4) {
    stock.push({ itemType: 'potion_strong', price: ITEM_PRICES.potion_strong.buy });
    stock.push({ itemType: 'potion_mana_strong', price: ITEM_PRICES.potion_mana_strong.buy });
  }

  // Оружие по уровню
  if (dungeonLevel >= 1) stock.push({ itemType: 'weapon_dagger', price: ITEM_PRICES.weapon_dagger.buy });
  if (dungeonLevel >= 2) stock.push({ itemType: 'weapon_mace', price: ITEM_PRICES.weapon_mace.buy });
  if (dungeonLevel >= 3) stock.push({ itemType: 'weapon_sword', price: ITEM_PRICES.weapon_sword.buy });
  if (dungeonLevel >= 4) stock.push({ itemType: 'weapon_axe', price: ITEM_PRICES.weapon_axe.buy });
  if (dungeonLevel >= 6) stock.push({ itemType: 'weapon_greatsword', price: ITEM_PRICES.weapon_greatsword.buy });

  // Броня по уровню
  if (dungeonLevel >= 1) stock.push({ itemType: 'armor_leather', price: ITEM_PRICES.armor_leather.buy });
  if (dungeonLevel >= 2) stock.push({ itemType: 'armor_studded', price: ITEM_PRICES.armor_studded.buy });
  if (dungeonLevel >= 3) stock.push({ itemType: 'armor_chain', price: ITEM_PRICES.armor_chain.buy });
  if (dungeonLevel >= 4) stock.push({ itemType: 'armor_plate_light', price: ITEM_PRICES.armor_plate_light.buy });
  if (dungeonLevel >= 6) stock.push({ itemType: 'armor_plate_heavy', price: ITEM_PRICES.armor_plate_heavy.buy });

  return stock;
};

// --- Имена и приветствия торговцев ---
export const MERCHANT_NAMES = [
  { name: 'Григорий разбойник', greeting: 'Добро пожаловать, путник! У меня лучшие товары в подземелье!' },
  { name: 'Эльфийка Лирия', greeting: 'Приветствую, герой. Взгляни на мои редкости...' },
  { name: 'Гном Тигурн', greeting: 'Хо-хо! Лучшие клинки и броня гномьей работы!' },
  { name: 'Таинственный странник', greeting: '...Тебе понадобится помощь. Я могу её продать.' },
];