import React, { useState, useMemo, useCallback } from 'react';
import {
  Users, Skull, MessageSquare, MapPin, Search, ChevronDown, ChevronRight,
  Swords, Shield, Wand2, X, Trash2
} from 'lucide-react';
import type { EnemyType } from '../../types';
import type { EntityConfig } from '../../excalibur/config/TilesetConfig';
import { MONSTER_STATS } from '../../constants';

interface EntityPlacerProps {
  /** Выбранная сущность для размещения */
  selectedEntity: EntityConfig | null;
  /** Callback при выборе сущности */
  onEntitySelect: (entity: EntityConfig | null) => void;
  /** Размещённые сущности на карте */
  placedEntities?: EntityConfig[];
  /** Callback для удаления сущности */
  onEntityRemove?: (entityId: string) => void;
  /** Callback при закрытии */
  onClose?: () => void;
}

// === Категории врагов ===
interface EnemyCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  enemies: { type: EnemyType; name: string }[];
}

const ENEMY_CATEGORIES: EnemyCategory[] = [
  {
    id: 'weak',
    name: 'Слабые',
    icon: <Skull size={14} className="text-green-400" />,
    enemies: [
      { type: 'snake', name: 'Змея' },
      { type: 'goblin', name: 'Гоблин' }
    ]
  },
  {
    id: 'goblins',
    name: 'Гоблины',
    icon: <Skull size={14} className="text-yellow-400" />,
    enemies: [
      { type: 'goblin_archer', name: 'Гоблин-лучник' },
      { type: 'goblin_fanatic', name: 'Гоблин-фанатик' },
      { type: 'goblin_fighter', name: 'Гоблин-боец' },
      { type: 'goblin_occultist', name: 'Гоблин-оккультист' },
      { type: 'goblin_wolf_rider', name: 'Гоблин-наездник' }
    ]
  },
  {
    id: 'halflings',
    name: 'Халфлинги',
    icon: <Skull size={14} className="text-orange-400" />,
    enemies: [
      { type: 'halfling_assassin', name: 'Халфлинг-убийца' },
      { type: 'halfling_bard', name: 'Халфлинг-бард' },
      { type: 'halfling_ranger', name: 'Халфлинг-рейнджер' },
      { type: 'halfling_rogue', name: 'Халфлинг-вор' },
      { type: 'halfling_slinger', name: 'Халфлинг-пращник' }
    ]
  },
  {
    id: 'lizardfolk',
    name: 'Ящеролюди',
    icon: <Skull size={14} className="text-teal-400" />,
    enemies: [
      { type: 'bestial_lizardfolk', name: 'Дикий ящер' },
      { type: 'lizardfolk_archer', name: 'Ящер-лучник' },
      { type: 'lizardfolk_gladiator', name: 'Ящер-гладиатор' },
      { type: 'lizardfolk_scout', name: 'Ящер-разведчик' },
      { type: 'lizardfolk_spearman', name: 'Ящер-копейщик' }
    ]
  },
  {
    id: 'undead',
    name: 'Нежить',
    icon: <Skull size={14} className="text-purple-400" />,
    enemies: [
      { type: 'skeleton', name: 'Скелет' },
      { type: 'zombie', name: 'Зомби' },
      { type: 'lich', name: 'Лич' },
      { type: 'mummy', name: 'Мумия' }
    ]
  },
  {
    id: 'orcs',
    name: 'Орки',
    icon: <Skull size={14} className="text-red-400" />,
    enemies: [
      { type: 'orc_grunt', name: 'Орк-рядовой' },
      { type: 'orc_warrior', name: 'Орк-воин' },
      { type: 'orc_berserker', name: 'Орк-берсерк' },
      { type: 'orc_shaman', name: 'Орк-шаман' },
      { type: 'orc_chief', name: 'Вождь орков' }
    ]
  },
  {
    id: 'bosses',
    name: 'Боссы',
    icon: <Swords size={14} className="text-rose-500" />,
    enemies: [
      { type: 'boss', name: 'Тёмный Рыцарь' }
    ]
  }
];

// === NPC шаблоны ===
interface NPCTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  dialogueId?: string;
}

const NPC_TEMPLATES: NPCTemplate[] = [
  { id: 'merchant', name: 'Торговец', icon: <Shield size={14} className="text-amber-400" /> },
  { id: 'quest_giver', name: 'Квестодатель', icon: <MessageSquare size={14} className="text-blue-400" /> },
  { id: 'guard', name: 'Стражник', icon: <Shield size={14} className="text-slate-400" /> },
  { id: 'villager', name: 'Житель', icon: <Users size={14} className="text-green-400" /> },
  { id: 'scholar', name: 'Учёный', icon: <Wand2 size={14} className="text-purple-400" /> },
  { id: 'blacksmith', name: 'Кузнец', icon: <Swords size={14} className="text-orange-400" /> }
];

