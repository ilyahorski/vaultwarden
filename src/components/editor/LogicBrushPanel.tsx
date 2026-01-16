import React from 'react';
import {
  Paintbrush, Footprints, Zap, Users, Clock, Eye, Eraser,
  Square, CircleDot, Grid3X3
} from 'lucide-react';
import type { TimeLayer } from '../../types';
import type { TriggerType } from '../../excalibur/config/TilesetConfig';

// === Режимы кисти ===
export type BrushMode =
  | 'tile'           // Рисование тайлов
  | 'passability'    // Установка проходимости
  | 'trigger'        // Размещение триггеров
  | 'entity'         // Размещение сущностей
  | 'time_layer'     // Установка временного слоя
  | 'erase';         // Стирание

// === Форма кисти ===
export type BrushShape = 'square' | 'circle' | 'diamond';

interface LogicBrushPanelProps {
  /** Текущий режим кисти */
  brushMode: BrushMode;
  /** Callback при смене режима */
  onBrushModeChange: (mode: BrushMode) => void;
  /** Текущий размер кисти */
  brushSize: number;
  /** Callback при смене размера */
  onBrushSizeChange: (size: number) => void;
  /** Форма кисти */
  brushShape: BrushShape;
  /** Callback при смене формы */
  onBrushShapeChange: (shape: BrushShape) => void;
  /** Значение проходимости для режима passability */
  passabilityValue: boolean;
  /** Callback при смене проходимости */
  onPassabilityChange: (passable: boolean) => void;
  /** Выбранный триггер для режима trigger */
  selectedTrigger: TriggerType | null;
  /** Callback при выборе триггера */
  onTriggerSelect: (trigger: TriggerType | null) => void;
  /** Выбранный временной слой для режима time_layer */
  selectedTimeLayer: TimeLayer;
  /** Callback при выборе слоя */
  onTimeLayerSelect: (layer: TimeLayer) => void;
  /** Компактный режим отображения */
  compact?: boolean;
}

// === Названия режимов ===
const BRUSH_MODE_INFO: Record<BrushMode, { name: string; icon: React.ReactNode; color: string }> = {
  tile: { name: 'Тайлы', icon: <Paintbrush size={16} />, color: 'bg-blue-600' },
  passability: { name: 'Проходимость', icon: <Footprints size={16} />, color: 'bg-green-600' },
  trigger: { name: 'Триггеры', icon: <Zap size={16} />, color: 'bg-amber-600' },
  entity: { name: 'Сущности', icon: <Users size={16} />, color: 'bg-purple-600' },
  time_layer: { name: 'Время', icon: <Clock size={16} />, color: 'bg-cyan-600' },
  erase: { name: 'Стирание', icon: <Eraser size={16} />, color: 'bg-red-600' }
};

// === Названия триггеров ===
const TRIGGER_NAMES: Record<TriggerType, string> = {
  on_enter: 'При входе',
  on_exit: 'При выходе',
  on_interact: 'Взаимодействие',
  on_time_shift: 'Смена времени',
  on_item_use: 'Использование предмета',
  proximity: 'Приближение',
  timed: 'Таймер',
  conditional: 'Условие'
};

// === Названия временных слоёв ===
const TIME_LAYER_INFO: Record<TimeLayer, { name: string; color: string }> = {
  past: { name: 'Прошлое', color: 'bg-amber-600' },
  present: { name: 'Настоящее', color: 'bg-green-600' },
  future: { name: 'Будущее', color: 'bg-purple-600' }
};

