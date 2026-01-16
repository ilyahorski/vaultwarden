import React, { useState } from "react";
import {
  Map as MapIcon,
  Settings,
  User,
  RefreshCw,
  Download,
  Box,
  Sword,
  Shield,
  FlaskConical,
  Coins,
  Wrench,
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
  Upload,
  Info,
  Dices,
  RotateCcw,
} from "lucide-react";
import type { GameMode, LogEntry } from "../../types";
import { ToolButton } from "../ui/ToolButton";
import { GEAR_STATS } from "../../constants";
import { EventLog } from "../game/EventLog";
import { MusicPlayer } from "../ui/MusicPlayer";
import { useIsMobile } from "../../hooks/useMediaQuery";

// Вертикальная кнопка таба для мобильных
const MobileTabBtn = ({
  active,
  onClick,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`p-2 rounded transition-colors ${
      active
        ? "bg-amber-600 text-white"
        : "bg-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-700"
    }`}
  >
    {icon}
  </button>
);

interface SidebarProps {
  mode: GameMode;
  selectedTool: string;
  onModeChange: (mode: GameMode) => void;
  onToolChange: (tool: string) => void;
  onResetGame: () => void;
  onResetCurrentLevel: () => void;
  onGenerateRandomLevel: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onExportCampaign: (name: string, password?: string) => void;
  onAddLevel: () => void;
  onSwitchLevel: (level: number) => void;
  currentLevel: number;
  totalLevels: number;
  logs: LogEntry[];
  logsEndRef: React.RefObject<HTMLDivElement | null>;
  onShowTutorial: () => void;
  isEditorRoute: boolean;
}

type TabType = "loot" | "utils";

