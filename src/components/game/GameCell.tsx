import React, { useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import type { CellData, GameMode, PotionType, WeaponType, ArmorType, ClassType, Direction } from '../../types';
import { CELL_SIZE, MONSTER_STATS, POTION_STATS, AGGRO_RADIUS, GEAR_STATS } from '../../constants';
import { calculateDistance } from '../../utils';
import {
  SPRITE_SIZE,
  SPRITE_SHEETS,
  TILE_SPRITES,
  ITEM_SPRITES,
  VOID_SPRITE,
  FLOOR_SPRITES,
  getSpritePosition,
  getWallSprite,
  getFloorSprite,
  getAnimatedEnemySprite,
  getAnimatedPlayerSprite,
  getDirectionalPlayerSprite,
  getAnimatedTorchSprite,
  getAnimatedTrapSprite,
  getAnimatedChestSprite,
  getAnimatedLavaSprite,
  getAnimatedWaterSprite,
  getAnimatedBonfireSprite,
  type SpritePosition,
  type NeighborInfo
} from '../../sprites';

interface GameCellProps {
  cell: CellData;
  grid: CellData[][];
  mode: GameMode;
  playerX: number;
  playerY: number;
  playerClass?: ClassType;
  playerDirection?: Direction;
  isMovingEnemy: { x: number; y: number } | null;
  onClick: (x: number, y: number) => void;
  animationFrame?: number;  // Текущий кадр анимации (0-3)
}

// Компонент спрайта - переиспользуемый
const Sprite: React.FC<{
  sprite: SpritePosition;
  className?: string;
  style?: React.CSSProperties;
}> = ({ sprite, className = '', style = {} }) => {
  // Маппинг sheet -> CSS класс
  const sheetClassMap: Record<string, string> = {
    tileset: 'sprite-tile',
    tileset_new: 'sprite-tileset_new',
    characters: 'sprite-character',
    items: 'sprite-item',
    items_rpg: 'sprite-items-rpg',
    items_sheet: 'sprite-items_sheet',
    // Анимированные
    torch_lit: 'sprite-torch_lit',
    torch_off: 'sprite-torch_off',
    trap: 'sprite-trap',
    chest: 'sprite-chest',
    lava: 'sprite-lava',
    water: 'sprite-water',
    grass: 'sprite-grass',
    bonfire: 'sprite-bonfire',
    // Старые персонажи
    skeleton1: 'sprite-skeleton1',
    skeleton2: 'sprite-skeleton2',
    skull: 'sprite-skull',
    vampire: 'sprite-vampire',
    warrior: 'sprite-warrior',
    mage: 'sprite-mage',
    rogue: 'sprite-rogue',
    // Герои с направленной анимацией
    hero_warrior: 'sprite-hero_warrior',
    hero_mage: 'sprite-hero_mage',
    hero_rogue: 'sprite-hero_rogue',
    // === НОВЫЕ ВРАГИ ===
    // Гоблины
    goblin_archer: 'sprite-goblin_archer',
    goblin_fanatic: 'sprite-goblin_fanatic',
    goblin_fighter: 'sprite-goblin_fighter',
    goblin_occultist: 'sprite-goblin_occultist',
    goblin_wolf_rider: 'sprite-goblin_wolf_rider',
    // Халфлинги
    halfling_assassin: 'sprite-halfling_assassin',
    halfling_bard: 'sprite-halfling_bard',
    halfling_ranger: 'sprite-halfling_ranger',
    halfling_rogue: 'sprite-halfling_rogue',
    halfling_slinger: 'sprite-halfling_slinger',
    // Ящеролюди
    bestial_lizardfolk: 'sprite-bestial_lizardfolk',
    lizardfolk_archer: 'sprite-lizardfolk_archer',
    lizardfolk_gladiator: 'sprite-lizardfolk_gladiator',
    lizardfolk_scout: 'sprite-lizardfolk_scout',
    lizardfolk_spearman: 'sprite-lizardfolk_spearman',
    // Гноллы
    gnoll_brute: 'sprite-gnoll_brute',
    gnoll_grunt: 'sprite-gnoll_grunt',
    gnoll_pikeman: 'sprite-gnoll_pikeman',
    gnoll_ripper: 'sprite-gnoll_ripper',
    gnoll_warlord: 'sprite-gnoll_warlord',
    // Гномы
    gnome_alchemist: 'sprite-gnome_alchemist',
    gnome_mage: 'sprite-gnome_mage',
    gnome_tinkerer: 'sprite-gnome_tinkerer',
    gnome_wanderer: 'sprite-gnome_wanderer',
    gnome_wizard: 'sprite-gnome_wizard',
    // Орки
    orc_captain: 'sprite-orc_captain',
    orc_reaver: 'sprite-orc_reaver',
    orc_savage: 'sprite-orc_savage',
    orc_shaman: 'sprite-orc_shaman',
    orc_warlock: 'sprite-orc_warlock',
  };
  const sheetClass = sheetClassMap[sprite.sheet] || 'sprite-item';

  return (
    <div
      className={`sprite ${sheetClass} ${className}`}
      style={{
        width: SPRITE_SIZE,
        height: SPRITE_SIZE,
        backgroundPosition: getSpritePosition(sprite),
        ...style
      }}
    />
  );
};

// Получить тип ячейки по координатам (с проверкой границ)
function getCellType(grid: CellData[][], x: number, y: number): string | null {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
    return null; // за границами = пустота
  }
  return grid[y][x].type;
}

