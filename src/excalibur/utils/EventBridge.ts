/**
 * EventBridge - двунаправленная связь между React и Excalibur
 *
 * Использует нативный EventTarget API браузера для совместимости
 *
 * События Excalibur → React:
 * - player:move - обновление позиции игрока
 * - trigger:bonfire - игрок вошел в зону костра
 * - trigger:trap - игрок попал в ловушку (урон)
 * - trigger:lava - игрок коснулся лавы (урон)
 * - trigger:merchant - игрок встретил торговца
 * - combat:start - начало случайного боя
 *
 * События React → Excalibur:
 * - game:pause - пауза игры (открыто меню или бой)
 * - game:resume - возобновление игры (меню закрыто)
 */
// Тип для callback функций в EventBridge
type EventCallback<T = unknown> = (data: T) => void;

class ExcaliburEventBridge extends EventTarget {
  // Кэш обработчиков для корректной работы removeEventListener
  private listenerMap = new WeakMap<EventCallback, EventListener>();

  // Excalibur → React: движение игрока
  emitPlayerMove(data: { x: number; y: number; facing: string }): void {
    this.dispatchEvent(new CustomEvent("player:move", { detail: data }));
  }

  // Excalibur → React: триггеры
  emitTriggerBonfire(): void {
    this.dispatchEvent(new CustomEvent("trigger:bonfire"));
  }

  emitTriggerTrap(damage: number): void {
    this.dispatchEvent(new CustomEvent("trigger:trap", { detail: { damage } }));
  }

  emitTriggerLava(damage: number): void {
    this.dispatchEvent(new CustomEvent("trigger:lava", { detail: { damage } }));
  }

  emitTriggerMerchant(): void {
    this.dispatchEvent(new CustomEvent("trigger:merchant"));
  }

  // Excalibur → React: случайный бой
  emitCombatStart(enemy: string): void {
    this.dispatchEvent(new CustomEvent("combat:start", { detail: { enemy } }));
  }

  // Исправлено: добавлены tilesetX/Y для корректной передачи метаданных
  emitTileChanged(data: {
    x: number;
    y: number;
    type: string;
    tilesetX?: number;
    tilesetY?: number;
    tilesetSource?: string;
  }): void {
    this.dispatchEvent(new CustomEvent("tile:changed", { detail: data }));
  }

  emitTilesetTileSelected(data: {
    tilesetId: string;
    tiles: Array<{ x: number; y: number }>;
  }): void {
    this.dispatchEvent(
      new CustomEvent("tileset:tileSelected", { detail: data })
    );
  }

  // Добавлено: метод для изменения размера кисти
  emitBrushSizeChanged(width: number, height: number): void {
    this.dispatchEvent(
      new CustomEvent("brush:sizeChanged", { detail: { width, height } })
    );
  }

  // React → Excalibur: управление игрой
  pauseGame(): void {
    this.dispatchEvent(new CustomEvent("game:pause"));
  }

  resumeGame(): void {
    this.dispatchEvent(new CustomEvent("game:resume"));
  }

  // Генерический emit для произвольных событий
  emit<T = unknown>(event: string, data?: T): void {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  // Совместимость с EventEmitter API для удобства
  on<T = unknown>(event: string, callback: EventCallback<T>): void {
    // Создаём обёртку для callback, которая извлекает detail из CustomEvent
    const wrappedListener: EventListener = (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail);
    };

    // Сохраняем обёртку для корректной работы off()
    this.listenerMap.set(callback as EventCallback, wrappedListener);

    this.addEventListener(event, wrappedListener);
  }

  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    // Получаем сохранённую обёртку
    const wrappedListener = this.listenerMap.get(callback as EventCallback);
    if (wrappedListener) {
      this.removeEventListener(event, wrappedListener);
      this.listenerMap.delete(callback as EventCallback);
    }
  }
}

export const EventBridge = new ExcaliburEventBridge();
export default EventBridge;
