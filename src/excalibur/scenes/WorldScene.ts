import * as ex from 'excalibur';
import { PlayerActor } from '../actors/PlayerActor';
import { TriggerActor } from '../actors/TriggerActor';
import { CombatSystem } from '../systems/CombatSystem';
import { EditorMode } from '../systems/EditorMode';
import { MapLoader } from '../loaders/MapLoader';
import { TILE_CONFIG } from '../config/TileConfig';
import { preloadAllTilesets } from '../resources/ImageSprites';
import type { MapData } from '../loaders/MapLoader';
import type { CellType } from '../../types';

export class WorldScene extends ex.Scene {
  private player?: PlayerActor;
  private tileMap?: ex.TileMap;
  private combatSystem?: CombatSystem;
  private editorMode?: EditorMode;
  private isInitialized = false;

  async onInitialize(engine: ex.Engine): Promise<void> {
    // Защита от повторной инициализации
    if (this.isInitialized) {
      console.log('WorldScene: Already initialized, skipping');
      return;
    }

    console.log('WorldScene: Initializing...');

    try {
      // Предзагрузка тайлсетов
      console.log('WorldScene: Preloading tilesets...');
      await preloadAllTilesets();
      console.log('WorldScene: Tilesets preloaded');

      // Загружаем карту из JSON
      console.log('WorldScene: Loading map...');
      const mapData = await MapLoader.load('/maps/interdest_map.json');
      console.log(`WorldScene: Map loaded (${mapData.width}×${mapData.height})`);

      // Создаем TileMap
      this.tileMap = new ex.TileMap({
        rows: mapData.height,
        columns: mapData.width,
        tileWidth: TILE_CONFIG.TILE_SIZE,
        tileHeight: TILE_CONFIG.TILE_SIZE
      });

      // Заполняем TileMap placeholder спрайтами (асинхронно)
      await MapLoader.populateTileMap(this.tileMap, mapData);
      this.add(this.tileMap);

      // Находим стартовую позицию игрока
      const startPos = MapLoader.findPlayerStartPosition(mapData);
      console.log(`WorldScene: Player start position (${startPos.x}, ${startPos.y})`);

      // Создаем игрока в центре карты (pixel coordinates)
      this.player = new PlayerActor(startPos.x * TILE_CONFIG.TILE_SIZE, startPos.y * TILE_CONFIG.TILE_SIZE);
      this.add(this.player);

      // Камера следует за игроком
      this.camera.strategy.lockToActor(this.player);
      this.camera.zoom = 0.5; // Уменьшение zoom для увеличения видимой области (20×20 вместо 10×10)

      console.log('WorldScene: Initialized successfully');
      this.isInitialized = true;

      // Этап 3 - Добавление триггеров
      this.addTriggersFromMap(mapData);

      // Этап 5 - Random encounters
      this.combatSystem = new CombatSystem(this.player);
      console.log('WorldScene: CombatSystem initialized');

      // Этап 6 - EditorMode
      this.editorMode = new EditorMode(this, this.tileMap, this.camera);
      console.log('WorldScene: EditorMode initialized');
    } catch (error) {
      console.error('WorldScene: Failed to initialize:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Добавляет триггерные зоны из карты (костры, ловушки, лава, торговцы)
   */
  private addTriggersFromMap(mapData: MapData): void {
    const triggers = MapLoader.extractTriggers(mapData);
    console.log(`WorldScene: Adding ${triggers.length} triggers`);

    for (const trigger of triggers) {
      const triggerActor = new TriggerActor(trigger);
      this.add(triggerActor);
    }
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    // Обновляем систему случайных боев
    this.combatSystem?.update(delta);

    // Обновляем режим редактирования (для панорамирования WASD)
    this.editorMode?.update(delta);
  }

  /**
   * Возвращает систему боя (для управления из React)
   */
  getCombatSystem(): CombatSystem | undefined {
    return this.combatSystem;
  }

  /**
   * Возвращает игрока (для доступа из ExcaliburGame)
   */
  getPlayer(): PlayerActor | undefined {
    return this.player;
  }

  /**
   * Возвращает систему редактирования (для управления из React)
   */
  getEditorMode(): EditorMode | undefined {
    return this.editorMode;
  }
}

export default WorldScene;