export const Sidebar: React.FC<SidebarProps> = ({
  mode,
  selectedTool,
  onModeChange,
  onToolChange,
  onResetGame,
  onResetCurrentLevel,
  onGenerateRandomLevel,
  onExport,
  onImport,
  fileInputRef,
  onExportCampaign,
  onAddLevel,
  onSwitchLevel,
  currentLevel,
  totalLevels,
  logs,
  logsEndRef,
  onShowTutorial,
  isEditorRoute,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("loot");
  const isMobile = useIsMobile();

  const renderTabButton = (
    id: TabType,
    icon: React.ReactNode,
    label: string
  ) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex flex-col max-w-30 items-center justify-center p-2 text-[10px] font-bold uppercase tracking-wide transition-colors border-b-2 ${
        activeTab === id
          ? "border-amber-500 text-amber-500 bg-slate-900"
          : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
      }`}
    >
      <div className="mb-1">{icon}</div>
      {label}
    </button>
  );

  return (
    <div
      className={`bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 lg:w-96 lg:h-screen ${
        isMobile && mode === "player" ? "h-[20vh]" : "h-[30vh]"
      }`}
    >
      {/* Скрытый инпут для импорта */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onImport}
        className="hidden"
        accept=".json"
      />

      <div
        className={`shrink-0 border-b border-slate-800/50 ${
          isMobile ? "p-2" : "p-4"
        }`}
      >
        <div
          className={`flex items-center justify-between ${
            isMobile ? "mb-2" : "mb-4"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`bg-amber-600 rounded-lg shrink-0 ${
                isMobile ? "p-1.5" : "p-2"
              }`}
            >
              <MapIcon size={isMobile ? 16 : 20} />
            </div>
            <div>
              <h1
                className={`font-bold leading-none text-slate-100 ${
                  isMobile ? "text-sm" : "text-lg"
                }`}
              >
                Aetheria: The Cat’s Codex
              </h1>
              <span
                className={`text-slate-500 ${
                  isMobile ? "text-[10px]" : "text-xs"
                }`}
              >
                {mode === "dm" ? "Map Editor" : "RPG Mode"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Музыкальный плеер в хедере на мобильных */}
            {isMobile && <MusicPlayer />}
            <button
              onClick={onShowTutorial}
              className={`hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-amber-500 ${
                isMobile ? "p-1.5" : "p-2"
              }`}
              title="Как играть"
            >
              <Info size={isMobile ? 16 : 20} />
            </button>
          </div>
        </div>

        {/* Кнопки режимов — только в /editor */}
        {isEditorRoute && (
          <div className="flex gap-2">
            <button
              onClick={() => onModeChange("dm")}
              className={`flex-1 rounded flex items-center justify-center gap-1 transition-colors ${
                isMobile ? "p-1.5 text-xs" : "p-2 text-sm"
              } ${
                mode === "dm"
                  ? "bg-amber-600 text-white shadow-lg"
                  : "text-slate-500 hover:bg-slate-900 border border-transparent hover:border-slate-800"
              }`}
            >
              <Settings size={isMobile ? 14 : 18} />
              <span>Мастер</span>
            </button>
            <button
              onClick={() => onModeChange("player")}
              className={`flex-1 rounded flex items-center justify-center gap-1 transition-colors ${
                isMobile ? "p-1.5 text-xs" : "p-2 text-sm"
              } ${
                mode === "player"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-500 hover:bg-slate-900 border border-transparent hover:border-slate-800"
              }`}
            >
              <User size={isMobile ? 14 : 18} />
              <span>Игрок</span>
            </button>
          </div>
        )}

        {/* Музыкальный плеер — только на десктопе */}
        {!isMobile && (
          <div className="mt-2">
            <MusicPlayer />
          </div>
        )}
      </div>

      {mode === "dm" && (
        <div className="flex flex-1 w-full min-h-0">
          <div className={`flex flex-1 w-full min-h-0 ${isMobile ? "" : "flex-col"}`}>
            {!isMobile && (
              <div className="flex shrink-0 bg-slate-950 border-b border-slate-800">
                {renderTabButton("loot", <Coins size={18} />, "Лут")}
                {renderTabButton("utils", <Wrench size={18} />, "Разное")}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                {activeTab === "loot" && (
                  <div className="space-y-4">
                    <div className="mb-2">
                      <ToolButton
                        active={selectedTool === "item_chest"}
                        onClick={() => onToolChange("item_chest")}
                        icon={<Box size={16} className="text-yellow-500" />}
                        label="Случайный сундук"
                      />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 pl-1">
                        Здоровье (HP)
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        <ToolButton
                          active={selectedTool === "item_potion_weak"}
                          onClick={() => onToolChange("item_potion_weak")}
                          icon={
                            <FlaskConical size={16} className="text-red-300" />
                          }
                          label="Мал."
                        />
                        <ToolButton
                          active={selectedTool === "item_potion_mid"}
                          onClick={() => onToolChange("item_potion_mid")}
                          icon={
                            <FlaskConical size={16} className="text-red-500" />
                          }
                          label="Ср."
                        />
                        <ToolButton
                          active={selectedTool === "item_potion_strong"}
                          onClick={() => onToolChange("item_potion_strong")}
                          icon={
                            <FlaskConical size={16} className="text-red-700" />
                          }
                          label="Бол."
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 pl-1">
                        Мана (MP)
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        <ToolButton
                          active={selectedTool === "item_potion_mana_weak"}
                          onClick={() => onToolChange("item_potion_mana_weak")}
                          icon={
                            <FlaskConical size={16} className="text-blue-300" />
                          }
                          label="Мал."
                        />
                        <ToolButton
                          active={selectedTool === "item_potion_mana_mid"}
                          onClick={() => onToolChange("item_potion_mana_mid")}
                          icon={
                            <FlaskConical size={16} className="text-blue-500" />
                          }
                          label="Ср."
                        />
                        <ToolButton
                          active={selectedTool === "item_potion_mana_strong"}
                          onClick={() =>
                            onToolChange("item_potion_mana_strong")
                          }
                          icon={
                            <FlaskConical size={16} className="text-blue-700" />
                          }
                          label="Бол."
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-amber-200 uppercase tracking-widest mb-2 pl-1">
                        Оружие
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(GEAR_STATS)
                          .filter(([, stat]) => stat.type === "atk")
                          .map(([key, stat]) => (
                            <div
                              key={key}
                              title={`${stat.name} (+${stat.val} ATK)`}
                            >
                              <ToolButton
                                active={selectedTool === `item_${key}`}
                                onClick={() => onToolChange(`item_${key}`)}
                                icon={
                                  <Sword size={16} className={stat.color} />
                                }
                                label={stat.name}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                        Броня
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(GEAR_STATS)
                          .filter(([, stat]) => stat.type === "def")
                          .map(([key, stat]) => (
                            <div
                              key={key}
                              title={`${stat.name} (+${stat.val} DEF)`}
                            >
                              <ToolButton
                                active={selectedTool === `item_${key}`}
                                onClick={() => onToolChange(`item_${key}`)}
                                icon={
                                  <Shield size={16} className={stat.color} />
                                }
                                label={stat.name}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "utils" && (
                  <div className="space-y-4">
                    <div className="pb-4 border-b border-slate-800">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                        <Layers size={12} /> Управление этажами
                      </h3>

                      <div className="flex items-center justify-between bg-slate-900 rounded p-2 mb-2 border border-slate-800">
                        <button
                          disabled={currentLevel <= 1}
                          onClick={() => onSwitchLevel(currentLevel - 1)}
                          className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 hover:text-white transition-colors"
                        >
                          <ChevronLeft size={18} />
                        </button>

                        <div className="text-center">
                          <span className="block text-xs text-slate-500 uppercase font-bold">
                            Текущий этаж
                          </span>
                          <span className="text-lg font-bold text-amber-500">
                            {currentLevel}
                          </span>
                        </div>

                        <button
                          disabled={currentLevel >= totalLevels}
                          onClick={() => onSwitchLevel(currentLevel + 1)}
                          className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 hover:text-white transition-colors"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>

                      <button
                        onClick={onAddLevel}
                        className="w-full flex items-center justify-center gap-2 p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
                      >
                        <Plus size={14} /> Добавить новый этаж
                      </button>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">
                        Инструменты Карты
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <button
                          onClick={onExport}
                          className="flex items-center justify-center gap-2 p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
                        >
                          <Download size={14} /> Экспорт этажа
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
                        >
                          <Upload size={14} /> Импорт этажа
                        </button>
                      </div>

                      <button
                        onClick={onGenerateRandomLevel}
                        className="w-full flex items-center justify-center gap-2 p-2 mb-2 rounded bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-bold border border-emerald-700 transition-colors"
                      >
                        <Dices size={14} /> Сгенерировать случайный этаж
                      </button>

                      <button
                        onClick={onResetCurrentLevel}
                        className="w-full flex items-center justify-center gap-2 p-2 mb-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
                      >
                        <RotateCcw size={14} /> Очистить текущий этаж
                      </button>

                      <button
                        onClick={onResetGame}
                        className="w-full flex items-center justify-center gap-2 p-2 rounded-md text-xs font-medium text-red-400 hover:bg-red-900/20 border border-slate-800 hover:border-red-900 transition-colors"
                      >
                        <RefreshCw size={14} /> Сбросить всю игру
                      </button>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                      <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 pl-1">
                        Мастер Кампаний
                      </h3>
                      <div className="space-y-2">
                        <input
                          id="campName"
                          type="text"
                          placeholder="Название кампании"
                          className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white outline-none focus:border-amber-500"
                        />
                        <input
                          id="campPass"
                          type="text"
                          placeholder="Пароль (опционально)"
                          className="w-full bg-slate-900 border border-slate-700 p-2 text-xs rounded text-white outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={() => {
                            const name =
                              (
                                document.getElementById(
                                  "campName"
                                ) as HTMLInputElement
                              ).value || "My Dungeon";
                            const pass = (
                              document.getElementById(
                                "campPass"
                              ) as HTMLInputElement
                            ).value;
                            onExportCampaign(name, pass);
                          }}
                          className="w-full flex items-center justify-center gap-2 p-2 rounded bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
                        >
                          <Download size={14} /> Сохранить Кампанию (Все этажи)
                        </button>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Сохраняет ВСЕ посещенные/созданные уровни в один файл.
                          После создания используйте "Импорт" в меню выбора
                          класса.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isMobile && (
              <div className="flex flex-col gap-1 p-1 bg-slate-950 border-l border-slate-800">
                <MobileTabBtn
                  active={activeTab === "loot"}
                  onClick={() => setActiveTab("loot")}
                  icon={<Coins size={16} />}
                />
                <MobileTabBtn
                  active={activeTab === "utils"}
                  onClick={() => setActiveTab("utils")}
                  icon={<Wrench size={16} />}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Передаем logsEndRef с приведением типа на случай, если EventLog строгий */}
      {mode === "player" && (
        <EventLog
          logs={logs}
          logsEndRef={logsEndRef as React.RefObject<HTMLDivElement>}
        />
      )}
    </div>
  );
};
