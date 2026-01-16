import * as ex from 'excalibur';
import type { Direction, CellData } from '../../types';
import { TILE_CONFIG } from '../config/TileConfig';

interface PathNode {
  x: number;
  y: number;
  g: number;  // Cost from start
  h: number;  // Heuristic to goal
  f: number;  // Total cost (g + h)
  parent: PathNode | null;
}

/**
 * CatActor - Компаньон-кот с A* pathfinding
 * Следует за героиней на расстоянии 1-2 тайла
 */
export class CatActor extends ex.Actor {
  private speed = 100; // Немного медленнее героини
  private facing: Direction = 'down';
  private targetActor: ex.Actor | null = null;
  private path: { x: number; y: number }[] = [];
  private pathIndex = 0;
  private followDistance = 2; // Держать дистанцию в тайлах
  private recalculatePathTimer = 0;
  private recalculatePathInterval = 500; // ms между пересчетами пути
  private isFollowing = true;
  private gridData: CellData[][] | null = null;

  constructor(x: number, y: number) {
    super({
      pos: new ex.Vector(x, y),
      width: TILE_CONFIG.TILE_SIZE,
      height: TILE_CONFIG.TILE_SIZE,
      collisionType: ex.CollisionType.Active
    });

    // Collision group для кота
    try {
      this.body.group = ex.CollisionGroupManager.groupByName('cat') ||
                        ex.CollisionGroupManager.create('cat');
    } catch {
      this.body.group = ex.CollisionGroupManager.groupByName('cat')!;
    }
  }

  onInitialize(): void {
    // Фиолетовый квадрат для кота
    const rect = new ex.Rectangle({
      width: TILE_CONFIG.TILE_SIZE,
      height: TILE_CONFIG.TILE_SIZE,
      color: ex.Color.fromHex('#9c27b0') // Фиолетовый
    });

    this.graphics.use(rect);
  }

  /**
   * Установить актора для следования (героиню)
   */
  public setTarget(target: ex.Actor): void {
    this.targetActor = target;
  }

  /**
   * Обновить данные сетки для pathfinding
   */
  public setGridData(grid: CellData[][]): void {
    this.gridData = grid;
  }

  /**
   * Включить/выключить следование
   */
  public setFollowing(follow: boolean): void {
    this.isFollowing = follow;
    if (!follow) {
      this.vel = ex.Vector.Zero;
      this.path = [];
    }
  }

  onPreUpdate(_engine: ex.Engine, delta: number): void {
    if (!this.isFollowing || !this.targetActor) {
      return;
    }

    // Пересчитываем путь с интервалом
    this.recalculatePathTimer += delta;
    if (this.recalculatePathTimer >= this.recalculatePathInterval) {
      this.recalculatePathTimer = 0;
      this.calculatePathToTarget();
    }

    // Следуем по пути
    this.followPath();
  }

  private calculatePathToTarget(): void {
    if (!this.targetActor || !this.gridData) return;

    const tileSize = TILE_CONFIG.TILE_SIZE;
    const startX = Math.floor(this.pos.x / tileSize);
    const startY = Math.floor(this.pos.y / tileSize);
    const targetX = Math.floor(this.targetActor.pos.x / tileSize);
    const targetY = Math.floor(this.targetActor.pos.y / tileSize);

    // Проверка дистанции
    const dx = Math.abs(targetX - startX);
    const dy = Math.abs(targetY - startY);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Если уже достаточно близко - остаемся на месте
    if (distance <= this.followDistance) {
      this.vel = ex.Vector.Zero;
      this.path = [];
      return;
    }

    // Находим точку рядом с целью (не на самой цели)
    const goalX = targetX + (startX > targetX ? 1 : -1);
    const goalY = targetY + (startY > targetY ? 1 : -1);

    // A* pathfinding
    this.path = this.findPath(startX, startY, goalX, goalY);
    this.pathIndex = 0;
  }

