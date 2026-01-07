import type { CellData, CellType, ItemType, EnemyType } from '../types';
import { GRID_SIZE } from '../constants';

// Короткие коды для типов клеток
const CELL_TYPE_MAP: Record<CellType, string> = {
  wall: 'W', floor: 'F', door: 'D', door_open: 'O', secret_door: 'S',
  trap: 'T', water: 'A', lava: 'L', grass: 'G',
  stairs_down: 'd', stairs_up: 'u', torch: 't', torch_lit: 'l',
  merchant: 'M', secret_button: 'B', secret_button_activated: 'b'
};
const CELL_TYPE_REVERSE: Record<string, CellType> = Object.fromEntries(
  Object.entries(CELL_TYPE_MAP).map(([k, v]) => [v, k as CellType])
);

// Короткие коды для предметов
const ITEM_MAP: Record<NonNullable<ItemType>, string> = {
  potion_weak: 'pw', potion_mid: 'pm', potion_strong: 'ps',
  potion_mana_weak: 'mw', potion_mana_mid: 'mm', potion_mana_strong: 'ms',
  weapon_rusty: 'wr', weapon_dagger: 'wd', weapon_mace: 'wm',
  weapon_sword: 'ws', weapon_axe: 'wa', weapon_greatsword: 'wg', weapon_legend: 'wl',
  armor_cloth: 'ac', armor_leather: 'al', armor_studded: 'as',
  armor_chain: 'ah', armor_plate_light: 'ap', armor_plate_heavy: 'aH', armor_legend: 'aL',
  gold: 'g$', chest: 'ch'
};
const ITEM_REVERSE: Record<string, ItemType> = Object.fromEntries(
  Object.entries(ITEM_MAP).map(([k, v]) => [v, k as ItemType])
);

// Короткие коды для врагов
const ENEMY_MAP: Record<NonNullable<EnemyType>, string> = {
  snake: 'sn', goblin: 'go', skeleton: 'sk', zombie: 'zo',
  lich: 'li', orc: 'or', orc_chief: 'oc', boss: 'bo'
};
const ENEMY_REVERSE: Record<string, EnemyType> = Object.fromEntries(
  Object.entries(ENEMY_MAP).map(([k, v]) => [v, k as EnemyType])
);

interface CompressedCell {
  t: string;           // type
  i?: string;          // item (только если есть)
  e?: string;          // enemy (только если есть)
  h?: number;          // enemyHp (только если есть)
  r?: 1;               // isRevealed (только если true)
  v?: 1;               // isVisible (только если true)
  s?: 1 | 0;           // isSecretTrigger (1 = true, 0 = false, undefined = не секретная кнопка)
}

export interface CompressedLevel {
  v: 1;                // версия формата
  s: number;           // размер сетки
  c: (CompressedCell | string)[];  // клетки (string = только тип)
}

/**
 * Сжимает уровень для хранения в памяти/localStorage
 */
export function compressLevel(grid: CellData[][]): CompressedLevel {
  const cells: (CompressedCell | string)[] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = grid[y][x];
      const typeCode = CELL_TYPE_MAP[cell.type] || 'W';

      // Если клетка простая (без предметов, врагов, невидимая, без секретного флага) — храним только тип
      if (!cell.item && !cell.enemy && !cell.isRevealed && !cell.isVisible && cell.isSecretTrigger === undefined) {
        cells.push(typeCode);
      } else {
        const compressed: CompressedCell = { t: typeCode };
        if (cell.item) compressed.i = ITEM_MAP[cell.item];
        if (cell.enemy) {
          compressed.e = ENEMY_MAP[cell.enemy];
          if (cell.enemyHp !== undefined) compressed.h = cell.enemyHp;
        }
        if (cell.isRevealed) compressed.r = 1;
        if (cell.isVisible) compressed.v = 1;
        if (cell.isSecretTrigger !== undefined) compressed.s = cell.isSecretTrigger ? 1 : 0;
        cells.push(compressed);
      }
    }
  }

  return { v: 1, s: GRID_SIZE, c: cells };
}

/**
 * Распаковывает уровень из сжатого формата
 */
