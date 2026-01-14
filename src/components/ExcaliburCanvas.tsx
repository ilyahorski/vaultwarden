import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ExcaliburGame } from '../excalibur/ExcaliburGame';

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
      if (!game) return;

      if (isEditorMode) {
        game.enableEditorMode();
      } else {
        game.disableEditorMode();
      }
    }, [isEditorMode]);

    // Обработка выбора тайла из тайлсета
    useEffect(() => {
      const handleTilesetTileSelected = (e: Event) => {
        const customEvent = e as CustomEvent<{ tilesetId: string; x: number; y: number }>;
        const { tilesetId, x, y } = customEvent.detail;

        const game = gameRef.current;
        if (!game) return;

        // Используем новый метод setSelectedTile из ExcaliburGame
        if (typeof (game as any).setSelectedTile === 'function') {
          (game as any).setSelectedTile(tilesetId, x, y);
        }
      };

      window.addEventListener('tileset:tileSelected', handleTilesetTileSelected);

      return () => {
        window.removeEventListener('tileset:tileSelected', handleTilesetTileSelected);
      };
    }, []);

    // Обработка изменения размера кисти
    useEffect(() => {
      const handleBrushSizeChanged = (e: Event) => {
        const customEvent = e as CustomEvent<{ width: number; height: number }>;
        const { width, height } = customEvent.detail;

        const game = gameRef.current;
        if (!game) return;

        // Используем новый метод setBrushSize из ExcaliburGame
        if (typeof (game as any).setBrushSize === 'function') {
          (game as any).setBrushSize(width, height);
        }
      };

      window.addEventListener('brush:sizeChanged', handleBrushSizeChanged);

      return () => {
        window.removeEventListener('brush:sizeChanged', handleBrushSizeChanged);
      };
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
