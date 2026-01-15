import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ExcaliburGame } from '../excalibur/ExcaliburGame';
import { EventBridge } from '../excalibur/utils/EventBridge';

interface ExcaliburCanvasProps {
  className?: string;
  isEditorMode?: boolean;
  selectedTool?: string;
}

export interface ExcaliburCanvasRef {
  game: ExcaliburGame | null;
}

export const ExcaliburCanvas = forwardRef<ExcaliburCanvasRef, ExcaliburCanvasProps>(
  ({ className = '', isEditorMode = false, selectedTool = 'floor' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<ExcaliburGame | null>(null);

    useImperativeHandle(ref, () => ({
      game: gameRef.current
    }));

    useEffect(() => {
      // Защита от двойной инициализации (React StrictMode)
      if (gameRef.current) {
        console.log('ExcaliburCanvas: Already initialized, skipping');
        return;
      }

      console.log('ExcaliburCanvas: Initializing...');

      // Создаем canvas элемент
      const canvas = document.createElement('canvas');
      canvas.id = 'excalibur-canvas';
      canvas.style.imageRendering = 'pixelated';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.tabIndex = 1; // Делаем canvas фокусируемым для клавиатуры

      if (containerRef.current) {
        containerRef.current.appendChild(canvas);
      }

      // Инициализируем Excalibur игру
      const game = new ExcaliburGame({
        canvasElementId: 'excalibur-canvas'
      });

      gameRef.current = game;

      game.initialize().then(() => {
        // Фокусируем canvas после инициализации для приёма клавиатурного ввода
        canvas.focus();
        console.log('ExcaliburCanvas: Canvas focused for keyboard input');
      }).catch((err) => {
        console.error('Failed to initialize Excalibur game:', err);
      });

      // Cleanup при unmount
      return () => {
        console.log('ExcaliburCanvas: Cleanup');
        if (gameRef.current) {
          gameRef.current.stop();
          gameRef.current = null;
        }
        if (canvas.parentElement) {
          canvas.parentElement.removeChild(canvas);
        }
      };
    }, []);

    // Управление режимом редактирования
    useEffect(() => {
      const game = gameRef.current;
      if (!game) {
        console.warn('[ExcaliburCanvas] Cannot toggle editor mode - game not initialized');
        return;
      }

      console.log('[ExcaliburCanvas] Editor mode changing to:', isEditorMode);
      if (isEditorMode) {
        game.enableEditorMode();
      } else {
        game.disableEditorMode();
      }
    }, [isEditorMode]);

    // Исправлено: Обработка выбора тайла через EventBridge вместо window
    useEffect(() => {
      const handleTilesetTileSelected = (data: {
        tilesetId: string;
        tiles: Array<{ x: number; y: number }>;
      }) => {
        console.log('[ExcaliburCanvas] Received tileset:tileSelected event:', data);
        const game = gameRef.current;
        if (!game) {
          console.warn('[ExcaliburCanvas] Game not initialized yet');
          return;
        }
        game.setSelectedTiles(data.tilesetId, data.tiles);
      };

      console.log('[ExcaliburCanvas] Registering tileset:tileSelected listener');
      EventBridge.on('tileset:tileSelected', handleTilesetTileSelected);
      return () => EventBridge.off('tileset:tileSelected', handleTilesetTileSelected);
    }, []);


    return (
      <div
        ref={containerRef}
        className={`w-full h-full ${className}`}
        style={{
          imageRendering: 'pixelated',
          background: '#000'
        }}
      />
    );
  }
);

ExcaliburCanvas.displayName = 'ExcaliburCanvas';

export default ExcaliburCanvas;
