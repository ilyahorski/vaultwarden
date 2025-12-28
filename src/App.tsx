import { useRef, useEffect } from 'react';

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
import { ClassSelection, PlayerHeader, GameGrid, CombatMenu, MobileControls } from './components/game';
import { PlayerMenu } from './components/game/PlayerMenu';
import { Sidebar } from './components/editor';

// Утилиты
import { rollActionDie } from './utils';

export default function DungeonApp() {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    onConsumeItem,
    handleExportCampaign,
    parseCampaignFile,
    createNewLevel, // <-- НОВОЕ
    switchLevel     // <-- НОВОЕ
  } = useGameState();

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

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

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

  const { movePlayer, toggleDoor } = usePlayerMovement({
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

  const { handleCellClick } = useEditorHandlers({
    mode,
    selectedTool,
    isMovingEnemy,
    setIsMovingEnemy,
    grid,
    setGrid,
    setPlayer
  });

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
    onConsumeItem
  });

  useFogOfWar({
    mode,
    player,
    grid,
    setGrid
  });

  const onGridClick = (x: number, y: number) => {
    if (mode === 'dm') {
      handleCellClick(x, y);
    } else {
      const cell = grid[y][x];
      if (cell.type === 'door_open') {
         toggleDoor(x, y);
      }
    }
  };
  
  // Расчет максимального этажа для пагинации в сайдбаре
  // Берем максимум из истории или текущего, если история еще не синхронизирована
  const maxLevel = Math.max(
      ...Object.keys(levelHistory).map(Number), 
      player.dungeonLevel
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      <Sidebar 
        mode={mode}
        selectedTool={selectedTool}
        onModeChange={setMode}
        onToolChange={setSelectedTool}
        onReset={() => generateDungeon(player.dungeonLevel)}
        onExport={handleExport}
        onImport={handleImport}
        onExportCampaign={handleExportCampaign}
        onAddLevel={createNewLevel}
        onSwitchLevel={switchLevel}
        currentLevel={player.dungeonLevel}
        totalLevels={maxLevel}        
        fileInputRef={fileInputRef}
        logs={logs}
        logsEndRef={logsEndRef}
      />

      <div className="flex-1 flex flex-col min-h-0 relative">
        
        {mode === 'player' && !hasChosenClass && (
          <ClassSelection onSelectClass={selectClass} onParseCampaign={parseCampaignFile} />
        )}

        {mode === 'player' && hasChosenClass && (
          <>
            <PlayerHeader 
              player={player}
              activeRoll={activeRoll}
              onRollDice={handleRollActionDie}
            />

            <div className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-4 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
              <div className="relative">
                <GameGrid 
                  grid={grid}
                  mode={mode}
                  playerX={player.x}
                  playerY={player.y}
                  isMovingEnemy={isMovingEnemy}
                  onCellClick={onGridClick} 
                />

                {isMenuOpen && !combatTarget && (
                  <PlayerMenu 
                    player={player}
                    activeMenu={activeMenu}
                    mainMenuIndex={mainMenuIndex}
                    subMenuIndex={subMenuIndex}
                    onClose={() => setIsMenuOpen(false)}
                  />
                )}

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

              {!combatTarget && !isMenuOpen && (
                <MobileControls onMove={movePlayer} />
              )}
            </div>
          </>
        )}

        {mode === 'dm' && (
          <div className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-4 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
            <GameGrid 
              grid={grid}
              mode={mode}
              playerX={player.x}
              playerY={player.y}
              isMovingEnemy={isMovingEnemy}
              onCellClick={onGridClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}