import { useEffect, useRef, useCallback, useState } from 'react';
import { PRELOADED_TILESETS, DEFAULT_MAP_CONFIG } from '../../config/tilemapEditorConfig';
import type { TilemapEditorData, FlattenedMapData } from '../../config/tilemapEditorConfig';
import { convertToExcaliburFormat, convertFromExcaliburFormat } from '../../utils/tilemapDataConverter';
import { WorldRepository } from '../../db/repositories/WorldRepository';

// Импорт tilemap-editor и стилей
import TilemapEditor from 'tilemap-editor/src/tilemap-editor.js';
import 'tilemap-editor/src/styles.css';

// Debounce helper
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

// Автосохранение интервал (мс)
const AUTO_SAVE_DELAY = 2000;

interface TilemapEditorConfig {
  tileMapData?: TilemapEditorData;
  tileSize?: number;
  mapWidth?: number;
  mapHeight?: number;
  tileSetImages?: Array<{
    src: string;
    name: string;
    description?: string;
    link?: string;
  }>;
  tileSetLoaders?: Record<string, {
    name: string;
    prompt?: (setSrc: (src: string) => void) => void;
    onSelectImage?: (setSrc: (src: string) => void, file: File, base64: string) => void;
  }>;
  onApply?: {
    buttonText: string;
    onClick: (data: {
      flattenedData: FlattenedMapData;
      maps: TilemapEditorData['maps'];
      tileSets: TilemapEditorData['tileSets'];
      activeMap: string;
    }) => void;
  };
  onUpdate?: (event: { type: string; data?: unknown }) => void;
}

interface TilemapEditorState {
  maps: TilemapEditorData['maps'];
  tileSets: TilemapEditorData['tileSets'];
  activeMap: string;
}

export interface TilemapEditorWrapperProps {
  /** Callback при применении изменений к игре */
  onApplyToGame: (data: {
    flattenedData: FlattenedMapData;
    maps: TilemapEditorData['maps'];
    tileSets: TilemapEditorData['tileSets'];
  }) => void;
  /** Callback при любом изменении карты */
  onMapChange?: (data: TilemapEditorData) => void;
  /** Начальные данные карты */
  initialData?: TilemapEditorData;
  /** Режим игры (для переключения DM/Player) */
  mode: 'dm' | 'player';
  /** Callback для смены режима */
  onModeChange: (mode: 'dm' | 'player') => void;
}

/**
 * React обёртка для tilemap-editor
 *
 * Интегрирует vanilla JS библиотеку tilemap-editor в React приложение.
 * Предоставляет предзагруженные тайлсеты и возможность загрузки пользовательских.
 */
