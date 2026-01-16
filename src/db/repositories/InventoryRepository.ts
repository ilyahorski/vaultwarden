import { gameDB, type InventoryItem, type ItemCategory } from '../GameDatabase';

/**
 * Репозиторий для работы с инвентарем
 */
export class InventoryRepository {
  /**
   * Получить все предметы
   */
  static async getAll(): Promise<InventoryItem[]> {
    return gameDB.getInventory();
  }

  /**
   * Получить предметы по категории
   */
  static async getByCategory(category: ItemCategory): Promise<InventoryItem[]> {
    return gameDB.getInventoryByCategory(category);
  }

  /**
   * Получить предмет по слоту
   */
  static async getBySlot(slot: number): Promise<InventoryItem | undefined> {
    return gameDB.inventory.where('slot').equals(slot).first();
  }

  /**
   * Добавить предмет в инвентарь
   */
  static async addItem(
    itemType: string,
    category: ItemCategory,
    options: {
      stackable?: boolean;
      quantity?: number;
      questId?: string;
      description?: string;
    } = {}
  ): Promise<{ success: boolean; slot?: number; error?: string }> {
    // Проверяем, можно ли стакать
    if (options.stackable) {
      const existing = await gameDB.inventory
        .where('itemType')
        .equals(itemType)
        .first();

      if (existing?.id) {
        await gameDB.inventory.update(existing.id, {
          quantity: existing.quantity + (options.quantity || 1)
        });
        return { success: true, slot: existing.slot };
      }
    }

    // Ищем свободный слот
    const freeSlot = await gameDB.findFreeSlot();
    if (freeSlot === null) {
      return { success: false, error: 'Инвентарь полон (200/200)' };
    }

    // Добавляем предмет
    await gameDB.addToInventory({
      slot: freeSlot,
      itemType,
      category,
      stackable: options.stackable || false,
      quantity: options.quantity || 1,
      questId: options.questId,
      description: options.description
    });

    return { success: true, slot: freeSlot };
  }

  /**
   * Удалить предмет из слота
   */
  static async removeFromSlot(slot: number, quantity: number = 1): Promise<boolean> {
    const item = await this.getBySlot(slot);
    if (!item?.id) return false;

    if (item.quantity <= quantity) {
      await gameDB.inventory.delete(item.id);
    } else {
      await gameDB.inventory.update(item.id, {
        quantity: item.quantity - quantity
      });
    }

    return true;
  }

  /**
   * Переместить предмет в другой слот
   */
  static async moveToSlot(fromSlot: number, toSlot: number): Promise<boolean> {
    const sourceItem = await this.getBySlot(fromSlot);
    if (!sourceItem?.id) return false;

    const targetItem = await this.getBySlot(toSlot);

    if (targetItem?.id) {
      // Меняем слоты местами
      await gameDB.inventory.update(sourceItem.id, { slot: toSlot });
      await gameDB.inventory.update(targetItem.id, { slot: fromSlot });
    } else {
      // Просто перемещаем
      await gameDB.inventory.update(sourceItem.id, { slot: toSlot });
    }

    return true;
  }

  /**
   * Получить количество занятых слотов
   */
  static async getUsedSlots(): Promise<number> {
    return gameDB.inventory.count();
  }

  /**
   * Получить количество свободных слотов
   */
  static async getFreeSlots(): Promise<number> {
    const used = await this.getUsedSlots();
    return 200 - used;
  }

  /**
   * Проверить, есть ли предмет в инвентаре
   */
  static async hasItem(itemType: string): Promise<boolean> {
    const item = await gameDB.inventory
      .where('itemType')
      .equals(itemType)
      .first();
    return !!item;
  }

  /**
   * Получить количество предмета
   */
  static async getItemCount(itemType: string): Promise<number> {
    const items = await gameDB.inventory
      .where('itemType')
      .equals(itemType)
      .toArray();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Очистить весь инвентарь
   */
  static async clear(): Promise<void> {
    await gameDB.inventory.clear();
  }

  /**
   * Получить все квестовые предметы
   */
  static async getQuestItems(): Promise<InventoryItem[]> {
    return gameDB.inventory
      .where('category')
      .equals('quest')
      .toArray();
  }
}

export default InventoryRepository;