// Проверить, является ли ячейка стеной
function isWall(cellType: string | null): boolean {
  return cellType === 'wall';
}

// Получить информацию о соседях для autotiling
function getNeighborInfo(grid: CellData[][], x: number, y: number): NeighborInfo {
  return {
    top: isWall(getCellType(grid, x, y - 1)),
    bottom: isWall(getCellType(grid, x, y + 1)),
    left: isWall(getCellType(grid, x - 1, y)),
    right: isWall(getCellType(grid, x + 1, y)),
    topLeft: isWall(getCellType(grid, x - 1, y - 1)),
    topRight: isWall(getCellType(grid, x + 1, y - 1)),
    bottomLeft: isWall(getCellType(grid, x - 1, y + 1)),
    bottomRight: isWall(getCellType(grid, x + 1, y + 1)),
  };
}

// Получить информацию о соседних стенах для пола
function getWallNeighborsForFloor(grid: CellData[][], x: number, y: number): NeighborInfo {
  return {
    top: isWall(getCellType(grid, x, y - 1)),
    bottom: isWall(getCellType(grid, x, y + 1)),
    left: isWall(getCellType(grid, x - 1, y)),
    right: isWall(getCellType(grid, x + 1, y)),
    topLeft: isWall(getCellType(grid, x - 1, y - 1)),
    topRight: isWall(getCellType(grid, x + 1, y - 1)),
    bottomLeft: isWall(getCellType(grid, x - 1, y + 1)),
    bottomRight: isWall(getCellType(grid, x + 1, y + 1)),
  };
}

