import React, { useState, useCallback } from 'react';
import {
  X, Eye, EyeOff, Footprints, Clock, Zap, Users, Trash2,
  ChevronDown, ChevronRight, Settings, Layers, MapPin
} from 'lucide-react';
import type { CellType, TimeLayer, CellData } from '../../types';
import type {
  TilesetTileMetadata,
  TriggerConfig,
  TriggerType,
  EntityType
} from '../../excalibur/config/TilesetConfig';
import {
  CELL_TYPE_NAMES,
  TILE_CATEGORIES
} from '../../excalibur/config/TilesetConfig';

interface TileInspectorProps {
  /** Выбранная ячейка на карте */
  selectedCell: CellData | null;
  /** Метаданные тайла из тайлсета */
  tileMetadata?: TilesetTileMetadata;
  /** Позиция на экране (для позиционирования панели) */
  position?: { x: number; y: number };
  /** Callback при изменении свойств */
  onUpdateCell?: (x: number, y: number, updates: Partial<CellData>) => void;
  /** Callback при изменении метаданных тайлсета */
  onUpdateMetadata?: (updates: Partial<TilesetTileMetadata>) => void;
  /** Callback при закрытии */
  onClose?: () => void;
}

// === Названия триггеров на русском ===
const TRIGGER_TYPE_NAMES: Record<TriggerType, string> = {
  on_enter: 'При входе',
  on_exit: 'При выходе',
  on_interact: 'При взаимодействии',
  on_time_shift: 'При смене времени',
  on_item_use: 'При использовании предмета',
  proximity: 'По близости',
  timed: 'По таймеру',
  conditional: 'По условию'
};

// === Названия типов сущностей на русском ===
const ENTITY_TYPE_NAMES: Record<EntityType, string> = {
  npc: 'NPC',
  enemy: 'Враг',
  trigger: 'Триггер',
  interactable: 'Интерактивный объект',
  spawn_point: 'Точка спавна'
};

// === Названия временных слоёв ===
const TIME_LAYER_NAMES: Record<TimeLayer, string> = {
  past: 'Прошлое',
  present: 'Настоящее',
  future: 'Будущее'
};

