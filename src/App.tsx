import React, { useRef, useEffect } from 'react';

// Хуки
import { useGameState } from './hooks/useGameState';
import { useUIState } from './hooks/useUIState';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useCombat } from './hooks/useCombat';
import { useEnemyAI } from './hooks/useEnemyAI';
import { useEditorHandlers } from './hooks/useEditorHandlers';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useFogOfWar } from './hooks/useFogOfWar';

// Компоненты
import { ClassSelection, PlayerHeader, EventLog, GameGrid, CombatMenu, MobileControls } from './components/game';
import { PlayerMenu } from './components/game/PlayerMenu';
import { Sidebar } from './components/editor';

// Утилиты
import { rollActionDie } from './utils';

export default function DungeonApp() {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Основное состояние игры
  const {
    grid, setGrid,
    player, setPlayer,
    logs,
    mode, setMode,
    hasChosenClass,
    levelHistory, setLevelHistory,
    addLog,
    generateDungeon,
    selectClass,
    handleExport,
    handleImport,
    useItem // <-- Получаем функцию
  } = useGameState();

  // UI состояние
  const {
    combatTarget, setCombatTarget,
    activeMenu, setActiveMenu,
    mainMenuIndex, setMainMenuIndex,
    subMenuIndex, setSubMenuIndex,
    activeRoll, setActiveRoll,
    selectedTool, setSelectedTool,
    isMovingEnemy, setIsMovingEnemy,
    isMenuOpen, setIsMenuOpen
  } = useUIState();

  // Автоскролл логов
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ИИ врагов
  const { processEnemyTurn } = useEnemyAI({
    mode,
    combatTarget,
    setGrid,
    player,
    setPlayer,
    addLog,
    setMode,
    setCombatTarget
  });

  // Движение игрока
  const { movePlayer } = usePlayerMovement({
    grid, setGrid,
    player, setPlayer,
    activeRoll, setActiveRoll,
    addLog,
    setCombatTarget,
    setActiveMenu,
    setMainMenuIndex,
    processEnemyTurn,
    levelHistory, setLevelHistory,
    generateDungeon,
    logs
  });

  // Боевая система
  const { executeCombatAction } = useCombat({
    grid, setGrid,
    player, setPlayer,
    activeRoll, setActiveRoll,
    addLog,
    setCombatTarget,
    setActiveMenu,
    setMainMenuIndex,
    processEnemyTurn,
    setMode
  });

  // Редактор карт
  const { handleCellClick } = useEditorHandlers({
    mode,
    selectedTool,
    isMovingEnemy,
    setIsMovingEnemy,
    grid,
    setGrid,
    setPlayer
  });

  // Функция броска кубика
  const handleRollActionDie = () => {
    rollActionDie(
      player,
      setPlayer,
      setActiveRoll,
      addLog,
      processEnemyTurn,
      grid
    );
  };

  // Обработка клавиатуры
  useKeyboardControls({
    mode,
    hasChosenClass,
    combatTarget,
    activeMenu,
    mainMenuIndex,
    setMainMenuIndex,
    subMenuIndex,
    setSubMenuIndex,
    setActiveMenu,
    player,
    activeRoll,
    rollActionDie: handleRollActionDie,
    movePlayer,
    executeCombatAction,
    setCombatTarget,
    isMenuOpen, 
    setIsMenuOpen,
    useItem // <-- Передаем в хук
  });

  // Fog of War
  useFogOfWar({
    mode,
    player,
    grid,
    setGrid
  });

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <Sidebar 
        mode={mode}
        selectedTool={selectedTool}
        onModeChange={setMode}
        onToolChange={setSelectedTool}
        onReset={() => generateDungeon(player.dungeonLevel)}
        onExport={handleExport}
        onImport={handleImport}
        fileInputRef={fileInputRef}
      />

      {/* Основная область */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        
        {/* Выбор класса */}
        {mode === 'player' && !hasChosenClass && (
          <ClassSelection onSelectClass={selectClass} />
        )}

        {mode === 'player' && hasChosenClass && (
          <>
            {/* Хедер игрока */}
            <PlayerHeader 
              player={player}
              activeRoll={activeRoll}
              onRollDice={handleRollActionDie}
            />

            {/* Карта */}
            <div className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-4 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
              <div className="relative">
                <GameGrid 
                  grid={grid}
                  mode={mode}
                  playerX={player.x}
                  playerY={player.y}
                  isMovingEnemy={isMovingEnemy}
                  onCellClick={handleCellClick}
                />

                {/* Меню игрока */}
                {isMenuOpen && !combatTarget && (
                  <PlayerMenu 
                    player={player}
                    activeMenu={activeMenu}
                    mainMenuIndex={mainMenuIndex}
                    subMenuIndex={subMenuIndex}
                    onClose={() => setIsMenuOpen(false)}
                  />
                )}

                {/* Меню боя */}
                {combatTarget && (
                  <CombatMenu 
                    combatTarget={combatTarget}
                    player={player}
                    activeMenu={activeMenu}
                    mainMenuIndex={mainMenuIndex}
                    subMenuIndex={subMenuIndex}
                    onAttack={() => executeCombatAction(combatTarget, 'attack')}
                    onSkill={(skillId) => executeCombatAction(combatTarget, 'skill', skillId)}
                    onItem={(itemId) => executeCombatAction(combatTarget, 'item', undefined, itemId)}
                    onFlee={() => setCombatTarget(null)}
                    onOpenSkills={() => { setActiveMenu('skills'); setSubMenuIndex(0); }}
                    onOpenItems={() => { setActiveMenu('items'); setSubMenuIndex(0); }}
                  />
                )}
              </div>

              {/* Мобильные контроллеры */}
              {!combatTarget && !isMenuOpen && (
                <MobileControls onMove={movePlayer} />
              )}
            </div>

            {/* Журнал событий */}
            <EventLog logs={logs} logsEndRef={logsEndRef} />
          </>
        )}

        {/* Режим мастера */}
        {mode === 'dm' && (
          <div className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-4 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
            <GameGrid 
              grid={grid}
              mode={mode}
              playerX={player.x}
              playerY={player.y}
              isMovingEnemy={isMovingEnemy}
              onCellClick={handleCellClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}