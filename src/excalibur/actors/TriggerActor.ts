import * as ex from 'excalibur';
import { PlayerActor } from './PlayerActor';
import { EventBridge } from '../utils/EventBridge';

export type TriggerType = 'bonfire' | 'trap' | 'lava' | 'merchant';

export interface TriggerConfig {
  x: number;
  y: number;
  type: TriggerType;
}

/**
 * TriggerActor - невидимая зона взаимодействия для особых тайлов
 *
 * Типы триггеров:
 * - bonfire: Останавливает игру, открывает PlayerMenu с опцией отдыха (HP/MP → max)
 * - trap: Фиксированный урон 15 HP (без D20)
 * - lava: Фиксированный урон 1 HP за касание
 * - merchant: Открывает ShopMenu
 */
export class TriggerActor extends ex.Actor {
  private triggerType: TriggerType;
  private hasTriggered = false; // Для предотвращения повторных срабатываний

  constructor(config: TriggerConfig) {
    super({
      pos: new ex.Vector(config.x * 32 + 16, config.y * 32 + 16), // Центр тайла
      width: 32,
      height: 32,
      collisionType: ex.CollisionType.Passive // Не блокирует движение
    });

    this.triggerType = config.type;
  }

  onInitialize(engine: ex.Engine): void {
    // Невидимая зона (opacity = 0)
    // Для дебага можно временно сделать полупрозрачной
    const debugMode = false;

    if (debugMode) {
      // Дебаг: показываем триггерные зоны полупрозрачными
      const colors: Record<TriggerType, string> = {
        bonfire: '#ff9800',   // Оранжевый
        trap: '#9c27b0',      // Фиолетовый
        lava: '#f44336',      // Красный
        merchant: '#ffeb3b'   // Желтый
      };

      const rect = new ex.Rectangle({
        width: 32,
        height: 32,
        color: ex.Color.fromHex(colors[this.triggerType])
      });

      this.graphics.use(rect);
      this.graphics.opacity = 0.5;
    } else {
      // Продакшн: полностью невидимые
      this.graphics.opacity = 0;
    }

    // Обработка столкновений с игроком
    this.on('collisionstart', (evt) => {
      if (evt.other instanceof PlayerActor) {
        this.onPlayerEnter(evt.other);
      }
    });

    this.on('collisionend', (evt) => {
      if (evt.other instanceof PlayerActor) {
        this.onPlayerExit();
      }
    });
  }

  private onPlayerEnter(player: PlayerActor): void {
    // Предотвращаем повторные срабатывания
    if (this.hasTriggered) return;
    this.hasTriggered = true;

    console.log(`TriggerActor: Player entered ${this.triggerType} trigger`);

    // Отправляем события в React через EventBridge
    switch (this.triggerType) {
      case 'bonfire':
        EventBridge.emitTriggerBonfire();
        console.log('Bonfire: Rest here to restore HP/MP');
        break;

      case 'trap':
        EventBridge.emitTriggerTrap(15);
        console.log('Trap: -15 HP damage!');
        break;

      case 'lava':
        EventBridge.emitTriggerLava(1);
        console.log('Lava: -1 HP damage!');
        break;

      case 'merchant':
        EventBridge.emitTriggerMerchant();
        console.log('Merchant: Shop opened');
        break;
    }
  }

  private onPlayerExit(): void {
    // Сбрасываем флаг, чтобы триггер мог сработать снова
    // Для ловушек/лавы это позволяет получать урон при повторном входе
    this.hasTriggered = false;
  }
}

export default TriggerActor;
