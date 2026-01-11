import { useState, useEffect } from 'react';
import type { CellData } from '../types';
import { loadMapFromJson } from '../utils/townGenerator';

/**
 * Хук для предзагрузки большой карты мира
 * Загружает карту асинхронно при монтировании компонента
 */
export const useWorldMap = (mapPath: string) => {
  const [worldMap, setWorldMap] = useState<CellData[][] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const map = await loadMapFromJson(mapPath);

        if (!cancelled) {
          setWorldMap(map);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsLoading(false);
        }
      }
    };

    loadMap();

    return () => {
      cancelled = true;
    };
  }, [mapPath]);

  return { worldMap, isLoading, error };
};