// Кастомный компаратор для React.memo
function arePropsEqual(prevProps: GameCellProps, nextProps: GameCellProps): boolean {
  const prevCell = prevProps.cell;
  const nextCell = nextProps.cell;

  // Проверяем изменение кадра анимации для анимированных объектов
  // Если на ячейке есть враг, игрок, торговец, факелы, ловушки, вода, лава или костёр - перерендерить при смене кадра
  const needsAnimation =
    nextCell.enemy ||
    nextCell.type === 'torch_lit' ||
    nextCell.type === 'torch' ||
    nextCell.type === 'merchant' ||
    nextCell.type === 'trap' ||
    nextCell.type === 'water' ||
    nextCell.type === 'lava' ||
    nextCell.type === 'bonfire' ||
    nextCell.item === 'chest' ||
    (nextProps.playerX === nextCell.x && nextProps.playerY === nextCell.y);

  if (needsAnimation && prevProps.animationFrame !== nextProps.animationFrame) {
    return false;
  }

  // Проверяем изменение соседей для autotiling
  // Это важно для стен и полов
  if (prevCell.type === 'wall' || prevCell.type === 'floor' ||
      nextCell.type === 'wall' || nextCell.type === 'floor') {
    // Упрощённая проверка - если grid изменился, перерисовываем
    if (prevProps.grid !== nextProps.grid) return false;
  }

  if (nextProps.mode === 'dm') {
    if (prevProps.onClick !== nextProps.onClick) return false;
    if (prevCell.type !== nextCell.type) return false;
    if (prevCell.enemy !== nextCell.enemy) return false;
    if (prevCell.item !== nextCell.item) return false;

    const wasMoving = prevProps.isMovingEnemy?.x === prevCell.x && prevProps.isMovingEnemy?.y === prevCell.y;
    const isMoving = nextProps.isMovingEnemy?.x === nextCell.x && nextProps.isMovingEnemy?.y === nextCell.y;
    if (wasMoving !== isMoving) return false;

    if (prevProps.mode !== nextProps.mode) return false;
    return true;
  }

  if (prevProps.mode !== nextProps.mode) return false;
  if (prevCell.type !== nextCell.type) return false;
  if (prevCell.enemy !== nextCell.enemy) return false;
  if (prevCell.enemyHp !== nextCell.enemyHp) return false;
  if (prevCell.item !== nextCell.item) return false;
  if (prevCell.isVisible !== nextCell.isVisible) return false;
  if (prevCell.isRevealed !== nextCell.isRevealed) return false;
  if (prevProps.playerClass !== nextProps.playerClass) return false;

  if (prevProps.playerX !== nextProps.playerX || prevProps.playerY !== nextProps.playerY) {
    const wasPlayerHere = prevProps.playerX === prevCell.x && prevProps.playerY === prevCell.y;
    const isPlayerHere = nextProps.playerX === nextCell.x && nextProps.playerY === nextCell.y;
    if (wasPlayerHere || isPlayerHere) return false;

    if (nextCell.enemy) {
      const prevDist = calculateDistance(prevCell.x, prevCell.y, prevProps.playerX, prevProps.playerY);
      const nextDist = calculateDistance(nextCell.x, nextCell.y, nextProps.playerX, nextProps.playerY);
      const wasAggro = prevDist <= AGGRO_RADIUS;
      const isAggro = nextDist <= AGGRO_RADIUS;
      if (wasAggro !== isAggro) return false;
    }
  }

  return true;
}

