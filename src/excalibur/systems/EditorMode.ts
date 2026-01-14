import * as ex from 'excalibur';
import { EventBridge } from '../utils/EventBridge';
import { TILE_CONFIG } from '../config/TileConfig';
import { getSpriteFromTileset } from '../resources/ImageSprites';
import { getTileMetadata } from '../config/TilesetConfig';

interface TileSelection {
  tilesetId: string;
  tileX: number;
  tileY: number;
}

interface BrushSize {
  width: number;
  height: number;
}

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
  private selectedTile: TileSelection | null = null;
  private brushSize: BrushSize = { width: 1, height: 1 }; // Размер кисти по умолчанию 1x1
  private isActive = false;
  private isMouseDown = false;
  private lastPanPosition: ex.Vector = ex.vec(0, 0);
  private readonly CAMERA_PAN_SPEED = 300; // Пиксели в секунду при нажатии клавиш

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
    // Левая кнопка мыши - размещение тайла или панорамирование (с пробелом)
    this.scene.input.pointers.primary.on('down', (evt) => {
      if (!this.isActive) return;
      this.isMouseDown = true;
      this.lastPanPosition = evt.screenPos.clone();

      const keyboard = this.scene.engine.input.keyboard;
      if (!keyboard.isHeld(ex.Keys.Space)) {
        // Только если пробел НЕ зажат - размещаем тайл
        this.handlePointerDown(evt);
      }
    });

    // Отпускание левой кнопки мыши
    this.scene.input.pointers.primary.on('up', () => {
      this.isMouseDown = false;
    });

    // Панорамирование: пробел + зажатая мышь
    this.scene.input.pointers.primary.on('move', (evt) => {
      if (!this.isActive || !this.isMouseDown) return;

      const keyboard = this.scene.engine.input.keyboard;
      if (keyboard.isHeld(ex.Keys.Space)) {
        // Режим панорамирования: пробел зажат
        const delta = evt.screenPos.sub(this.lastPanPosition);
        this.camera.pos = this.camera.pos.sub(delta);
        this.lastPanPosition = evt.screenPos.clone();
      } else {
        // Режим рисования
        this.handlePointerDown(evt);
      }
    });
  }

  /**
   * Обработка клика/движения с зажатой кнопкой мыши
   */
  private handlePointerDown(evt: ex.Input.PointerEvent): void {
    // Конвертируем экранные координаты в мировые
    const worldPos = this.camera.screenToWorld(evt.worldPos);

    // Конвертируем мировые координаты в координаты тайлов
    const tileX = Math.floor(worldPos.x / TILE_CONFIG.TILE_SIZE);
    const tileY = Math.floor(worldPos.y / TILE_CONFIG.TILE_SIZE);

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
   * Размещение тайла в указанных координатах с учетом размера кисти
   */
  private placeTile(x: number, y: number): void {
    if (!this.selectedTile) {
      console.warn('[EditorMode] No tile selected');
      return;
    }

    // Размещаем тайлы в области, определяемой размером кисти
    for (let dy = 0; dy < this.brushSize.height; dy++) {
      for (let dx = 0; dx < this.brushSize.width; dx++) {
        const targetX = x + dx;
        const targetY = y + dy;

        const tile = this.tileMap.getTile(targetX, targetY);
        if (!tile) continue; // Пропускаем, если тайл за пределами карты

        // Очищаем старую графику
        tile.clearGraphics();

        // Получаем спрайт из тайлсета
        const sprite = getSpriteFromTileset(
          this.selectedTile.tilesetId,
          this.selectedTile.tileX,
          this.selectedTile.tileY
        );

        if (sprite) {
          tile.addGraphic(sprite);

          // Получаем метаданные для определения проходимости и типа
          const metadata = getTileMetadata(
            this.selectedTile.tilesetId,
            this.selectedTile.tileX,
            this.selectedTile.tileY
          );

          if (metadata) {
            tile.solid = !metadata.passable;

            // Отправляем событие в React с координатами тайлсета
            EventBridge.emitTileChanged({
              x: targetX,
              y: targetY,
              type: metadata.type,
              tilesetX: this.selectedTile.tileX,
              tilesetY: this.selectedTile.tileY,
              tilesetSource: this.selectedTile.tilesetId
            });
          } else {
            // Если метаданные не найдены, используем дефолтные значения
            tile.solid = false;
          }
        }
      }
    }

    console.log(`[EditorMode] Placed ${this.brushSize.width}x${this.brushSize.height} tiles at (${x}, ${y})`);
  }

  /**
   * Устанавливает выбранный тайл из тайлсета
   */
  setSelectedTile(tilesetId: string, tileX: number, tileY: number): void {
    this.selectedTile = { tilesetId, tileX, tileY };

    const metadata = getTileMetadata(tilesetId, tileX, tileY);
    const tileName = metadata?.name || `(${tileX}, ${tileY})`;

    console.log(`[EditorMode] Selected tile: ${tileName} from ${tilesetId}`);
  }

  /**
   * Устанавливает размер кисти
   */
  setBrushSize(width: number, height: number): void {
    this.brushSize = { width, height };
    console.log(`[EditorMode] Brush size set to ${width}x${height}`);
  }

  /**
   * Обновление каждый кадр - панорамирование клавишами WASD
   */
  update(delta: number): void {
    if (!this.isActive) return;

    const keyboard = this.scene.engine.input.keyboard;
    const moveSpeed = (this.CAMERA_PAN_SPEED * delta) / 1000;

    // WASD или стрелки для панорамирования камеры
    if (keyboard.isHeld(ex.Keys.W) || keyboard.isHeld(ex.Keys.Up)) {
      this.camera.pos = this.camera.pos.add(ex.vec(0, -moveSpeed));
    }
    if (keyboard.isHeld(ex.Keys.S) || keyboard.isHeld(ex.Keys.Down)) {
      this.camera.pos = this.camera.pos.add(ex.vec(0, moveSpeed));
    }
    if (keyboard.isHeld(ex.Keys.A) || keyboard.isHeld(ex.Keys.Left)) {
      this.camera.pos = this.camera.pos.add(ex.vec(-moveSpeed, 0));
    }
    if (keyboard.isHeld(ex.Keys.D) || keyboard.isHeld(ex.Keys.Right)) {
      this.camera.pos = this.camera.pos.add(ex.vec(moveSpeed, 0));
    }
  }

  /**
   * Включает режим редактирования
   */
  enable(): void {
    this.isActive = true;
    // Переключаем камеру на свободное перемещение (отключаем следование за игроком)
    this.camera.clearAllStrategies();
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
