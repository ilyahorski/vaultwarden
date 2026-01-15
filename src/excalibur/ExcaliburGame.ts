import * as ex from 'excalibur';
import { WorldScene } from './scenes/WorldScene';

export class ExcaliburGame extends ex.Engine {
  private worldScene?: WorldScene;
  private editorModeRequested = false; // Флаг, если enableEditorMode был вызван до готовности сцены

  constructor(options: { canvasElementId: string }) {
    super({
      canvasElementId: options.canvasElementId,
      width: 800,
      height: 600,
      pixelArt: true,
      displayMode: ex.DisplayMode.FitScreen,
      backgroundColor: ex.Color.Black,
      antialiasing: false,
      snapToPixel: true
    });
  }

  async initialize(): Promise<void> {
    console.log('ExcaliburGame: Initializing...');

    // Создаем loader с кастомным текстом загрузки
    const loader = new ex.Loader([]);
    loader.logo = ''; // Убираем логотип Excalibur
    loader.logoWidth = 0;
    loader.logoHeight = 0;
    loader.loadingBarColor = ex.Color.fromHex('#2196f3');
    loader.loadingBarPosition = ex.vec(0, 200);

    // Запускаем engine
    await this.start(loader);

    console.log('ExcaliburGame: Engine started');

    // Создаем и добавляем сцену мировой карты
    this.worldScene = new WorldScene();
    this.addScene('world', this.worldScene);

    // Слушаем событие готовности сцены
    this.worldScene.on('scene:ready', () => {
      console.log('ExcaliburGame: Received scene:ready event');

      // Если enableEditorMode был вызван до готовности сцены, активируем его сейчас
      if (this.editorModeRequested) {
        console.log('ExcaliburGame: Editor mode was requested early, enabling now');
        this.enableEditorModeInternal();
      }
    });

    this.goToScene('world');

    console.log('ExcaliburGame: Initialized successfully');
  }

  /**
   * Возвращает активную сцену мира
   */
  getWorldScene(): WorldScene | null {
    const scene = this.scenes.world;
    return scene instanceof WorldScene ? scene : null;
  }

  /**
   * Завершает текущий бой (вызывается из React после победы/поражения)
   */
  endCombat(): void {
    const worldScene = this.getWorldScene();
    const combatSystem = worldScene?.getCombatSystem();

    if (combatSystem) {
      combatSystem.endCombat();
      console.log('ExcaliburGame: Combat ended, resuming game');
    }
  }

  /**
   * Проверяет, на паузе ли игра
   */
  isGamePaused(): boolean {
    return this.clock.isPaused();
  }

  /**
   * Включает режим редактирования (публичный метод, вызываемый из React)
   */
  enableEditorMode(): void {
    console.log('ExcaliburGame: enableEditorMode called');
    this.editorModeRequested = true;

    const worldScene = this.getWorldScene();
    console.log('ExcaliburGame: worldScene =', worldScene);
    const editorMode = worldScene?.getEditorMode();
    console.log('ExcaliburGame: editorMode =', editorMode);

    if (editorMode) {
      // Сцена готова, можем сразу включить режим редактирования
      this.enableEditorModeInternal();
    } else {
      console.log('ExcaliburGame: Scene not ready yet, will enable editor mode after scene:ready event');
    }
  }

  /**
   * Внутренний метод для активации режима редактирования (только когда сцена готова)
   */
  private enableEditorModeInternal(): void {
    console.log('ExcaliburGame: enableEditorModeInternal called');
    const worldScene = this.getWorldScene();
    const editorMode = worldScene?.getEditorMode();

    if (editorMode) {
      editorMode.enable();
      console.log('ExcaliburGame: Editor mode enabled successfully');
    } else {
      console.error('ExcaliburGame: CRITICAL - Cannot enable editor mode, editorMode still not found');
    }
  }

  /**
   * Выключает режим редактирования
   */
  disableEditorMode(): void {
    console.log('ExcaliburGame: disableEditorMode called');
    this.editorModeRequested = false;

    const worldScene = this.getWorldScene();
    const editorMode = worldScene?.getEditorMode();

    if (editorMode) {
      editorMode.disable();
      console.log('ExcaliburGame: Editor mode disabled');
    }
  }

  /**
   * Устанавливает выбранные тайлы из тайлсета в редакторе
   */
  setSelectedTiles(
    tilesetId: string,
    tiles: Array<{ x: number; y: number }>
  ): void {
    const worldScene = this.getWorldScene();
    const editorMode = worldScene?.getEditorMode();

    if (editorMode) {
      editorMode.setSelectedTiles(tilesetId, tiles);
      console.log(`ExcaliburGame: Selected ${tiles.length} tiles from ${tilesetId}`);
    }
  }

}


export default ExcaliburGame;
