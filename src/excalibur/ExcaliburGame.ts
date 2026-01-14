import * as ex from 'excalibur';
import { WorldScene } from './scenes/WorldScene';

export class ExcaliburGame extends ex.Engine {
  private worldScene?: WorldScene;

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
    const worldScene = new WorldScene();
    this.addScene('world', worldScene);
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
   * Включает режим редактирования
   */
  enableEditorMode(): void {
    const worldScene = this.getWorldScene();
    const editorMode = worldScene?.getEditorMode();

    if (editorMode) {
      editorMode.enable();
      console.log('ExcaliburGame: Editor mode enabled');
    }
  }

  /**
   * Выключает режим редактирования
   */
  disableEditorMode(): void {
    const worldScene = this.getWorldScene();
    const editorMode = worldScene?.getEditorMode();

    if (editorMode) {
      editorMode.disable();
      console.log('ExcaliburGame: Editor mode disabled');
    }
  }

  /**
   * Устанавливает выбранный тайл из тайлсета в редакторе
   */
  setSelectedTile(tilesetId: string, tileX: number, tileY: number): void {
    const worldScene = this.getWorldScene();
    const editorMode = worldScene?.getEditorMode();

    if (editorMode) {
      editorMode.setSelectedTile(tilesetId, tileX, tileY);
      console.log(`ExcaliburGame: Selected tile (${tileX}, ${tileY}) from ${tilesetId}`);
    }
  }

  /**
   * Устанавливает размер кисти в редакторе
   */
  setBrushSize(width: number, height: number): void {
    const worldScene = this.getWorldScene();
    const editorMode = worldScene?.getEditorMode();

    if (editorMode) {
      editorMode.setBrushSize(width, height);
      console.log(`ExcaliburGame: Brush size set to ${width}x${height}`);
    }
  }
}

export default ExcaliburGame;
