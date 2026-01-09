import { useRef, useEffect, useCallback, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// Хуки
import { useGameState } from './hooks/useGameState';
import { useUIState } from './hooks/useUIState';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useCombat } from './hooks/useCombat';
import { useEnemyAI } from './hooks/useEnemyAI';
import { useEditorHandlers } from './hooks/useEditorHandlers';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useFogOfWar } from './hooks/useFogOfWar';
import { useIsMobile } from './hooks/useMediaQuery';

// Компоненты
import { ClassSelection, PlayerHeader, GameGrid, CombatMenu, MobileControls, TutorialPopup } from './components/game';
import { PlayerMenu } from './components/game/PlayerMenu';
import { ShopMenu } from './components/game/ShopMenu';
import { Sidebar } from './components/editor';

// Константы

// Утилиты
import { rollActionDie } from './utils';
import { CLASSES } from './constants';

interface DungeonAppProps {
  initialMode?: 'player' | 'dm';
}

export default function DungeonApp({ initialMode }: DungeonAppProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [shopOpen, setShopOpen] = useState<{ x: number; y: number } | null>(null);
  const isMobile = useIsMobile();

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
    createNewLevel,
    switchLevel,
    resetGame,
    resetCurrentLevel,
    generateRandomLevel
  } = useGameState({ initialMode });

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
    resetGame
  });

  const { movePlayer, toggleDoor, lightTorch } = usePlayerMovement({
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
    resetGame
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

  const handleRollActionDie = useCallback(() => {
    rollActionDie(
      player,
      setPlayer,
      setActiveRoll,
      addLog,
      processEnemyTurn,
      grid
    );
  }, [player, setPlayer, setActiveRoll, addLog, processEnemyTurn, grid]);

  // Проверка на наличие открытой двери рядом
  const getAdjacentDoor = () => {
    if (!grid || !grid.length) return null;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
        const nx = player.x + dx;
        const ny = player.y + dy;
        if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
            if (grid[ny][nx].type === 'door_open') {
                return { x: nx, y: ny };
            }
        }
    }
    return null;
  };

  // Проверка на наличие потухшего факела рядом
  const getAdjacentTorch = () => {
    if (!grid || !grid.length) return null;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
        const nx = player.x + dx;
        const ny = player.y + dy;
        if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
            if (grid[ny][nx].type === 'torch') {
                return { x: nx, y: ny };
            }
        }
    }
    return null;
  };

  const adjacentDoor = getAdjacentDoor();
  const canCloseDoor = !!adjacentDoor;

  const adjacentTorch = getAdjacentTorch();
  const canLightTorch = !!adjacentTorch;

  // Проверка на наличие торговца рядом
  const getAdjacentMerchant = () => {
    if (!grid || !grid.length) return null;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = player.x + dx;
      const ny = player.y + dy;
      if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
        if (grid[ny][nx].type === 'merchant') {
          return { x: nx, y: ny };
        }
      }
    }
    return null;
  };

  const adjacentMerchant = getAdjacentMerchant();
  const canOpenShop = !!adjacentMerchant;

  // Проверка на наличие костра рядом (для отдыха как в Dark Souls)
  const getAdjacentBonfire = () => {
    if (!grid || !grid.length) return null;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = player.x + dx;
      const ny = player.y + dy;
      if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
        if (grid[ny][nx].type === 'bonfire') {
          return { x: nx, y: ny };
        }
      }
    }
    return null;
  };

  const adjacentBonfire = getAdjacentBonfire();
  const canRestAtBonfire = !!adjacentBonfire;

  const handleOpenShop = useCallback(() => {
    if (adjacentMerchant) {
      setShopOpen(adjacentMerchant);
      setIsMenuOpen(false);
    }
  }, [adjacentMerchant, setIsMenuOpen]);

  // Функции покупки и продажи
  const handleBuyItem = useCallback((itemType: string, price: number) => {
    if (player.gold < price) {
      addLog('Недостаточно золота!', 'fail');
      return;
    }

    setPlayer(prev => ({
      ...prev,
      gold: prev.gold - price,
      inventory: [...prev.inventory, itemType as typeof prev.inventory[0]]
    }));

    const itemName = itemType.includes('potion') ? 'зелье' : itemType.includes('weapon') ? 'оружие' : 'броню';
    addLog(`Куплено ${itemName} за ${price} золота`, 'loot');
  }, [player.gold, addLog, setPlayer]);

  const handleSellItem = useCallback((inventoryIndex: number, price: number) => {
    setPlayer(prev => {
      const newInventory = [...prev.inventory];
      newInventory.splice(inventoryIndex, 1);
      addLog(`Продано за ${price} золота`, 'loot');
      return {
        ...prev,
        gold: prev.gold + price,
        inventory: newInventory
      };
    });
  }, [addLog, setPlayer]);

  const handleCloseDoor = () => {
      if (adjacentDoor) {
          toggleDoor(adjacentDoor.x, adjacentDoor.y);
          setIsMenuOpen(false);
      }
  };

  const handleLightTorch = () => {
      if (adjacentTorch) {
          lightTorch(adjacentTorch.x, adjacentTorch.y);
          setIsMenuOpen(false);
      }
  };

  // Отдых у костра - восстановление HP и MP до максимума
  const handleRest = useCallback(() => {
    if (!canRestAtBonfire) return;

    setPlayer(prev => {
      const hpRestored = prev.maxHp - prev.hp;
      const mpRestored = prev.maxMp - prev.mp;

      if (hpRestored === 0 && mpRestored === 0) {
        addLog('Вы уже полностью отдохнули.', 'info');
        return prev;
      }

      addLog(`Отдых у костра: +${hpRestored} HP, +${mpRestored} MP`, 'rest');
      return {
        ...prev,
        hp: prev.maxHp,
        mp: prev.maxMp
      };
    });

    setIsMenuOpen(false);
  }, [canRestAtBonfire, addLog, setPlayer, setIsMenuOpen]);

  // Использование навыка вне боя (только лечащие навыки)
  const handleUseSkill = useCallback((skillId: string) => {
    const skill = CLASSES[player.class].skills.find(s => s.id === skillId);
    if (!skill) return;

    // Проверяем, что это лечащий навык без урона
    const isHealSkill = !!skill.heal && !skill.dmgMult;
    if (!isHealSkill) {
      addLog(`${skill.name} можно использовать только в бою!`, 'info');
      return;
    }

    // Проверяем ману
    if (player.mp < skill.mpCost) {
      addLog(`Недостаточно маны для ${skill.name}!`, 'fail');
      return;
    }

    // Применяем эффект
    setPlayer(prev => {
      const newHp = Math.min(prev.maxHp, prev.hp + skill.heal!);
      const healedAmount = newHp - prev.hp;

      if (healedAmount > 0) {
        addLog(`${skill.name}: +${healedAmount} HP (${skill.mpCost} MP)`, 'success');
      } else {
        addLog(`Здоровье уже полное!`, 'info');
        return prev; // Не тратим ману если HP полное
      }

      return {
        ...prev,
        hp: newHp,
        mp: prev.mp - skill.mpCost
      };
    });
  }, [player.class, player.mp, addLog, setPlayer]);

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
    onConsumeItem,
    canCloseDoor,
    onCloseDoor: handleCloseDoor,
    canLightTorch,
    onLightTorch: handleLightTorch,
    canOpenShop,
    onOpenShop: handleOpenShop,
    canRestAtBonfire,
    onRest: handleRest,
    onUseSkill: handleUseSkill,
    isShopOpen: !!shopOpen
  });

  useFogOfWar({
    mode,
    player,
    grid,
    setGrid
  });

  // Используем ref для grid чтобы callback не пересоздавался на каждое изменение grid
  const gridRef = useRef(grid);
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  const onGridClick = useCallback((x: number, y: number) => {
    if (mode === 'dm') {
      handleCellClick(x, y);
    } else {
      const cell = gridRef.current[y][x];
      if (cell.type === 'door_open') {
         toggleDoor(x, y);
      }
    }
  }, [mode, handleCellClick, toggleDoor]);
  
  // Расчет максимального этажа для пагинации в сайдбаре
  const maxLevel = Math.max(
      ...Object.keys(levelHistory).map(Number),
      player.dungeonLevel
  );

  // Обработчик Enter для мобильных (открытие меню / подтверждение)
  const handleMobileEnter = useCallback(() => {
    if (!combatTarget && !shopOpen && !isMenuOpen) {
      // Вне боя и меню - открыть меню игрока
      setIsMenuOpen(true);
      setActiveMenu('main');
      setMainMenuIndex(0);
    }
    // В бою или в меню - эмулируем нажатие Enter через событие клавиатуры
    // чтобы использовать существующую логику useKeyboardControls
    else {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    }
  }, [combatTarget, shopOpen, isMenuOpen, setIsMenuOpen, setActiveMenu, setMainMenuIndex]);

  // Обработчик Shift для мобильных (бросок кубика)
  const handleMobileShift = useCallback(() => {
    if (activeRoll === null && mode === 'player') {
      handleRollActionDie();
    }
  }, [activeRoll, mode, handleRollActionDie]);

  // Обработчик стрелок для мобильных (движение или навигация по меню)
  const handleMobileArrow = useCallback((dx: number, dy: number) => {
    // Если открыто меню или бой - эмулируем клавиши для навигации
    if (isMenuOpen || combatTarget) {
      let key = '';
      if (dy === -1) key = 'ArrowUp';
      else if (dy === 1) key = 'ArrowDown';
      else if (dx === -1) key = 'ArrowLeft';
      else if (dx === 1) key = 'ArrowRight';
      if (key) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
      }
    } else {
      // Обычное движение
      movePlayer(dx, dy);
    }
  }, [isMenuOpen, combatTarget, movePlayer]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <Analytics />
      
      <Sidebar
        mode={mode}
        selectedTool={selectedTool}
        onModeChange={setMode}
        onToolChange={setSelectedTool}
        onResetGame={resetGame}
        onResetCurrentLevel={resetCurrentLevel}
        onGenerateRandomLevel={generateRandomLevel}
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
        onShowTutorial={() => setShowTutorial(true)}
        isEditorRoute={initialMode === 'dm'}
      />

      {showTutorial && (
        <TutorialPopup onClose={() => setShowTutorial(false)} />
      )}

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

            {/* Контейнер карты - на мобильных занимает 50vh и начинается от 30vh сверху */}
            <div className={`bg-slate-950 overflow-hidden flex relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-size-[20px_20px] ${isMobile ? 'h-[57vh]' : 'flex-1 p-4 overflow-auto'}`}>
              <TransformWrapper
                initialScale={isMobile ? 0.6 : 1}
                minScale={0.3}
                maxScale={2}
                centerOnInit={true}
                disabled={!isMobile}
                panning={{ disabled: !isMobile }}
                pinch={{ disabled: !isMobile }}
                doubleClick={{ disabled: true }}
              >
                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ width: 'fit-content', height: 'fit-content' }}
                >
                  <div className="relative">
                    <GameGrid
                      grid={grid}
                      mode={mode}
                      playerX={player.x}
                      playerY={player.y}
                      playerClass={player.class}
                      playerDirection={player.facing}
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
                        canCloseDoor={canCloseDoor}
                        onCloseDoor={handleCloseDoor}
                        canLightTorch={canLightTorch}
                        onLightTorch={handleLightTorch}
                        canOpenShop={canOpenShop}
                        onOpenShop={handleOpenShop}
                        canRestAtBonfire={canRestAtBonfire}
                        onRest={handleRest}
                        onUseSkill={handleUseSkill}
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

                    {shopOpen && (
                      <ShopMenu
                        player={player}
                        merchantPosition={shopOpen}
                        onBuy={handleBuyItem}
                        onSell={handleSellItem}
                        onClose={() => setShopOpen(null)}
                      />
                    )}
                  </div>
                </TransformComponent>
              </TransformWrapper>
            </div>

            {/* MobileControls - фиксированная панель внизу на мобильных */}
            {isMobile && (
              <MobileControls
                onMove={handleMobileArrow}
                onEnter={handleMobileEnter}
                onShift={handleMobileShift}
              />
            )}
          </>
        )}

        {mode === 'dm' && (
          <>
            <div className={`bg-slate-950 overflow-hidden flex relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-size-[20px_20px] ${isMobile ? 'h-[70vh]' : 'flex-1 p-4 overflow-auto'}`}>
              <TransformWrapper
                initialScale={isMobile ? 0.6 : 1}
                minScale={0.3}
                maxScale={2}
                centerOnInit={true}
                disabled={!isMobile}
                panning={{ disabled: !isMobile }}
                pinch={{ disabled: !isMobile }}
                doubleClick={{ disabled: true }}
              >
                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ width: 'fit-content', height: 'fit-content' }}
                >
                  <div className="relative">
                    <GameGrid
                      grid={grid}
                      mode={mode}
                      playerX={player.x}
                      playerY={player.y}
                      playerClass={player.class}
                      playerDirection={player.facing}
                      isMovingEnemy={isMovingEnemy}
                      onCellClick={onGridClick}
                    />
                  </div>
                </TransformComponent>
              </TransformWrapper>
            </div>
          </>
        )}
      </div>
    </div>
  );
}