export const TilemapEditorWrapper: React.FC<TilemapEditorWrapperProps> = ({
  onApplyToGame,
  onMapChange,
  initialData,
  mode,
  onModeChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState<TilemapEditorData | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const lastSaveRef = useRef<number>(0);

  // Загрузка данных из IndexedDB при монтировании
  useEffect(() => {
    const loadExistingMap = async () => {
      try {
        console.log('[TilemapEditorWrapper] Checking for existing map in IndexedDB...');
        const hasData = await WorldRepository.hasWorldData();

        if (hasData) {
          console.log('[TilemapEditorWrapper] Found existing map, loading...');
          const dimensions = await WorldRepository.getWorldDimensions();
          if (dimensions) {
            const grid = await WorldRepository.loadWorldMap(dimensions.width, dimensions.height);
            const excaliburMapData = {
              version: 1,
              name: 'Saved Map',
              width: dimensions.width,
              height: dimensions.height,
              grid
            };
            // Конвертируем в формат tilemap-editor
            const tilemapData = convertFromExcaliburFormat(excaliburMapData);
            console.log('[TilemapEditorWrapper] Converted map data:', tilemapData);
            setLoadedData(tilemapData);
          }
        } else {
          console.log('[TilemapEditorWrapper] No existing map found');
        }
      } catch (error) {
        console.error('[TilemapEditorWrapper] Failed to load existing map:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingMap();
  }, []);

  // Автосохранение в IndexedDB
  const saveToIndexedDB = useCallback(async (maps: TilemapEditorData['maps'], tileSets: TilemapEditorData['tileSets']) => {
    try {
      setSaveStatus('saving');
      const excaliburData = convertToExcaliburFormat({ maps, tileSets });
      console.log('[TilemapEditorWrapper] Auto-saving to IndexedDB...', excaliburData.width, 'x', excaliburData.height);
      await WorldRepository.saveWorldMap(excaliburData.grid);
      lastSaveRef.current = Date.now();
      console.log('[TilemapEditorWrapper] Auto-save completed');
      setSaveStatus('saved');
      // Сбрасываем статус через 2 секунды
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('[TilemapEditorWrapper] Auto-save failed:', error);
      setSaveStatus('idle');
    }
  }, []);

  // Дебаунсированное автосохранение
  const debouncedSave = useCallback(
    debounce((maps: TilemapEditorData['maps'], tileSets: TilemapEditorData['tileSets']) => {
      saveToIndexedDB(maps, tileSets);
    }, AUTO_SAVE_DELAY),
    [saveToIndexedDB]
  );

  // Инициализация редактора
  const initEditor = useCallback(() => {
    const container = containerRef.current;
    if (!container || isInitialized.current || isLoading) return;

    // Проверяем что контейнер имеет размеры
    const rect = container.getBoundingClientRect();
    console.log('[TilemapEditorWrapper] Container rect:', rect);

    if (rect.width === 0 || rect.height === 0) {
      console.log('[TilemapEditorWrapper] Container has no size, waiting...');
      setTimeout(initEditor, 100);
      return;
    }

    isInitialized.current = true;

    // Используем загруженные данные или initialData
    const mapData = loadedData || initialData;
    console.log('[TilemapEditorWrapper] Initializing tilemap-editor...', { hasLoadedData: !!loadedData, hasInitialData: !!initialData });

    try {
      TilemapEditor.init('tilemap-editor-container', {
        tileMapData: mapData,
        tileSize: DEFAULT_MAP_CONFIG.tileSize,
        mapWidth: DEFAULT_MAP_CONFIG.mapWidth,
        mapHeight: DEFAULT_MAP_CONFIG.mapHeight,
        tileSetImages: PRELOADED_TILESETS,
        // Обязательные параметры - иначе библиотека падает
        tileMapExporters: {},
        tileMapImporters: {},
        tileSetLoaders: {
          fromUrl: {
            name: 'URL изображения',
            prompt: (setSrc: (src: string) => void) => {
              const url = window.prompt('Введите URL изображения тайлсета:');
              if (url) {
                setSrc(url);
              }
            }
          },
          fromFile: {
            name: 'Загрузить файл',
            onSelectImage: (setSrc: (src: string) => void, _file: File, base64: string) => {
              setSrc(base64);
            }
          }
        },
        onApply: {
          buttonText: '🎮 Применить к игре',
          onClick: ({ flattenedData, maps, tileSets }: { flattenedData: FlattenedMapData; maps: TilemapEditorData['maps']; tileSets: TilemapEditorData['tileSets'] }) => {
            console.log('[TilemapEditorWrapper] Applying to game:', { flattenedData, maps, tileSets });
            onApplyToGame({ flattenedData, maps, tileSets });
            // Также сохраняем при применении
            saveToIndexedDB(maps, tileSets);
          }
        },
        onUpdate: (event: { type: string }) => {
          console.log('[TilemapEditorWrapper] Update event:', event.type);

          // Получаем текущее состояние карты через API библиотеки
          try {
            const currentData = TilemapEditor.getMapData?.() as {
              maps?: TilemapEditorData['maps'];
              tileSets?: TilemapEditorData['tileSets'];
            } | undefined;

            if (currentData?.maps && currentData?.tileSets) {
              debouncedSave(currentData.maps, currentData.tileSets);
              // Уведомляем родителя об изменениях
              if (onMapChange) {
                onMapChange({ maps: currentData.maps, tileSets: currentData.tileSets });
              }
            }
          } catch (error) {
            console.warn('[TilemapEditorWrapper] Could not get map data on update:', error);
          }
        }
      });
      console.log('[TilemapEditorWrapper] Editor initialized successfully');
    } catch (error) {
      console.error('[TilemapEditorWrapper] Failed to initialize editor:', error);
      isInitialized.current = false;
    }
  }, [initialData, loadedData, isLoading, onApplyToGame, onMapChange, saveToIndexedDB, debouncedSave]);

  // Инициализация после монтирования и загрузки данных
  useEffect(() => {
    if (isLoading) return;
    // Небольшая задержка для гарантии монтирования DOM
    const timer = setTimeout(initEditor, 100);
    return () => clearTimeout(timer);
  }, [initEditor, isLoading]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      isInitialized.current = false;
      // Удаляем DOM редактора
      const container = document.getElementById('tilemap-editor-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="flex flex-col bg-slate-950 w-full h-screen">
      {/* Хедер с переключателем режимов */}
      <div className="shrink-0 p-3 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="bg-amber-600 rounded-lg p-1.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-sm">Vaultwarden</h1>
              <span className="text-slate-500 text-xs">Tilemap Editor</span>
            </div>
          </div>
          {/* Индикатор сохранения */}
          <div className="flex items-center gap-1.5">
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                <div className="animate-spin w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full" />
                <span>Сохранение...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-1.5 text-green-400 text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Сохранено</span>
              </div>
            )}
          </div>
        </div>

        {/* Кнопки режимов */}
        <div className="flex gap-2">
          <button
            onClick={() => onModeChange('dm')}
            className={`flex-1 rounded flex items-center justify-center gap-1 p-1.5 text-xs transition-colors ${
              mode === 'dm'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-slate-500 hover:bg-slate-800 border border-transparent hover:border-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Редактор
          </button>
          <button
            onClick={() => onModeChange('player')}
            className={`flex-1 rounded flex items-center justify-center gap-1 p-1.5 text-xs transition-colors ${
              mode === 'player'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-500 hover:bg-slate-800 border border-transparent hover:border-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Игра
          </button>
        </div>
      </div>

      {/* Контейнер для tilemap-editor */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-400">Загрузка карты...</p>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          id="tilemap-editor-container"
          className="flex-1 overflow-auto tilemap-editor-theme min-h-0"
          style={{ minHeight: '400px' }}
        />
      )}
    </div>
  );
};

export default TilemapEditorWrapper;
