import { useEffect } from 'react';
import { EventBridge } from '../excalibur/utils/EventBridge';
import type { Cell, CellType } from '../types';

interface UseEditorSyncProps {
  setGrid: React.Dispatch<React.SetStateAction<Cell[][]>>;
}

/**
 * useEditorSync - синхронизация изменений тайлов из EditorMode в React state
 *
 * Обрабатывает событие tile:changed от Excalibur и обновляет grid
 */
export const useEditorSync = ({ setGrid }: UseEditorSyncProps): void => {
  useEffect(() => {
    const onTileChanged = (data: {
      x: number;
      y: number;
      type: string;
      tilesetX?: number;
      tilesetY?: number
    }) => {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => [...row]);

        if (data.y >= 0 && data.y < newGrid.length &&
            data.x >= 0 && data.x < newGrid[0].length) {
          // ИСПРАВЛЕНО: сохраняем координаты тайлсета, чтобы они не терялись при сохранении JSON
          newGrid[data.y][data.x] = {
            ...newGrid[data.y][data.x],
            type: data.type as CellType,
            tileX: data.tilesetX,
            tileY: data.tilesetY
          };
        }
        return newGrid;
      });
    };

    EventBridge.on('tile:changed', onTileChanged);
    return () => EventBridge.off('tile:changed', onTileChanged);
  }, [setGrid]);
};

export default useEditorSync;