export const GameCell: React.FC<GameCellProps> = React.memo(({
  cell, grid, mode, playerX, playerY, playerClass = 'warrior', playerDirection = 'down', isMovingEnemy, onClick, animationFrame = 0
}) => {
  const handleClick = useCallback(() => {
    onClick(cell.x, cell.y);
  }, [onClick, cell.x, cell.y]);

  // Неоткрытая ячейка в режиме игрока
  if (mode === 'player' && !cell.isRevealed) {
    return <div className="bg-black" style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
  }

  let content: React.ReactNode = null;
  let tooltip = '';

  // --- ЛОГИКА ВРАГОВ ---
  if (cell.enemy) {
    const info = MONSTER_STATS[cell.enemy];
    if (info) {
      tooltip = `${info.name} (HP: ${cell.enemyHp ?? info.hp}, ATK: ${info.atk})`;

      const dist = mode === 'player' ? calculateDistance(cell.x, cell.y, playerX, playerY) : 999;
      const isAggro = dist <= AGGRO_RADIUS && mode === 'player';

      // Используем новую систему анимации с отдельными спрайт-листами
      const enemySprite = getAnimatedEnemySprite(cell.enemy, animationFrame);

      content = (
        <div className="relative flex items-center justify-center">
          <Sprite sprite={enemySprite} />
          {isAggro && (
            <div className="absolute -top-1 -right-1 text-red-500 animate-bounce z-10">
              <AlertCircle size={8} fill="currentColor" />
            </div>
          )}
          {(cell.enemy === 'boss' || cell.enemy === 'lich' || cell.enemy === 'orc_chief') && (
            <div className="absolute inset-0 animate-pulse bg-red-500/20 rounded" />
          )}
        </div>
      );
    }
  }
  // --- ЛОГИКА ПРЕДМЕТОВ ---
  else if (cell.item) {
    const itemSprite = ITEM_SPRITES[cell.item];

    if (cell.item.includes('potion')) {
      const stats = POTION_STATS[cell.item as PotionType];
      if (stats) {
        tooltip = `${stats.name} (${stats.type === 'hp' ? 'HP' : 'MP'} +${stats.type === 'hp' ? stats.heal : stats.mana})`;
        content = itemSprite && <Sprite sprite={itemSprite} />;
      }
    } else if (cell.item.includes('weapon')) {
      const stats = GEAR_STATS[cell.item as WeaponType];
      if (stats) {
        tooltip = `${stats.name} (+${stats.val} ATK)`;
        content = itemSprite && <Sprite sprite={itemSprite} />;
      }
    } else if (cell.item.includes('armor')) {
      const stats = GEAR_STATS[cell.item as ArmorType];
      if (stats) {
        tooltip = `${stats.name} (+${stats.val} DEF)`;
        content = itemSprite && <Sprite sprite={itemSprite} />;
      }
    } else if (cell.item === 'chest') {
      tooltip = 'Сундук с сокровищами';
      // Анимированный сундук
      content = <Sprite sprite={getAnimatedChestSprite(animationFrame)} />;
    } else if (cell.item === 'gold') {
      tooltip = 'Золото';
      content = itemSprite && <Sprite sprite={itemSprite} />;
    }
  }

  // --- ИГРОК ---
  const isPlayerHere = playerX === cell.x && playerY === cell.y;
  if (isPlayerHere) {
    // Используем новую систему направленной анимации
    const playerSprite = getDirectionalPlayerSprite(playerClass, animationFrame, playerDirection);
    content = (
      <div className="relative flex items-center justify-center">
        <Sprite sprite={playerSprite} />
        <div className="absolute inset-0 shadow-[0_0_8px_rgba(59,130,246,0.6)] rounded" />
      </div>
    );
    tooltip = 'Это вы';
  }

  const isMovingThis = mode === 'dm' && isMovingEnemy?.x === cell.x && isMovingEnemy?.y === cell.y;

  // === AUTOTILING: выбор спрайта на основе соседей ===
  let tileSprite: SpritePosition;

  if (cell.type === 'wall') {
    const neighbors = getNeighborInfo(grid, cell.x, cell.y);
    // Проверяем, окружена ли стена только стенами (центральная/внутренняя)
    const allWalls = neighbors.top && neighbors.bottom && neighbors.left && neighbors.right;
    if (allWalls) {
      // Полностью окружена стенами - используем VOID (пустота за стенами)
      tileSprite = VOID_SPRITE;
    } else {
      tileSprite = getWallSprite(neighbors);
    }
  } else if (cell.type === 'floor' || cell.type === 'secret_door' ||
             cell.type === 'door_open' || cell.type === 'merchant') {
    // Для пола и подобных типов учитываем соседние стены для теней
    const wallNeighbors = getWallNeighborsForFloor(grid, cell.x, cell.y);
    tileSprite = getFloorSprite(wallNeighbors);
  } else if (cell.type === 'torch_lit' || cell.type === 'torch' || cell.type === 'grass' || cell.type === 'bonfire') {
    // Факелы, трава и костёр на полу - рендерим пол как базовый тайл
    const wallNeighbors = getWallNeighborsForFloor(grid, cell.x, cell.y);
    tileSprite = getFloorSprite(wallNeighbors);
  } else if (cell.type === 'trap') {
    // Пол под ловушкой
    const wallNeighbors = getWallNeighborsForFloor(grid, cell.x, cell.y);
    tileSprite = getFloorSprite(wallNeighbors);
  } else {
    // Для остальных типов используем прямой маппинг
    tileSprite = TILE_SPRITES[cell.type] || FLOOR_SPRITES.center;
  }

  const tileStyle: React.CSSProperties = {
    backgroundImage: `url(${SPRITE_SHEETS[tileSprite.sheet]})`,
    backgroundPosition: getSpritePosition(tileSprite),
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'auto',
    imageRendering: 'pixelated',
    // Отражаем лестницу вверх по горизонтали
    ...(cell.type === 'stairs_up' ? { transform: 'scaleX(-1)' } : {}),
  };

  // Дополнительные классы для особых типов
  const specialClasses = `
    ${(cell.type === 'secret_button' || cell.type === 'secret_button_activated') && mode === 'dm' && cell.isSecretTrigger === true ? 'ring-1 ring-green-500' : ''}
    ${(cell.type === 'secret_button' || cell.type === 'secret_button_activated') && mode === 'dm' && cell.isSecretTrigger === false ? 'ring-1 ring-red-500' : ''}
    ${isMovingThis ? 'ring-2 ring-blue-500 z-20' : ''}
  `;

  // Тултипы для интерактивных тайлов
  if (cell.type === 'door_open' && !tooltip) tooltip = 'Открытая дверь';
  if (cell.type === 'door' && !tooltip) tooltip = 'Закрытая дверь';
  if (cell.type === 'torch' && !tooltip) tooltip = 'Потухший факел';
  if (cell.type === 'torch_lit' && !tooltip) tooltip = 'Горящий факел';
  if (cell.type === 'merchant' && !tooltip) tooltip = 'Торговец — подойдите для торговли';
  if (cell.type === 'stairs_down' && !tooltip) tooltip = 'Лестница вниз';
  if (cell.type === 'stairs_up' && !tooltip) tooltip = 'Лестница вверх';
  if (cell.type === 'trap' && (mode === 'dm' || cell.isRevealed) && !tooltip) tooltip = 'Ловушка!';
  if (cell.type === 'bonfire' && !tooltip) tooltip = 'Костёр — отдохните, чтобы восстановить HP и MP';
  if (cell.type === 'secret_button' && mode === 'dm' && !tooltip) {
    tooltip = cell.isSecretTrigger === true ? 'Секретная кнопка (ОТКРЫВАЕТ комнату)' : 'Секретная кнопка (ложная)';
  }
  if (cell.type === 'secret_button_activated' && mode === 'dm' && !tooltip) {
    tooltip = cell.isSecretTrigger === true ? 'Активированная кнопка (открыла комнату)' : 'Активированная кнопка (была ложной)';
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-center select-none relative ${specialClasses}`}
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        ...tileStyle
      }}
      title={tooltip}
    >
      {content}

      {/* Торговец NPC поверх тайла merchant (с анимацией) */}
      {cell.type === 'merchant' && !content && (
        <Sprite
          sprite={getAnimatedPlayerSprite('warrior', animationFrame)}
          className="drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]"
        />
      )}

      {/* Двери поверх пола */}
      {cell.type === 'door' && !content && (
        <Sprite sprite={TILE_SPRITES.door} />
      )}
      {cell.type === 'door_open' && !content && (
        <Sprite sprite={TILE_SPRITES.door_open} />
      )}

      {/* Анимированная ловушка (только для DM или если раскрыта) */}
      {cell.type === 'trap' && (mode === 'dm' || cell.isRevealed) && !content && (
        <Sprite sprite={getAnimatedTrapSprite(animationFrame)} />
      )}

      {/* Жидкости */}
      {cell.type === 'lava' && !content && (
        <Sprite sprite={getAnimatedLavaSprite(animationFrame)} />
      )}
      {cell.type === 'water' && !content && (
        <Sprite sprite={getAnimatedWaterSprite(animationFrame)} className="water-filter" />
      )}
      {cell.type === 'grass' && !content && (
        <Sprite sprite={TILE_SPRITES.grass} />
      )}

      {/* Анимированные факелы поверх пола */}
      {cell.type === 'torch_lit' && !content && (
        <Sprite sprite={getAnimatedTorchSprite(animationFrame, true)} />
      )}
      {cell.type === 'torch' && !content && (
        <Sprite sprite={getAnimatedTorchSprite(animationFrame, false)} />
      )}

      {/* Анимированный костёр поверх пола */}
      {cell.type === 'bonfire' && !content && (
        <Sprite
          sprite={getAnimatedBonfireSprite(animationFrame)}
          className="drop-shadow-[0_0_6px_rgba(251,146,60,0.8)]"
        />
      )}

      {/* Туман войны */}
      {mode === 'player' && cell.isRevealed && !cell.isVisible && (
        <div className="absolute inset-0 bg-black/50 z-10" />
      )}
    </div>
  );
}, arePropsEqual);