export const EntityPlacer: React.FC<EntityPlacerProps> = ({
  selectedEntity,
  onEntitySelect,
  placedEntities = [],
  onEntityRemove,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'enemy' | 'npc' | 'placed'>('enemy');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    weak: true
  });

  // Фильтрация врагов по поиску
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return ENEMY_CATEGORIES;

    const query = searchQuery.toLowerCase();
    return ENEMY_CATEGORIES.map(cat => ({
      ...cat,
      enemies: cat.enemies.filter(e =>
        e.name.toLowerCase().includes(query) ||
        (e.type && e.type.toLowerCase().includes(query))
      )
    })).filter(cat => cat.enemies.length > 0);
  }, [searchQuery]);

  // Фильтрация NPC по поиску
  const filteredNPCs = useMemo(() => {
    if (!searchQuery) return NPC_TEMPLATES;
    const query = searchQuery.toLowerCase();
    return NPC_TEMPLATES.filter(npc =>
      npc.name.toLowerCase().includes(query) ||
      npc.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Создать конфигурацию врага
  const createEnemyEntity = useCallback((enemyType: EnemyType): EntityConfig => ({
    entityId: `enemy_${enemyType}_${Date.now()}`,
    entityType: 'enemy',
    enemyType,
    respawnable: true,
    respawnTime: 60000
  }), []);

  // Создать конфигурацию NPC
  const createNPCEntity = useCallback((template: NPCTemplate): EntityConfig => ({
    entityId: `npc_${template.id}_${Date.now()}`,
    entityType: 'npc',
    npcId: template.id,
    dialogueId: template.dialogueId
  }), []);

  // Получить статы врага
  const getEnemyStats = (enemyType: EnemyType) => {
    if (!enemyType) return { hp: 0, atk: 0, xp: 0, gold: 0, name: 'Unknown' };
    return MONSTER_STATS[enemyType] || { hp: 0, atk: 0, xp: 0, gold: 0, name: enemyType };
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 w-72 max-h-[500px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-purple-500" />
          <span className="font-medium text-white text-sm">Entity Placer</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('enemy')}
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === 'enemy'
              ? 'bg-slate-700 text-white border-b-2 border-red-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Skull size={12} className="inline mr-1" />
          Враги
        </button>
        <button
          onClick={() => setActiveTab('npc')}
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === 'npc'
              ? 'bg-slate-700 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare size={12} className="inline mr-1" />
          NPC
        </button>
        <button
          onClick={() => setActiveTab('placed')}
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === 'placed'
              ? 'bg-slate-700 text-white border-b-2 border-green-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapPin size={12} className="inline mr-1" />
          Размещены ({placedEntities.length})
        </button>
      </div>

      {/* Search */}
      {activeTab !== 'placed' && (
        <div className="p-2 border-b border-slate-700">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="w-full bg-slate-900 border border-slate-700 rounded pl-7 pr-2 py-1.5 text-sm text-white placeholder-slate-500"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Враги */}
        {activeTab === 'enemy' && (
          <div className="p-2">
            {filteredCategories.map(category => (
              <div key={category.id} className="mb-2">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center gap-2 w-full text-left text-slate-300 hover:text-white p-1.5 rounded hover:bg-slate-700/50"
                >
                  {expandedCategories[category.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {category.icon}
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="ml-auto text-xs text-slate-500">{category.enemies.length}</span>
                </button>

                {expandedCategories[category.id] && (
                  <div className="ml-4 space-y-1 mt-1">
                    {category.enemies.map(enemy => {
                      const stats = getEnemyStats(enemy.type);
                      const isSelected = selectedEntity?.enemyType === enemy.type;

                      return (
                        <button
                          key={enemy.type}
                          onClick={() => onEntitySelect(createEnemyEntity(enemy.type))}
                          className={`w-full flex items-center gap-2 p-2 rounded text-left transition-colors ${
                            isSelected
                              ? 'bg-red-600/30 border border-red-600/50 text-white'
                              : 'bg-slate-900/50 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          <Skull size={12} className={isSelected ? 'text-red-400' : 'text-slate-500'} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{enemy.name}</p>
                            <p className="text-xs text-slate-500">
                              HP:{stats.hp} ATK:{stats.atk} XP:{stats.xp}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* NPC */}
        {activeTab === 'npc' && (
          <div className="p-2 space-y-1">
            {filteredNPCs.map(npc => {
              const isSelected = selectedEntity?.npcId === npc.id;

              return (
                <button
                  key={npc.id}
                  onClick={() => onEntitySelect(createNPCEntity(npc))}
                  className={`w-full flex items-center gap-2 p-2 rounded text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-600/30 border border-blue-600/50 text-white'
                      : 'bg-slate-900/50 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {npc.icon}
                  <span className="text-sm">{npc.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Размещённые сущности */}
        {activeTab === 'placed' && (
          <div className="p-2">
            {placedEntities.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                Нет размещённых сущностей
              </p>
            ) : (
              <div className="space-y-1">
                {placedEntities.map(entity => (
                  <div
                    key={entity.entityId}
                    className="flex items-center gap-2 p-2 bg-slate-900/50 rounded"
                  >
                    {entity.entityType === 'enemy' ? (
                      <Skull size={12} className="text-red-400" />
                    ) : (
                      <Users size={12} className="text-blue-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">
                        {entity.entityType === 'enemy' ? entity.enemyType : entity.npcId}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{entity.entityId}</p>
                    </div>
                    {onEntityRemove && (
                      <button
                        onClick={() => onEntityRemove(entity.entityId)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedEntity && (
        <div className="p-2 border-t border-slate-700 bg-slate-900/30">
          <div className="flex items-center gap-2 text-xs">
            <MapPin size={12} className="text-green-400" />
            <span className="text-slate-400">Выбрано:</span>
            <span className="text-white truncate">
              {selectedEntity.entityType === 'enemy' ? selectedEntity.enemyType : selectedEntity.npcId}
            </span>
            <button
              onClick={() => onEntitySelect(null)}
              className="ml-auto text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityPlacer;
