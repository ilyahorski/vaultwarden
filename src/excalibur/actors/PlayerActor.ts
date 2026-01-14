import * as ex from 'excalibur';
import type { Direction } from '../../types';
import { EventBridge } from '../utils/EventBridge';

export class PlayerActor extends ex.Actor {
  private speed = 120; // pixels per second
  private facing: Direction = 'down';
  private lastTileX = -1;
  private lastTileY = -1;

  constructor(x: number, y: number) {
    super({
      pos: new ex.Vector(x, y),
      width: 32,
      height: 32,
      collisionType: ex.CollisionType.Active
    });

    // Используем глобальную collision group или создаем новую
    // Это безопасно для React StrictMode (двойной монтаж)
    try {
      this.body.group = ex.CollisionGroupManager.groupByName('player') ||
                        ex.CollisionGroupManager.create('player');
    } catch (e) {
      // Группа уже существует, используем её
      this.body.group = ex.CollisionGroupManager.groupByName('player')!;
    }
  }

  onInitialize(engine: ex.Engine): void {
    // Создаем placeholder спрайт (синий квадрат 32×32)
    const rect = new ex.Rectangle({
      width: 32,
      height: 32,
      color: ex.Color.fromHex('#2196f3') // Синий
    });

    this.graphics.use(rect);
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    this.handleInput(engine.input.keyboard);

    // Отправляем события в React при смене тайла
    const currentTileX = Math.floor(this.pos.x / 32);
    const currentTileY = Math.floor(this.pos.y / 32);

    if (currentTileX !== this.lastTileX || currentTileY !== this.lastTileY) {
      this.lastTileX = currentTileX;
      this.lastTileY = currentTileY;

      EventBridge.emitPlayerMove({
        x: currentTileX,
        y: currentTileY,
        facing: this.facing
      });
    }
  }

  private handleInput(keyboard: ex.Input.Keyboard): void {
    let vel = ex.Vector.Zero;

    // WASD движение
    if (keyboard.isHeld(ex.Keys.W) || keyboard.isHeld(ex.Keys.Up)) {
      vel.y = -this.speed;
      this.facing = 'up';
    }
    if (keyboard.isHeld(ex.Keys.S) || keyboard.isHeld(ex.Keys.Down)) {
      vel.y = this.speed;
      this.facing = 'down';
    }
    if (keyboard.isHeld(ex.Keys.A) || keyboard.isHeld(ex.Keys.Left)) {
      vel.x = -this.speed;
      this.facing = 'left';
    }
    if (keyboard.isHeld(ex.Keys.D) || keyboard.isHeld(ex.Keys.Right)) {
      vel.x = this.speed;
      this.facing = 'right';
    }

    // Нормализуем диагональное движение
    if (vel.x !== 0 && vel.y !== 0) {
      vel = vel.normalize().scale(this.speed);
    }

    this.vel = vel;
  }

  public getFacing(): Direction {
    return this.facing;
  }
}

export default PlayerActor;
