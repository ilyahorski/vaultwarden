import type { CellData, LogEntry, Player } from '../types';
import { GRID_SIZE } from '../constants';

// --- Генерация уникального ID ---
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// --- Получение текущего времени в формате HH:MM:SS ---
export const getTimestamp = (): string => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// --- Создание записи лога ---
export const createLogEntry = (text: string, type: LogEntry['type'] = 'info'): LogEntry => {
  return {
    id: generateId(),
    text,
    type,
    timestamp: getTimestamp()
  };
};

// --- Случайное число в диапазоне ---
export const rand = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// --- Расчет расстояния между двумя точками ---
export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

// --- Создание пустой сетки ---
export const createEmptyGrid = (): CellData[][] => {
  const newGrid: CellData[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: CellData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({
        x,
        y,
        type: 'wall',
        item: null,
        enemy: null,
        isRevealed: false,
        isVisible: false
      });
    }
    newGrid.push(row);
  }
  return newGrid;
};

// --- Клонирование сетки ---
export const cloneGrid = (grid: CellData[][]): CellData[][] => {
  return grid.map(row => row.map(cell => ({ ...cell })));
};

// --- Бросок D20 ---
export const rollD20 = (): number => {
  return Math.floor(Math.random() * 20) + 1;
};

// --- Проверка валидности координат ---
export const isValidCoord = (x: number, y: number): boolean => {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
};

// --- Применение повышения уровня ---
export const applyLevelUp = (
  player: Player, 
  xpGain: number, 
  addLog: (text: string, type?: LogEntry['type']) => void
): void => {
  let newXp = player.xp + xpGain;
  let newLevel = player.level;
  const required = newLevel * 100;

  if (newXp >= required) {
    newXp -= required;
    newLevel += 1;
    
    addLog(`🎉 НОВЫЙ УРОВЕНЬ! Вы достигли уровня ${newLevel}!`, 'level');

    player.level = newLevel;
    player.xp = newXp;
    player.nextLevelXp = newLevel * 100;

    player.maxHp += 20;
    player.hp = player.maxHp;
    player.maxMp += 10;
    player.mp = player.maxMp;
    player.atk += 5;
    player.def += 2;
    player.maxMoves += 1;
    player.moves = player.maxMoves;
  } else {
    player.xp = newXp;
  }
};

// --- Бросок кубика действия ---
export const rollActionDie = (
  player: Player,
  setPlayer: (player: Player) => void,
  setActiveRoll: (roll: number | null) => void,
  addLog: (text: string, type?: LogEntry['type']) => void,
  processEnemyTurn: (grid: CellData[][], player: Player) => void,
  grid: CellData[][]
): number => {
  const roll = rollD20();
  
  if (player.moves <= 0) {
    let newMoves = player.maxMoves;
    let type: LogEntry['type'] = 'rest';
    let msg = '';

    if (roll <= 5) {
      newMoves = Math.max(1, player.maxMoves - 2);
      type = 'fail';
      msg = `Тяжелый отдых (D20: ${roll}). Восстановлено только ${newMoves} шагов.`;
    } else if (roll >= 12) {
      newMoves = player.maxMoves + 2;
      type = 'success';
      msg = `Отличный привал (D20: ${roll})! Вы полны сил: ${newMoves} шагов.`;
    } else {
      msg = `Отдых (D20: ${roll}). Силы восстановлены: ${newMoves} шагов.`;
    }

    setPlayer({ ...player, moves: newMoves });
    addLog(msg, type);
    setTimeout(() => processEnemyTurn(grid, { ...player, moves: newMoves }), 500);
    return roll;
  }

  setActiveRoll(roll);
  
  let type: LogEntry['type'] = 'roll';
  if (roll <= 5) type = 'fail';
  if (roll >= 12) type = 'success';
  
  addLog(`🎲 Подготовка действия: ${roll}`, type);
  return roll;
};
