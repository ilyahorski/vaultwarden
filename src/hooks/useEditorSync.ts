import { useEffect } from 'react';
import { EventBridge } from '../excalibur/utils/EventBridge';
import type { Cell } from '../types';

interface UseEditorSyncProps {
  grid: Cell[][];
  setGrid: React.Dispatch<React.SetStateAction<Cell[][]>>;
}

/**
 * useEditorSync - синхронизация изменений тайлов из EditorMode в React state
 *
 * Обрабатывает событие tile:changed от Excalibur и обновляет grid
 */
export const useEditorSync = ({
  grid,
  setGrid
}: UseEditorSyncProps): void => {
  useEffect(() => {
    // Excalibur → React: тайл изменен в редакторе
    const onTileChanged = (data: { x: number; y: number; type: string }) => {
      console.log(`[useEditorSync] Tile changed at (${data.x}, ${data.y}) to ${data.type}`);

      setGrid(prevGrid => {
        // Создаем копию grid для immutability
        const newGrid = prevGrid.map(row => [...row]);

        // Проверяем границы
        if (data.y >= 0 && data.y < newGrid.length &&
            data.x >= 0 && data.x < newGrid[0].length) {
          // Обновляем тип тайла
          newGrid[data.y][data.x] = {
            ...newGrid[data.y][data.x],
            type: data.type as any
          };
        }

        return newGrid;
      });
    };

    EventBridge.on('tile:changed', onTileChanged);

    return () => {
      EventBridge.off('tile:changed', onTileChanged);
    };
  }, [setGrid]);
};

export default useEditorSync;
