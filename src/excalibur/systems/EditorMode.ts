import * as ex from "excalibur";
import { EventBridge } from "../utils/EventBridge";
import { TILE_CONFIG } from "../config/TileConfig";
import { getSpriteFromTileset } from "../resources/ImageSprites";
import { getTileMetadata } from "../config/TilesetConfig";

interface TileSelection {
  tilesetId: string;
  tiles: Array<{
    x: number; // Координата в атласе
    y: number; // Координата в атласе
    offsetX: number; // Смещение от начала выделения
    offsetY: number; // Смещение от начала выделения
  }>;
}

/**
 * EditorMode - система редактирования карты
 *
 * Особенности:
 * - Обработка кликов мыши на canvas
 * - Конвертация экранных координат → координаты тайлов
 * - Размещение выбранных тайлов из Sidebar (с поддержкой мульти-выделения)
 * - Обновление графики и коллизий TileMap
 * - События в React для сохранения изменений
 */
export class EditorMode {
  private scene: ex.Scene;
  private tileMap: ex.TileMap;
  private camera: ex.Camera;
  private selectedTiles: TileSelection | null = null;
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
    this.scene.input.pointers.primary.on("down", (evt) => {
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
    this.scene.input.pointers.primary.on("up", () => {
      this.isMouseDown = false;
    });

    // Панорамирование: пробел + зажатая мышь
    this.scene.input.pointers.primary.on("move", (evt) => {
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
    // ИСПРАВЛЕНО: worldPos в Excalibur уже содержит мировые координаты,
    // повторный вызов screenToWorld не требуется и ломает расчет
    const worldPos = evt.worldPos;

    const tileX = Math.floor(worldPos.x / TILE_CONFIG.TILE_SIZE);
    const tileY = Math.floor(worldPos.y / TILE_CONFIG.TILE_SIZE);

    if (
      tileX < 0 ||
      tileY < 0 ||
      tileX >= this.tileMap.columns ||
      tileY >= this.tileMap.rows
    ) {
      return;
    }

    this.placeTile(tileX, tileY);
  }

  private placeTile(x: number, y: number): void {
    if (!this.selectedTiles || this.selectedTiles.tiles.length === 0) {
      console.warn('[EditorMode] Cannot place tile: no tiles selected');
      return;
    }

    console.log(`[EditorMode] Placing ${this.selectedTiles.tiles.length} tiles at (${x}, ${y})`);
    console.log('[EditorMode] selectedTiles structure:', JSON.stringify(this.selectedTiles, null, 2));

    // Размещаем каждый выбранный тайл с учетом его смещения
    for (const tileInfo of this.selectedTiles.tiles) {
      console.log('[EditorMode] Processing tileInfo:', tileInfo, 'keys:', Object.keys(tileInfo));

      const targetX = x + tileInfo.offsetX;
      const targetY = y + tileInfo.offsetY;

      const tile = this.tileMap.getTile(targetX, targetY);
      if (!tile) continue;

      console.log(`[EditorMode] Getting sprite for tileset=${this.selectedTiles.tilesetId}, tileX=${tileInfo.x}, tileY=${tileInfo.y}`);

      const sprite = getSpriteFromTileset(
        this.selectedTiles.tilesetId,
        tileInfo.x,
        tileInfo.y
      );

      if (sprite) {
        tile.clearGraphics();
        tile.addGraphic(sprite);

        const metadata = getTileMetadata(
          this.selectedTiles.tilesetId,
          tileInfo.x,
          tileInfo.y
        );

        if (metadata) {
          tile.solid = !metadata.passable;

          EventBridge.emitTileChanged({
            x: targetX,
            y: targetY,
            type: metadata.type,
            tilesetX: tileInfo.x,
            tilesetY: tileInfo.y,
            tilesetSource: this.selectedTiles.tilesetId,
          });
        }
      }
    }

    console.log(`[EditorMode] Placed ${this.selectedTiles.tiles.length} tiles at (${x}, ${y})`);
  }

  /**
   * Устанавливает выбранные тайлы из тайлсета
   * @param tilesetId ID тайлсета
   * @param tiles Массив координат выбранных тайлов
   */
  setSelectedTiles(
    tilesetId: string,
    tiles: Array<{ x: number; y: number }>
  ): void {
    if (tiles.length === 0) {
      console.warn('[EditorMode] No tiles selected');
      this.selectedTiles = null;
      return;
    }

    console.log(`[EditorMode] setSelectedTiles received:`, tiles);

    // Находим минимальные координаты (левый верхний угол выделения)
    const minX = Math.min(...tiles.map(t => t.x));
    const minY = Math.min(...tiles.map(t => t.y));

    // Вычисляем смещения относительно левого верхнего угла
    this.selectedTiles = {
      tilesetId,
      tiles: tiles.map(tile => ({
        x: tile.x,
        y: tile.y,
        offsetX: tile.x - minX,
        offsetY: tile.y - minY
      }))
    };

    console.log(`[EditorMode] Selected ${tiles.length} tiles from ${tilesetId}, processed:`, this.selectedTiles.tiles);
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
    console.log("[EditorMode] Enabled");
  }

  /**
   * Выключает режим редактирования
   */
  disable(): void {
    this.isActive = false;
    this.isMouseDown = false;
    console.log("[EditorMode] Disabled");
  }

  /**
   * Проверяет, активен ли режим редактирования
   */
  isEnabled(): boolean {
    return this.isActive;
  }
}

export default EditorMode;