  /**
   * A* Pathfinding алгоритм
   */
  private findPath(startX: number, startY: number, endX: number, endY: number): { x: number; y: number }[] {
    if (!this.gridData) return [];

    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    const gridHeight = this.gridData.length;
    const gridWidth = this.gridData[0]?.length || 0;

    // Проверяем границы
    if (startX < 0 || startX >= gridWidth || startY < 0 || startY >= gridHeight) return [];
    if (endX < 0 || endX >= gridWidth || endY < 0 || endY >= gridHeight) return [];

    const startNode: PathNode = {
      x: startX,
      y: startY,
      g: 0,
      h: this.heuristic(startX, startY, endX, endY),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);

    const directions = [
      { dx: 0, dy: -1 },  // up
      { dx: 0, dy: 1 },   // down
      { dx: -1, dy: 0 },  // left
      { dx: 1, dy: 0 },   // right
    ];

    let iterations = 0;
    const maxIterations = 1000; // Лимит для избежания зависания

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;

      // Находим узел с минимальным f
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;

      // Достигли цели
      if (current.x === endX && current.y === endY) {
        return this.reconstructPath(current);
      }

      closedSet.add(`${current.x},${current.y}`);

      // Проверяем соседей
      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        const key = `${nx},${ny}`;

        // Пропускаем если вне границ или уже посещен
        if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) continue;
        if (closedSet.has(key)) continue;

        // Проверяем проходимость
        const cell = this.gridData[ny]?.[nx];
        if (!cell || !this.isWalkable(cell)) continue;

        const gScore = current.g + 1;
        const existingNode = openSet.find(n => n.x === nx && n.y === ny);

        if (!existingNode) {
          const node: PathNode = {
            x: nx,
            y: ny,
            g: gScore,
            h: this.heuristic(nx, ny, endX, endY),
            f: 0,
            parent: current
          };
          node.f = node.g + node.h;
          openSet.push(node);
        } else if (gScore < existingNode.g) {
          existingNode.g = gScore;
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = current;
        }
      }
    }

    // Путь не найден
    return [];
  }

  private heuristic(x1: number, y1: number, x2: number, y2: number): number {
    // Manhattan distance
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  private reconstructPath(node: PathNode): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    let current: PathNode | null = node;

    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    // Убираем стартовую позицию
    if (path.length > 0) {
      path.shift();
    }

    return path;
  }

  private isWalkable(cell: CellData): boolean {
    const nonWalkableTypes = ['wall', 'water', 'lava'];
    return !nonWalkableTypes.includes(cell.type);
  }

  private followPath(): void {
    if (this.path.length === 0 || this.pathIndex >= this.path.length) {
      this.vel = ex.Vector.Zero;
      return;
    }

    const target = this.path[this.pathIndex];
    const tileSize = TILE_CONFIG.TILE_SIZE;
    const targetPos = new ex.Vector(
      target.x * tileSize + tileSize / 2,
      target.y * tileSize + tileSize / 2
    );

    const direction = targetPos.sub(this.pos);
    const distance = direction.distance();

    // Достигли текущей точки пути
    if (distance < 4) {
      this.pathIndex++;
      return;
    }

    // Двигаемся к точке
    const normalizedDir = direction.normalize();
    this.vel = normalizedDir.scale(this.speed);

    // Обновляем facing
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      this.facing = direction.x > 0 ? 'right' : 'left';
    } else {
      this.facing = direction.y > 0 ? 'down' : 'up';
    }
  }

  public getFacing(): Direction {
    return this.facing;
  }

  /**
   * Телепортировать кота к позиции
   */
  public teleportTo(x: number, y: number): void {
    const tileSize = TILE_CONFIG.TILE_SIZE;
    this.pos = new ex.Vector(
      x * tileSize + tileSize / 2,
      y * tileSize + tileSize / 2
    );
    this.path = [];
    this.pathIndex = 0;
  }

  /**
   * Получить текущую позицию в тайлах
   */
  public getTilePosition(): { x: number; y: number } {
    const tileSize = TILE_CONFIG.TILE_SIZE;
    return {
      x: Math.floor(this.pos.x / tileSize),
      y: Math.floor(this.pos.y / tileSize)
    };
  }
}

export default CatActor;
