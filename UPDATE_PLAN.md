Обзор
Миграция от roguelike к сюжетной RPG с фиксированной картой 405×302, системой дуэта персонажей и механикой манипуляции временем.

Фаза 1: Data Layer (Dexie.js)
Приоритет: КРИТИЧЕСКИЙ

Задачи:
Установить Dexie.js: npm install dexie
Создать src/db/GameDatabase.ts:
Таблица worldState (405×302 тайлов)
Таблица inventory (200 слотов)
Таблица storyFlags (флаги сюжета)
Таблица characters (Героиня + Кот)
Таблица timeLayerCache (Past/Present/Future)
Создать src/db/repositories/ для CRUD операций
Удалить логику localStorage из useGameState.ts
Критические файлы:
useGameState.ts - строки 39-68 (localStorage), 211-239 (save)
Фаза 2: Duo Character System
Приоритет: ВЫСОКИЙ

Задачи:
Обновить src/types/index.ts:

УДАЛИТЬ: ClassType = 'warrior' | 'mage' | 'rogue' (строка 87)
УДАЛИТЬ: ClassData interface (строки 103-117)
ДОБАВИТЬ: HeroStats (Героиня - Physical/Tools)
ДОБАВИТЬ: CatStats (Кот - Magic/Lore)
ДОБАВИТЬ: DuoParty interface
Обновить src/constants/index.ts:

УДАЛИТЬ: объект CLASSES (warrior/mage/rogue)
ДОБАВИТЬ: INITIAL_HERO и INITIAL_CAT
Рефакторить useGameState.ts:

УДАЛИТЬ: selectClass() (строки 416-462)
ДОБАВИТЬ: initializeParty(heroName, catName)
Заменить ClassSelection.tsx на PartyCreation.tsx

Реализовать Follower AI для Кота:

Создать src/excalibur/actors/CatActor.ts
A* pathfinding для следования за героиней
В бою: переключение активного персонажа
Критические файлы:
types/index.ts - строки 87, 103-117, 149-171
constants/index.ts - CLASSES объект
useGameState.ts - selectClass()
ClassSelection.tsx - полная замена
Фаза 3: Inventory 2.0
Приоритет: СРЕДНИЙ

Задачи:
Обновить src/types/index.ts:


type ItemCategory = 'weapon' | 'scroll' | 'clothing' | 'food' | 'quest';

interface InventoryItem {
  id: string;
  type: ItemType;
  category: ItemCategory;
  stackable: boolean;
  quantity: number;
  slot: number;  // 0-199
}
Обновить src/constants/index.ts:

MAX_INVENTORY_SIZE = 200 (было 100)
Добавить ITEM_CATEGORIES маппинг
Создать src/components/game/InventoryGrid.tsx:

Сетка 20×10 для 200 слотов
Фильтры по категориям
Drag-and-drop перемещение
Критические файлы:
constants/index.ts - MAX_INVENTORY_SIZE (строка ~11)
types/index.ts - ItemType, Player.inventory
Фаза 4: Visual Metadata Editor
Приоритет: СРЕДНИЙ

Задачи:
Расширить TilesetConfig.ts:


interface TilesetTileMetadata {
  // существующие поля...
  timeLayer?: TimeLayer;           // past/present/future
  entitySpawnPoint?: boolean;      // точка спавна NPC
  triggers?: TriggerType[];        // триггеры событий
}
Добавить Inspector в TilesetPicker.tsx:

Правый клик на тайл → панель редактирования
Редактирование: passable, type, category, timeLayer
Добавить Logic Brush в EditorMode.ts:


type BrushMode = 'tile' | 'passability' | 'trigger' | 'entity';

setPassabilityBrush(passable: boolean): void
setTriggerBrush(trigger: TriggerType): void
Создать EntityPlacer.tsx:

UI для размещения NPC/Enemies как Actors
При клике записывает entityId в CellData
Критические файлы:
TilesetConfig.ts
TilesetPicker.tsx
EditorMode.ts
Фаза 5: Time-Shift Engine (Редактор)
Приоритет: СРЕДНИЙ

Задачи:
Расширить CellData в types/index.ts:


interface CellData {
  // существующие поля...
  timeVariants?: {
    past?: TileVariant;
    present?: TileVariant;
    future?: TileVariant;
  };
}
Добавить переключатель слоев в редактор:

UI: кнопки Past/Present/Future
При переключении: показывать/редактировать соответствующий слой
Создать TimeShiftSystem.ts:


class TimeShiftSystem {
  currentLayer: TimeLayer = 'present';

  async shiftTo(layer: TimeLayer): Promise<void> {
    // 1. Сохранить текущее состояние
    // 2. Загрузить данные нового слоя
    // 3. Обновить спрайты TileMap
    // 4. Пересчитать коллизии
  }
}
Критические файлы:
types/index.ts - CellData
WorldScene.ts
Фаза 6: Fixed World Map
Приоритет: НИЗКИЙ

Задачи:
Обновить useGameState.ts:

Удалить процедурную генерацию для level 1
Загрузка карты 405×302 из IndexedDB
Создать worldMapInitializer.ts:

Первичная загрузка JSON → IndexedDB
Запускается один раз при новой игре
Критические файлы:
useGameState.ts - generateDungeon() строки 242-361
Новые файлы для создания

src/
├── db/
│   ├── GameDatabase.ts
│   └── repositories/
│       ├── WorldRepository.ts
│       ├── InventoryRepository.ts
│       └── StoryFlagRepository.ts
├── types/
│   ├── characters.ts         # HeroStats, CatStats, DuoParty
│   ├── inventory.ts          # InventoryItem, ItemCategory
│   └── timeshift.ts          # TimeLayer, TileVariant
├── excalibur/
│   ├── actors/CatActor.ts    # Кот с A* pathfinding
│   └── systems/TimeShiftSystem.ts
├── components/
│   ├── game/
│   │   ├── PartyCreation.tsx
│   │   ├── InventoryGrid.tsx
│   │   └── CharacterSwitcher.tsx
│   └── editor/
│       ├── TileInspector.tsx
│       ├── EntityPlacer.tsx
│       └── LogicBrushPanel.tsx
└── utils/
    └── worldMapInitializer.ts
Порядок выполнения
Фаза 1 (Dexie.js) - база для всего остального
Фаза 2 (Duo System) - ядро нового геймплея
Фаза 3 (Inventory) - зависит от Фазы 2
Фаза 4 (Visual Metadata) - параллельно с Фазой 3
Фаза 5 (Time-Shift Editor) - зависит от Фазы 4
Фаза 6 (Fixed Map) - финальная интеграция
Верификация
После каждой фазы:

Запустить npm run build - проверка TypeScript ошибок

Запустить npm run lint - проверка ESLint

Ручное тестирование:

Фаза 1: Открыть DevTools → Application → IndexedDB → проверить таблицы
Фаза 2: Создать новую игру → проверить Героиню и Кота на карте
Фаза 3: Открыть инвентарь → проверить 200 слотов и категории
Фаза 4: Редактор → Inspector на тайле → редактирование свойств
Фаза 5: Редактор → переключение Past/Present/Future
Фаза 6: Новая игра → загрузка фиксированной карты
Обновить ROADMAP.md после успешного тестирования каждой фазы