export const TileInspector: React.FC<TileInspectorProps> = ({
  selectedCell,
  tileMetadata,
  position,
  onUpdateCell,
  onUpdateMetadata,
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    timeshift: false,
    triggers: false,
    entity: false,
    visual: false
  });

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  if (!selectedCell) {
    return null;
  }

  const handleCellUpdate = (updates: Partial<CellData>) => {
    if (onUpdateCell && selectedCell) {
      onUpdateCell(selectedCell.x, selectedCell.y, updates);
    }
  };

  const handleMetadataUpdate = (updates: Partial<TilesetTileMetadata>) => {
    if (onUpdateMetadata) {
      onUpdateMetadata(updates);
    }
  };

  // === Секция: Базовые свойства ===
  const renderBasicSection = () => (
    <div className="mb-4">
      <button
        onClick={() => toggleSection('basic')}
        className="flex items-center gap-2 w-full text-left text-slate-300 hover:text-white mb-2"
      >
        {expandedSections.basic ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Settings size={16} />
        <span className="font-medium">Базовые свойства</span>
      </button>

      {expandedSections.basic && (
        <div className="pl-6 space-y-3">
          {/* Координаты (только чтение) */}
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-slate-500">X:</span>
              <span className="text-slate-300 ml-1">{selectedCell.x}</span>
            </div>
            <div>
              <span className="text-slate-500">Y:</span>
              <span className="text-slate-300 ml-1">{selectedCell.y}</span>
            </div>
          </div>

          {/* Тип ячейки */}
          <div>
            <label className="block text-slate-500 text-xs mb-1">Тип ячейки</label>
            <select
              value={selectedCell.type}
              onChange={(e) => handleCellUpdate({ type: e.target.value as CellType })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
            >
              {Object.entries(CELL_TYPE_NAMES).map(([type, name]) => (
                <option key={type} value={type}>{name}</option>
              ))}
            </select>
          </div>

          {/* Проходимость */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Toggle passable in metadata if available
                if (tileMetadata) {
                  handleMetadataUpdate({ passable: !tileMetadata.passable });
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                tileMetadata?.passable
                  ? 'bg-green-600/30 text-green-400 border border-green-600/50'
                  : 'bg-red-600/30 text-red-400 border border-red-600/50'
              }`}
            >
              {tileMetadata?.passable ? <Footprints size={14} /> : <EyeOff size={14} />}
              {tileMetadata?.passable ? 'Проходимо' : 'Непроходимо'}
            </button>
          </div>

          {/* Категория */}
          <div>
            <label className="block text-slate-500 text-xs mb-1">Категория</label>
            <select
              value={tileMetadata?.category || 'terrain'}
              onChange={(e) => handleMetadataUpdate({ category: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
            >
              {TILE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'terrain' ? 'Ландшафт' :
                   cat === 'structure' ? 'Структура' :
                   cat === 'decoration' ? 'Декорация' :
                   cat === 'interactive' ? 'Интерактивный' :
                   'Специальный'}
                </option>
              ))}
            </select>
          </div>

          {/* Название (опционально) */}
          <div>
            <label className="block text-slate-500 text-xs mb-1">Название</label>
            <input
              type="text"
              value={tileMetadata?.name || ''}
              onChange={(e) => handleMetadataUpdate({ name: e.target.value })}
              placeholder="Название тайла..."
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
            />
          </div>
        </div>
      )}
    </div>
  );

  // === Секция: Time-Shift ===
  const renderTimeShiftSection = () => (
    <div className="mb-4">
      <button
        onClick={() => toggleSection('timeshift')}
        className="flex items-center gap-2 w-full text-left text-slate-300 hover:text-white mb-2"
      >
        {expandedSections.timeshift ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Clock size={16} />
        <span className="font-medium">Временной слой</span>
      </button>

      {expandedSections.timeshift && (
        <div className="pl-6 space-y-3">
          {/* Временной слой */}
          <div>
            <label className="block text-slate-500 text-xs mb-1">Слой времени</label>
            <div className="flex gap-2">
              {(['past', 'present', 'future'] as TimeLayer[]).map(layer => (
                <button
                  key={layer}
                  onClick={() => handleMetadataUpdate({ timeLayer: layer })}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                    tileMetadata?.timeLayer === layer
                      ? layer === 'past' ? 'bg-amber-600 text-white' :
                        layer === 'present' ? 'bg-green-600 text-white' :
                        'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {TIME_LAYER_NAMES[layer]}
                </button>
              ))}
            </div>
          </div>

          {/* Эксклюзивность слоя */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="timeExclusive"
              checked={tileMetadata?.timeExclusive || false}
              onChange={(e) => handleMetadataUpdate({ timeExclusive: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700"
            />
            <label htmlFor="timeExclusive" className="text-slate-400 text-sm">
              Только в этом слое
            </label>
          </div>

          {/* Информация о вариантах */}
          {selectedCell.timeVariants && (
            <div className="bg-slate-900/50 rounded p-2 text-xs">
              <p className="text-slate-500 mb-1">Варианты по слоям:</p>
              {selectedCell.timeVariants.past && (
                <p className="text-amber-400">✓ Прошлое</p>
              )}
              {selectedCell.timeVariants.present && (
                <p className="text-green-400">✓ Настоящее</p>
              )}
              {selectedCell.timeVariants.future && (
                <p className="text-purple-400">✓ Будущее</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // === Секция: Триггеры ===
  const renderTriggersSection = () => (
    <div className="mb-4">
      <button
        onClick={() => toggleSection('triggers')}
        className="flex items-center gap-2 w-full text-left text-slate-300 hover:text-white mb-2"
      >
        {expandedSections.triggers ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Zap size={16} />
        <span className="font-medium">Триггеры</span>
        {tileMetadata?.triggers && tileMetadata.triggers.length > 0 && (
          <span className="ml-auto bg-amber-600/30 text-amber-400 px-1.5 py-0.5 rounded text-xs">
            {tileMetadata.triggers.length}
          </span>
        )}
      </button>

      {expandedSections.triggers && (
        <div className="pl-6 space-y-3">
          {/* Список триггеров */}
          {tileMetadata?.triggers && tileMetadata.triggers.length > 0 ? (
            <div className="space-y-2">
              {tileMetadata.triggers.map((trigger, index) => (
                <div key={index} className="bg-slate-900/50 rounded p-2 flex items-center gap-2">
                  <Zap size={12} className="text-amber-400" />
                  <span className="text-sm text-slate-300 flex-1">
                    {TRIGGER_TYPE_NAMES[trigger.type]}
                  </span>
                  <button
                    onClick={() => {
                      const newTriggers = [...(tileMetadata.triggers || [])];
                      newTriggers.splice(index, 1);
                      handleMetadataUpdate({ triggers: newTriggers });
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Нет триггеров</p>
          )}

          {/* Добавить триггер */}
          <div>
            <label className="block text-slate-500 text-xs mb-1">Добавить триггер</label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  const newTrigger: TriggerConfig = {
                    type: e.target.value as TriggerType
                  };
                  handleMetadataUpdate({
                    triggers: [...(tileMetadata?.triggers || []), newTrigger]
                  });
                  e.target.value = '';
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
              defaultValue=""
            >
              <option value="" disabled>Выберите тип...</option>
              {Object.entries(TRIGGER_TYPE_NAMES).map(([type, name]) => (
                <option key={type} value={type}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );

  // === Секция: Сущности ===
  const renderEntitySection = () => (
    <div className="mb-4">
      <button
        onClick={() => toggleSection('entity')}
        className="flex items-center gap-2 w-full text-left text-slate-300 hover:text-white mb-2"
      >
        {expandedSections.entity ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Users size={16} />
        <span className="font-medium">Сущность</span>
        {tileMetadata?.entitySpawnPoint && (
          <MapPin size={14} className="ml-auto text-green-400" />
        )}
      </button>

      {expandedSections.entity && (
        <div className="pl-6 space-y-3">
          {/* Точка спавна */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="spawnPoint"
              checked={tileMetadata?.entitySpawnPoint || false}
              onChange={(e) => handleMetadataUpdate({ entitySpawnPoint: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700"
            />
            <label htmlFor="spawnPoint" className="text-slate-400 text-sm">
              Точка спавна
            </label>
          </div>

          {/* Информация о сущности */}
          {selectedCell.entityId && (
            <div className="bg-slate-900/50 rounded p-2">
              <p className="text-slate-500 text-xs mb-1">ID сущности:</p>
              <p className="text-slate-300 text-sm font-mono">{selectedCell.entityId}</p>
              {selectedCell.entityType && (
                <p className="text-slate-400 text-xs mt-1">
                  Тип: {ENTITY_TYPE_NAMES[selectedCell.entityType as EntityType] || selectedCell.entityType}
                </p>
              )}
            </div>
          )}

          {/* Тип сущности по умолчанию */}
          {tileMetadata?.entitySpawnPoint && (
            <div>
              <label className="block text-slate-500 text-xs mb-1">Тип сущности</label>
              <select
                value={tileMetadata?.defaultEntity?.entityType || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleMetadataUpdate({
                      defaultEntity: {
                        entityId: `entity_${Date.now()}`,
                        entityType: e.target.value as EntityType,
                        ...tileMetadata?.defaultEntity
                      }
                    });
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
              >
                <option value="">Выберите тип...</option>
                {Object.entries(ENTITY_TYPE_NAMES).map(([type, name]) => (
                  <option key={type} value={type}>{name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // === Секция: Визуальные эффекты ===
  const renderVisualSection = () => (
    <div className="mb-4">
      <button
        onClick={() => toggleSection('visual')}
        className="flex items-center gap-2 w-full text-left text-slate-300 hover:text-white mb-2"
      >
        {expandedSections.visual ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Eye size={16} />
        <span className="font-medium">Визуальные эффекты</span>
      </button>

      {expandedSections.visual && (
        <div className="pl-6 space-y-3">
          {/* Анимация */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="animated"
              checked={tileMetadata?.animated || false}
              onChange={(e) => handleMetadataUpdate({ animated: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700"
            />
            <label htmlFor="animated" className="text-slate-400 text-sm">
              Анимированный
            </label>
          </div>

          {tileMetadata?.animated && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 text-xs mb-1">Кадров</label>
                <input
                  type="number"
                  min="1"
                  max="32"
                  value={tileMetadata?.animationFrames || 4}
                  onChange={(e) => handleMetadataUpdate({ animationFrames: parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-xs mb-1">Скорость (мс)</label>
                <input
                  type="number"
                  min="50"
                  max="2000"
                  step="50"
                  value={tileMetadata?.animationSpeed || 200}
                  onChange={(e) => handleMetadataUpdate({ animationSpeed: parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                />
              </div>
            </div>
          )}

          {/* Освещение */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="emissive"
              checked={tileMetadata?.emissive || false}
              onChange={(e) => handleMetadataUpdate({ emissive: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700"
            />
            <label htmlFor="emissive" className="text-slate-400 text-sm">
              Излучает свет
            </label>
          </div>

          {tileMetadata?.emissive && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 text-xs mb-1">Радиус</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tileMetadata?.lightRadius || 5}
                  onChange={(e) => handleMetadataUpdate({ lightRadius: parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-xs mb-1">Цвет</label>
                <input
                  type="color"
                  value={tileMetadata?.lightColor || '#ffaa00'}
                  onChange={(e) => handleMetadataUpdate({ lightColor: e.target.value })}
                  className="w-full h-8 bg-slate-900 border border-slate-700 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-72 max-h-[80vh] overflow-hidden flex flex-col z-50"
      style={{
        top: position?.y || 100,
        left: position?.x || 100
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-amber-500" />
          <span className="font-medium text-white">Инспектор тайла</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {renderBasicSection()}
        {renderTimeShiftSection()}
        {renderTriggersSection()}
        {renderEntitySection()}
        {renderVisualSection()}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-700 bg-slate-900/30 text-center">
        <span className="text-slate-500 text-xs">
          Тайлсет: {selectedCell.tilesetSource || 'default'}
        </span>
      </div>
    </div>
  );
};

export default TileInspector;
