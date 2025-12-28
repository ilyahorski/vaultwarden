import { useEffect } from 'react';
import type { Player, GameMode, ActiveMenu, ClassType, CombatTarget } from '../types';
import { CLASSES } from '../constants';

interface UseKeyboardControlsProps {
  mode: GameMode;
  hasChosenClass: boolean;
  combatTarget: CombatTarget | null;
  activeMenu: ActiveMenu;
  mainMenuIndex: number;
  setMainMenuIndex: (value: number | ((prev: number) => number)) => void;
  subMenuIndex: number;
  setSubMenuIndex: (value: number | ((prev: number) => number)) => void;
  setActiveMenu: (menu: ActiveMenu) => void;
  player: Player;
  activeRoll: number | null;
  rollActionDie: () => void;
  movePlayer: (dx: number, dy: number) => void;
  executeCombatAction: (combatTarget: CombatTarget, type: 'attack' | 'skill' | 'item', skillId?: string, itemId?: string) => void;
  setCombatTarget: (target: CombatTarget | null) => void;
}

export function useKeyboardControls({
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
  rollActionDie,
  movePlayer,
  executeCombatAction,
  setCombatTarget
}: UseKeyboardControlsProps) {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'player' || !hasChosenClass) return;

      // Бросок кубика на Shift
      if (e.key === 'Shift') {
        if (!(activeRoll !== null && player.moves > 0)) {
          rollActionDie();
        }
        return;
      }

      if (combatTarget) {
        e.preventDefault();
        
        if (activeMenu === 'main') {
          const count = 4;
          if (e.key === 'ArrowUp') setMainMenuIndex(prev => (prev - 1 + count) % count);
          else if (e.key === 'ArrowDown') setMainMenuIndex(prev => (prev + 1) % count);
          else if (e.key === 'Enter' || e.key === 'ArrowRight') {
            if (mainMenuIndex === 0) { 
              if (e.key === 'Enter') executeCombatAction(combatTarget, 'attack'); 
            }
            else if (mainMenuIndex === 1) { 
              setActiveMenu('skills'); 
              setSubMenuIndex(0); 
            }
            else if (mainMenuIndex === 2) { 
              setActiveMenu('items'); 
              setSubMenuIndex(0); 
            }
            else if (mainMenuIndex === 3) { 
              if (e.key === 'Enter') setCombatTarget(null); 
            }
          }
        } else if (activeMenu === 'skills' || activeMenu === 'items') {
          const items = activeMenu === 'skills' 
            ? CLASSES[player.class as ClassType].skills 
            : Array.from(new Set(player.inventory));
          const count = items.length;
          
          if (count === 0 && e.key === 'ArrowLeft') { 
            setActiveMenu('main'); 
            return; 
          }
          
          if (count > 0) {
            if (e.key === 'ArrowUp') setSubMenuIndex(prev => (prev - 1 + count) % count);
            else if (e.key === 'ArrowDown') setSubMenuIndex(prev => (prev + 1) % count);
            else if (e.key === 'ArrowLeft') setActiveMenu('main');
            else if (e.key === 'Enter') {
              if (activeMenu === 'skills') {
                const skill = CLASSES[player.class as ClassType].skills[subMenuIndex];
                if (player.mp >= skill.mpCost) executeCombatAction(combatTarget, 'skill', skill.id);
              } else {
                const item = items[subMenuIndex];
                executeCombatAction(combatTarget, 'item', undefined, typeof item === 'string' ? item : undefined);
              }
            }
          }
        }
        return;
      }

      // Движение
      if (['ArrowUp', 'w'].includes(e.key)) movePlayer(0, -1);
      if (['ArrowDown', 's'].includes(e.key)) movePlayer(0, 1);
      if (['ArrowLeft', 'a'].includes(e.key)) movePlayer(-1, 0);
      if (['ArrowRight', 'd'].includes(e.key)) movePlayer(1, 0);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    mode, 
    hasChosenClass, 
    combatTarget, 
    activeMenu, 
    mainMenuIndex, 
    subMenuIndex, 
    player, 
    activeRoll,
    rollActionDie,
    movePlayer,
    executeCombatAction,
    setCombatTarget,
    setMainMenuIndex,
    setSubMenuIndex,
    setActiveMenu
  ]);
}
