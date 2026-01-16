import { gameDB, type StoryFlag } from '../GameDatabase';

/**
 * Репозиторий для работы с флагами сюжета
 */
export class StoryFlagRepository {
  /**
   * Получить значение флага
   */
  static async get(key: string): Promise<boolean | number | string | undefined> {
    return gameDB.getStoryFlag(key);
  }

  /**
   * Получить булевый флаг (по умолчанию false)
   */
  static async getBool(key: string): Promise<boolean> {
    const value = await gameDB.getStoryFlag(key);
    return value === true;
  }

  /**
   * Получить числовой флаг (по умолчанию 0)
   */
  static async getNumber(key: string): Promise<number> {
    const value = await gameDB.getStoryFlag(key);
    return typeof value === 'number' ? value : 0;
  }

  /**
   * Получить строковый флаг
   */
  static async getString(key: string): Promise<string | undefined> {
    const value = await gameDB.getStoryFlag(key);
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Установить значение флага
   */
  static async set(key: string, value: boolean | number | string): Promise<void> {
    await gameDB.setStoryFlag(key, value);
  }

  /**
   * Инкрементировать числовой флаг
   */
  static async increment(key: string, amount: number = 1): Promise<number> {
    const current = await this.getNumber(key);
    const newValue = current + amount;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Переключить булевый флаг
   */
  static async toggle(key: string): Promise<boolean> {
    const current = await this.getBool(key);
    const newValue = !current;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Проверить множество флагов одновременно
   */
  static async checkAll(keys: string[]): Promise<boolean> {
    for (const key of keys) {
      if (!(await this.getBool(key))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Проверить любой из флагов
   */
  static async checkAny(keys: string[]): Promise<boolean> {
    for (const key of keys) {
      if (await this.getBool(key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Получить все флаги
   */
  static async getAll(): Promise<StoryFlag[]> {
    return gameDB.storyFlags.toArray();
  }

  /**
   * Получить флаги по паттерну (для группировки, например 'quest_*')
   */
  static async getByPattern(pattern: string): Promise<StoryFlag[]> {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    const all = await this.getAll();
    return all.filter(flag => regex.test(flag.key));
  }

  /**
   * Удалить флаг
   */
  static async delete(key: string): Promise<void> {
    const flag = await gameDB.storyFlags.where('key').equals(key).first();
    if (flag?.id) {
      await gameDB.storyFlags.delete(flag.id);
    }
  }

  /**
   * Очистить все флаги (новая игра)
   */
  static async clear(): Promise<void> {
    await gameDB.storyFlags.clear();
  }

  // --- Предустановленные флаги сюжета ---

  /** Встретил ли кот героиню */
  static async hasMeetCat(): Promise<boolean> {
    return this.getBool('story_met_cat');
  }

  static async setMeetCat(): Promise<void> {
    await this.set('story_met_cat', true);
  }

  /** Собранные эссенции времени */
  static async getCollectedEssences(): Promise<number> {
    return this.getNumber('essences_collected');
  }

  static async collectEssence(type: 'past' | 'present' | 'future'): Promise<void> {
    await this.set(`essence_${type}`, true);
    await this.increment('essences_collected');
  }

  static async hasEssence(type: 'past' | 'present' | 'future'): Promise<boolean> {
    return this.getBool(`essence_${type}`);
  }

  /** Текущий слой времени */
  static async getCurrentTimeLayer(): Promise<'past' | 'present' | 'future'> {
    const value = await this.getString('current_time_layer');
    return (value as 'past' | 'present' | 'future') || 'present';
  }

  static async setCurrentTimeLayer(layer: 'past' | 'present' | 'future'): Promise<void> {
    await this.set('current_time_layer', layer);
  }
}

export default StoryFlagRepository;