export function decompressLevel(compressed: CompressedLevel): CellData[][] {
  const grid: CellData[][] = [];
  const size = compressed.s || GRID_SIZE;

  let index = 0;
  for (let y = 0; y < size; y++) {
    const row: CellData[] = [];
    for (let x = 0; x < size; x++) {
      const cell = compressed.c[index++];

      if (typeof cell === 'string') {
        // Простая клетка — только тип
        row.push({
          x, y,
          type: CELL_TYPE_REVERSE[cell] || 'wall',
          item: null,
          enemy: null,
          isRevealed: false,
          isVisible: false
        });
      } else {
        // Полная клетка
        const cellData: CellData = {
          x, y,
          type: CELL_TYPE_REVERSE[cell.t] || 'wall',
          item: cell.i ? (ITEM_REVERSE[cell.i] || null) : null,
          enemy: cell.e ? (ENEMY_REVERSE[cell.e] || null) : null,
          enemyHp: cell.h,
          isRevealed: cell.r === 1,
          isVisible: cell.v === 1
        };
        if (cell.s !== undefined) cellData.isSecretTrigger = cell.s === 1;
        row.push(cellData);
      }
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Хранилище уровней с автоматическим сжатием неактивных уровней
 */
export class LevelHistoryManager {
  private activelevels: Map<number, CellData[][]> = new Map();
  private compressedLevels: Map<number, CompressedLevel> = new Map();
  private currentLevel: number = 1;

  constructor(initialHistory: Record<number, CellData[][]> = {}) {
    // Импортируем существующую историю
    for (const [level, grid] of Object.entries(initialHistory)) {
      const levelNum = Number(level);
      this.compressedLevels.set(levelNum, compressLevel(grid));
    }
  }

  /**
   * Устанавливает текущий уровень и кэширует соседние
   */
  setCurrentLevel(level: number): void {
    // Сжимаем уровни, которые больше не соседние
    for (const [l, grid] of this.activelevels) {
      if (Math.abs(l - level) > 1) {
        this.compressedLevels.set(l, compressLevel(grid));
        this.activelevels.delete(l);
      }
    }

    this.currentLevel = level;

    // Распаковываем соседние уровни для быстрого доступа
    for (const l of [level - 1, level, level + 1]) {
      if (l > 0 && this.compressedLevels.has(l) && !this.activelevels.has(l)) {
        this.activelevels.set(l, decompressLevel(this.compressedLevels.get(l)!));
      }
    }
  }

  /**
   * Получает уровень (распаковывает при необходимости)
   */
  getLevel(level: number): CellData[][] | undefined {
    // Сначала проверяем активные уровни
    if (this.activelevels.has(level)) {
      return this.activelevels.get(level);
    }

    // Затем распаковываем из сжатых
    if (this.compressedLevels.has(level)) {
      const grid = decompressLevel(this.compressedLevels.get(level)!);
      this.activelevels.set(level, grid);
      return grid;
    }

    return undefined;
  }

  /**
   * Сохраняет уровень
   */
  setLevel(level: number, grid: CellData[][]): void {
    // Если уровень близок к текущему — храним в активных
    if (Math.abs(level - this.currentLevel) <= 1) {
      this.activelevels.set(level, grid);
    } else {
      // Иначе сразу сжимаем
      this.compressedLevels.set(level, compressLevel(grid));
    }
  }

  /**
   * Удаляет уровень
   */
  deleteLevel(level: number): void {
    this.activelevels.delete(level);
    this.compressedLevels.delete(level);
  }

  /**
   * Проверяет наличие уровня
   */
  hasLevel(level: number): boolean {
    return this.activelevels.has(level) || this.compressedLevels.has(level);
  }

  /**
   * Возвращает все уровни как Record для совместимости с существующим кодом
   */
  toRecord(): Record<number, CellData[][]> {
    const result: Record<number, CellData[][]> = {};

    // Сначала добавляем активные уровни
    for (const [level, grid] of this.activelevels) {
      result[level] = grid;
    }

    // Затем распаковываем остальные
    for (const [level, compressed] of this.compressedLevels) {
      if (!result[level]) {
        result[level] = decompressLevel(compressed);
      }
    }

    return result;
  }

  /**
   * Экспортирует в JSON-совместимый формат для localStorage
   */
  toJSON(): Record<number, CompressedLevel> {
    const result: Record<number, CompressedLevel> = {};

    // Сжимаем активные уровни
    for (const [level, grid] of this.activelevels) {
      result[level] = compressLevel(grid);
    }

    // Копируем уже сжатые
    for (const [level, compressed] of this.compressedLevels) {
      if (!result[level]) {
        result[level] = compressed;
      }
    }

    return result;
  }

  /**
   * Импортирует из JSON формата
   */
  static fromJSON(data: Record<number, CompressedLevel | CellData[][]>): LevelHistoryManager {
    const manager = new LevelHistoryManager();

    for (const [level, value] of Object.entries(data)) {
      const levelNum = Number(level);

      // Проверяем, сжатый это формат или обычный
      if ('v' in value && 'c' in value) {
        manager.compressedLevels.set(levelNum, value as CompressedLevel);
      } else {
        // Старый формат — сжимаем
        manager.compressedLevels.set(levelNum, compressLevel(value as CellData[][]));
      }
    }

    return manager;
  }

  /**
   * Получает список всех уровней
   */
  getLevelNumbers(): number[] {
    const levels = new Set<number>();
    for (const l of this.activelevels.keys()) levels.add(l);
    for (const l of this.compressedLevels.keys()) levels.add(l);
    return Array.from(levels).sort((a, b) => a - b);
  }
}
