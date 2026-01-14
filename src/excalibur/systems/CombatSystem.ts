import type { PlayerActor } from '../actors/PlayerActor';
import { EventBridge } from '../utils/EventBridge';
import * as ex from 'excalibur';

/**
 * CombatSystem - система случайных боев (random encounters)
 *
 * Особенности:
 * - Враги невидимы на карте (pure random)
 * - 2% шанс боя каждую секунду ходьбы
 * - При бое: пауза Excalibur, открытие CombatMenu в React
 * - Выбор врага случайный из списка ENCOUNTER_ENEMIES
 */
export class CombatSystem {
  private player: PlayerActor;
  private timeSinceLastCheck = 0;
  private isInCombat = false;

  // Интервал проверки (мс)
  private readonly CHECK_INTERVAL = 1000; // Проверяем каждую секунду

  // Шанс встречи врага (%)
  private readonly ENCOUNTER_RATE = 2; // 2% = примерно 1 бой каждые 50 секунд ходьбы

  // Список возможных врагов для случайных встреч
  private readonly ENCOUNTER_ENEMIES = [
    'goblin',
    'skeleton',
    'orc',
    'lizardfolk_scout',
    'bandit',
    'wolf',
    'slime'
  ];

  constructor(player: PlayerActor) {
    this.player = player;
  }

  /**
   * Обновление системы (вызывается каждый кадр из WorldScene.onPreUpdate)
   */
  update(delta: number): void {
    // Если уже в бою - не проверяем
    if (this.isInCombat) return;

    // Проверяем, двигается ли игрок
    const isMoving = !this.player.vel.equals(ex.Vector.Zero);

    if (isMoving) {
      this.timeSinceLastCheck += delta;

      // Каждую секунду проверяем шанс встречи
      if (this.timeSinceLastCheck >= this.CHECK_INTERVAL) {
        this.checkEncounter();
        this.timeSinceLastCheck = 0;
      }
    } else {
      // Если игрок стоит - сбрасываем таймер
      this.timeSinceLastCheck = 0;
    }
  }

  /**
   * Проверяет шанс случайной встречи с врагом
   */
  private checkEncounter(): void {
    const roll = Math.random() * 100;

    if (roll < this.ENCOUNTER_RATE) {
      this.triggerEncounter();
    }
  }

  /**
   * Запускает случайную битву
   */
  private triggerEncounter(): void {
    // Выбираем случайного врага
    const enemy = this.getRandomEnemy();

    console.log(`CombatSystem: Random encounter! Enemy: ${enemy}`);

    // Останавливаем игрока
    this.player.vel = ex.Vector.Zero;

    // Отправляем событие в React
    EventBridge.emitCombatStart(enemy);

    // Помечаем, что бой начался
    this.isInCombat = true;
  }

  /**
   * Выбирает случайного врага из списка
   */
  private getRandomEnemy(): string {
    const index = Math.floor(Math.random() * this.ENCOUNTER_ENEMIES.length);
    return this.ENCOUNTER_ENEMIES[index];
  }

  /**
   * Завершает бой (вызывается из React после окончания боя)
   */
  endCombat(): void {
    console.log('CombatSystem: Combat ended');
    this.isInCombat = false;
    this.timeSinceLastCheck = 0;
  }

  /**
   * Проверяет, идёт ли сейчас бой
   */
  isInBattle(): boolean {
    return this.isInCombat;
  }
}

export default CombatSystem;
