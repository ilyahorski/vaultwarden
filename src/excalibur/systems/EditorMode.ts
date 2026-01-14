import * as ex from 'excalibur';
import { EventBridge } from '../utils/EventBridge';
import { getSharedSprite, SOLID_TILE_TYPES } from '../resources/PlaceholderSprites';
import type { CellType } from '../../types';

/**
 * EditorMode - система редактирования карты
 *
 * Особенности:
 * - Обработка кликов мыши на canvas
 * - Конвертация экранных координат → координаты тайлов
 * - Размещение выбранных тайлов из Sidebar
 * - Обновление графики и коллизий TileMap
 * - События в React для сохранения изменений
 */
export class EditorMode {
  private scene: ex.Scene;
  private tileMap: ex.TileMap;
  private camera: ex.Camera;
  private selectedTool: CellType = 'floor';
  private isActive = false;
  private isMouseDown = false;

  constructor(scene: ex.Scene, tileMap: ex.TileMap, camera: ex.Camera) {
    this.scene = scene;
    this.tileMap = tileMap;
    this.camera = camera;
    this.setupInput();
  }

  /**
   * Настройка обработчиков ввода
   */
  private setupInput(): void {
    // Клик мыши - размещение тайла
    this.scene.input.pointers.primary.on('down', (evt) => {
      if (!this.isActive) return;
      this.isMouseDown = true;
      this.handlePointerDown(evt);
    });

    // Отпускание мыши
    this.scene.input.pointers.primary.on('up', () => {
      this.isMouseDown = false;
    });

    // Перемещение мыши с зажатой кнопкой - "рисование"
    this.scene.input.pointers.primary.on('move', (evt) => {
      if (!this.isActive || !this.isMouseDown) return;
      this.handlePointerDown(evt);
    });
  }

  /**
   * Обработка клика/движения с зажатой кнопкой мыши
   */
  private handlePointerDown(evt: ex.Input.PointerEvent): void {
    // Конвертируем экранные координаты в мировые
    const worldPos = this.camera.screenToWorld(evt.worldPos);

    // Конвертируем мировые координаты в координаты тайлов
    const tileX = Math.floor(worldPos.x / 32);
    const tileY = Math.floor(worldPos.y / 32);

    // Проверяем границы карты
    if (tileX < 0 || tileY < 0 ||
        tileX >= this.tileMap.columns ||
        tileY >= this.tileMap.rows) {
      return;
    }

    // Размещаем тайл
    this.placeTile(tileX, tileY);
  }

  /**
   * Размещение тайла в указанных координатах
   */
  private placeTile(x: number, y: number): void {
    const tile = this.tileMap.getTile(x, y);
    if (!tile) return;

    // Очищаем старую графику
    tile.clearGraphics();

    // Добавляем новый спрайт
    const sprite = getSharedSprite(this.selectedTool);
    tile.addGraphic(sprite);

    // Обновляем коллизию
    tile.solid = SOLID_TILE_TYPES.has(this.selectedTool);

    console.log(`[EditorMode] Placed ${this.selectedTool} at (${x}, ${y})`);

    // Отправляем событие в React для синхронизации state
    EventBridge.emitTileChanged({
      x,
      y,
      type: this.selectedTool
    });
  }

  /**
   * Устанавливает текущий инструмент (тип тайла)
   */
  setTool(tool: CellType): void {
    this.selectedTool = tool;
    console.log(`[EditorMode] Tool selected: ${tool}`);
  }

  /**
   * Включает режим редактирования
   */
  enable(): void {
    this.isActive = true;
    console.log('[EditorMode] Enabled');
  }

  /**
   * Выключает режим редактирования
   */
  disable(): void {
    this.isActive = false;
    this.isMouseDown = false;
    console.log('[EditorMode] Disabled');
  }

  /**
   * Проверяет, активен ли режим редактирования
   */
  isEnabled(): boolean {
    return this.isActive;
  }
}

export default EditorMode;
