import React from 'react';
import {
  Map as MapIcon,
  Settings,
  User,
  RefreshCw,
  Download,
  Upload,
  Box,
  Droplets,
  Flame,
  Trees,
  DoorClosed,
  EyeOff,
  Ghost,
  Skull,
  Footprints,
  Heart,
  Zap,
  Sword,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import type { GameMode } from '../../types';
import { ToolButton } from '../ui/ToolButton';

interface SidebarProps {
  mode: GameMode;
  selectedTool: string;
  onModeChange: (mode: GameMode) => void;
  onToolChange: (tool: string) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mode,
  selectedTool,
  onModeChange,
  onToolChange,
  onReset,
  onExport,
  onImport,
  fileInputRef
}) => {
  return (
    <div className={`
      bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800 
      flex flex-col p-4 shrink-0 transition-all duration-300
      ${mode === 'player' ? 'lg:w-20' : 'lg:w-72'} 
      lg:h-screen lg:overflow-y-auto
    `}>
      {/* Шапка Sidebar */}
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600 p-2 rounded-lg shrink-0"><MapIcon size={20} /></div>
          <div className={`${mode === 'player' ? 'lg:hidden' : 'block'}`}>
            <h1 className="font-bold text-lg leading-none">Vaultwarden</h1>
            <span className="text-xs text-slate-500">Map Editor</span>
          </div>
        </div>
      </div>

      {/* Переключатели Режимов */}
      <div className="flex lg:flex-col gap-2 mb-4">
        <button
          onClick={() => onModeChange('dm')}
          className={`p-2 rounded flex items-center gap-2 text-sm transition-colors ${mode === 'dm' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-900 border border-transparent hover:border-slate-800'}`}
        >
          <Settings size={20} className="shrink-0" />
          <span className={`${mode === 'player' ? 'lg:hidden' : 'inline'}`}>Мастер</span>
        </button>
        <button
          onClick={() => onModeChange('player')}
          className={`p-2 rounded flex items-center gap-2 text-sm transition-colors ${mode === 'player' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-900 border border-transparent hover:border-slate-800'}`}
        >
          <User size={20} className="shrink-0" />
          <span className={`${mode === 'player' ? 'lg:hidden' : 'inline'}`}>Игрок</span>
        </button>
        <div className="w-px h-8 bg-slate-800 lg:w-full lg:h-px lg:my-2 mx-2 lg:mx-0"></div>
        <button
          onClick={onReset}
          className="p-2 rounded text-red-400 hover:bg-red-900/20 border border-slate-800 hover:border-red-900 flex items-center gap-2"
        >
          <RefreshCw size={20} className="shrink-0" />
          <span className={`${mode === 'player' ? 'lg:hidden' : 'hidden lg:inline'}`}>Reset</span>
        </button>
      </div>

      {/* ИНСТРУМЕНТЫ МАСТЕРА */}
      {mode === 'dm' && (
        <div className="flex-1 space-y-6 animate-in fade-in duration-300 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {/* Сохранение / Загрузка */}
          <div className="min-w-[200px]">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Файл</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExport}
                className="flex items-center gap-2 p-2 rounded-md text-xs font-medium bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              >
                <Download size={16} /> Экспорт
              </button>
              <label className="flex items-center gap-2 p-2 rounded-md text-xs font-medium bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800 cursor-pointer">
                <Upload size={16} /> Импорт
                <input type="file" className="hidden" accept=".json" onChange={onImport} ref={fileInputRef} />
              </label>
            </div>
          </div>

          {/* Структура */}
          <div className="min-w-[200px]">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Структура</h3>
            <div className="grid grid-cols-2 gap-2">
              <ToolButton active={selectedTool === 'wall'} onClick={() => onToolChange('wall')} icon={<Box size={16} />} label="Стена" />
              <ToolButton active={selectedTool === 'floor'} onClick={() => onToolChange('floor')} icon={<MapIcon size={16} />} label="Пол" />
              <ToolButton active={selectedTool === 'stairs_down'} onClick={() => onToolChange('stairs_down')} icon={<ArrowDownCircle size={16} className="text-blue-400" />} label="Вниз" />
              <ToolButton active={selectedTool === 'stairs_up'} onClick={() => onToolChange('stairs_up')} icon={<ArrowUpCircle size={16} className="text-blue-400" />} label="Вверх" />
              <ToolButton active={selectedTool === 'water'} onClick={() => onToolChange('water')} icon={<Droplets size={16} className="text-blue-400" />} label="Вода" />
              <ToolButton active={selectedTool === 'lava'} onClick={() => onToolChange('lava')} icon={<Flame size={16} className="text-red-500" />} label="Лава" />
              <ToolButton active={selectedTool === 'grass'} onClick={() => onToolChange('grass')} icon={<Trees size={16} className="text-green-500" />} label="Лес" />
              <ToolButton active={selectedTool === 'door'} onClick={() => onToolChange('door')} icon={<DoorClosed size={16} />} label="Дверь" />
              <ToolButton active={selectedTool === 'secret'} onClick={() => onToolChange('secret')} icon={<EyeOff size={16} />} label="Секрет" />
              <ToolButton active={selectedTool === 'trap'} onClick={() => onToolChange('trap')} icon={<Flame size={16} />} label="Ловушка" />
            </div>
          </div>

          {/* Враги */}
          <div className="min-w-[200px]">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Враги</h3>
            <div className="grid grid-cols-2 gap-2">
              <ToolButton active={selectedTool === 'enemy_goblin'} onClick={() => onToolChange('enemy_goblin')} icon={<Ghost size={16} className="text-green-500" />} label="Гоблин" />
              <ToolButton active={selectedTool === 'enemy_orc'} onClick={() => onToolChange('enemy_orc')} icon={<Skull size={16} className="text-red-500" />} label="Орк" />
              <ToolButton active={selectedTool === 'enemy_boss'} onClick={() => onToolChange('enemy_boss')} icon={<Skull size={16} className="text-purple-500" />} label="Босс" />
              <ToolButton active={selectedTool === 'move_enemy'} onClick={() => onToolChange('move_enemy')} icon={<Footprints size={16} className="text-blue-500" />} label="Двигать" />
            </div>
          </div>

          {/* Лут */}
          <div className="min-w-[200px]">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Лут</h3>
            <div className="grid grid-cols-2 gap-2">
              <ToolButton active={selectedTool === 'item_chest'} onClick={() => onToolChange('item_chest')} icon={<Box size={16} className="text-yellow-500" />} label="Сундук" />
              <ToolButton active={selectedTool === 'item_potion_weak'} onClick={() => onToolChange('item_potion_weak')} icon={<Heart size={16} className="text-red-400" />} label="HP (S)" />
              <ToolButton active={selectedTool === 'item_potion_mana'} onClick={() => onToolChange('item_potion_mana')} icon={<Zap size={16} className="text-blue-500" />} label="MP (M)" />
              <ToolButton active={selectedTool === 'item_weapon_strong'} onClick={() => onToolChange('item_weapon_strong')} icon={<Sword size={16} className="text-blue-300" />} label="Меч" />
            </div>
          </div>

          {/* Утилиты */}
          <div className="min-w-[200px]">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Разное</h3>
            <div className="grid grid-cols-2 gap-2">
              <ToolButton active={selectedTool === 'start'} onClick={() => onToolChange('start')} icon={<User size={16} />} label="Старт" />
              <ToolButton active={selectedTool === 'clear'} onClick={() => onToolChange('clear')} icon={<Trash2 size={16} />} label="Ластик" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