export const LogicBrushPanel: React.FC<LogicBrushPanelProps> = ({
  brushMode,
  onBrushModeChange,
  brushSize,
  onBrushSizeChange,
  brushShape,
  onBrushShapeChange,
  passabilityValue,
  onPassabilityChange,
  selectedTrigger,
  onTriggerSelect,
  selectedTimeLayer,
  onTimeLayerSelect,
  compact = false
}) => {
  return (
    <div className={`bg-slate-800 rounded-lg border border-slate-700 ${compact ? 'p-2' : 'p-3'}`}>
      {/* Заголовок */}
      {!compact && (
        <h3 className="text-slate-300 font-medium text-sm mb-3 flex items-center gap-2">
          <Paintbrush size={14} />
          Режим кисти
        </h3>
      )}

      {/* Выбор режима кисти */}
      <div className={`grid ${compact ? 'grid-cols-6' : 'grid-cols-3'} gap-1 mb-3`}>
        {(Object.entries(BRUSH_MODE_INFO) as [BrushMode, typeof BRUSH_MODE_INFO.tile][]).map(([mode, info]) => (
          <button
            key={mode}
            onClick={() => onBrushModeChange(mode)}
            className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${
              brushMode === mode
                ? `${info.color} text-white`
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
            title={info.name}
          >
            {info.icon}
            {!compact && <span className="text-xs">{info.name}</span>}
          </button>
        ))}
      </div>

      {/* Размер и форма кисти */}
      <div className={`flex gap-2 mb-3 ${compact ? 'flex-col' : ''}`}>
        {/* Размер */}
        <div className="flex-1">
          <label className="block text-slate-500 text-xs mb-1">Размер: {brushSize}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={brushSize}
            onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Форма */}
        <div className="flex gap-1">
          <button
            onClick={() => onBrushShapeChange('square')}
            className={`p-2 rounded ${
              brushShape === 'square' ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
            title="Квадрат"
          >
            <Square size={14} />
          </button>
          <button
            onClick={() => onBrushShapeChange('circle')}
            className={`p-2 rounded ${
              brushShape === 'circle' ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
            title="Круг"
          >
            <CircleDot size={14} />
          </button>
          <button
            onClick={() => onBrushShapeChange('diamond')}
            className={`p-2 rounded ${
              brushShape === 'diamond' ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
            title="Ромб"
          >
            <Grid3X3 size={14} />
          </button>
        </div>
      </div>

      {/* Дополнительные опции в зависимости от режима */}

      {/* Режим проходимости */}
      {brushMode === 'passability' && (
        <div className="border-t border-slate-700 pt-3">
          <label className="block text-slate-500 text-xs mb-2">Значение проходимости</label>
          <div className="flex gap-2">
            <button
              onClick={() => onPassabilityChange(true)}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded text-sm ${
                passabilityValue
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              <Footprints size={14} />
              Проходимо
            </button>
            <button
              onClick={() => onPassabilityChange(false)}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded text-sm ${
                !passabilityValue
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              <Eye size={14} />
              Блокировано
            </button>
          </div>
        </div>
      )}

      {/* Режим триггеров */}
      {brushMode === 'trigger' && (
        <div className="border-t border-slate-700 pt-3">
          <label className="block text-slate-500 text-xs mb-2">Тип триггера</label>
          <select
            value={selectedTrigger || ''}
            onChange={(e) => onTriggerSelect(e.target.value as TriggerType || null)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white"
          >
            <option value="">Выберите триггер...</option>
            {(Object.entries(TRIGGER_NAMES) as [TriggerType, string][]).map(([type, name]) => (
              <option key={type} value={type}>{name}</option>
            ))}
          </select>
          {selectedTrigger && (
            <p className="text-slate-500 text-xs mt-2">
              Кликните на карте, чтобы добавить триггер "{TRIGGER_NAMES[selectedTrigger]}"
            </p>
          )}
        </div>
      )}

      {/* Режим временного слоя */}
      {brushMode === 'time_layer' && (
        <div className="border-t border-slate-700 pt-3">
          <label className="block text-slate-500 text-xs mb-2">Временной слой</label>
          <div className="flex gap-1">
            {(Object.entries(TIME_LAYER_INFO) as [TimeLayer, typeof TIME_LAYER_INFO.past][]).map(([layer, info]) => (
              <button
                key={layer}
                onClick={() => onTimeLayerSelect(layer)}
                className={`flex-1 p-2 rounded text-xs font-medium transition-colors ${
                  selectedTimeLayer === layer
                    ? `${info.color} text-white`
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {info.name}
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Кликните на карте, чтобы назначить слой "{TIME_LAYER_INFO[selectedTimeLayer].name}"
          </p>
        </div>
      )}

      {/* Режим сущностей */}
      {brushMode === 'entity' && (
        <div className="border-t border-slate-700 pt-3">
          <p className="text-slate-500 text-xs">
            Используйте панель Entity Placer для размещения NPC и врагов
          </p>
        </div>
      )}

      {/* Режим стирания */}
      {brushMode === 'erase' && (
        <div className="border-t border-slate-700 pt-3">
          <p className="text-slate-500 text-xs">
            Кликните на карте, чтобы очистить тайл до пустого состояния
          </p>
        </div>
      )}
    </div>
  );
};

export default LogicBrushPanel;
