import { useEffect } from 'react';
import type { GameMode, CombatTarget, ActiveMenu, Player } from '../types';
import { CLASSES } from '../constants';

interface UseKeyboardControlsProps {
  mode: GameMode;
  hasChosenClass: boolean;
  combatTarget: CombatTarget | null;
  activeMenu: ActiveMenu;
  mainMenuIndex: number;
  setMainMenuIndex: (idx: number | ((prev: number) => number)) => void;
  subMenuIndex: number;
  setSubMenuIndex: (idx: number | ((prev: number) => number)) => void;
  setActiveMenu: (menu: ActiveMenu) => void;
  player: Player;
  activeRoll: number | null;
  rollActionDie: () => void;
  movePlayer: (dx: number, dy: number) => void;
  executeCombatAction: (target: CombatTarget, type: 'attack' | 'skill' | 'item', skillId?: string, itemId?: string) => void;
  setCombatTarget: (target: CombatTarget | null) => void;
  
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  useItem: (index: number) => void; // <-- Новый пропс
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
  setCombatTarget,
  isMenuOpen,
  setIsMenuOpen,
  useItem // <--
}: UseKeyboardControlsProps) {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Бросок кубика (пробел)
      if (e.code === 'Space') {
        e.preventDefault();
        if (activeRoll === null && mode === 'player') {
          rollActionDie();
        }
        return;
      }

      // 2. Логика в бою
      if (combatTarget) {
        if (activeRoll === null) return; 

        if (activeMenu === 'main') {
          if (e.key === 'ArrowUp') setMainMenuIndex(prev => (prev > 0 ? prev - 1 : 3));
          if (e.key === 'ArrowDown') setMainMenuIndex(prev => (prev < 3 ? prev + 1 : 0));
          if (e.key === 'Enter') {
            if (mainMenuIndex === 0) executeCombatAction(combatTarget, 'attack');
            if (mainMenuIndex === 1) { setActiveMenu('skills'); setSubMenuIndex(0); }
            if (mainMenuIndex === 2) { setActiveMenu('items'); setSubMenuIndex(0); }
            if (mainMenuIndex === 3) setCombatTarget(null); // Побег
          }
        } else if (activeMenu === 'skills') {
          const skills = CLASSES[player.class].skills;
          if (e.key === 'ArrowUp') setSubMenuIndex(prev => (prev > 0 ? prev - 1 : skills.length - 1));
          if (e.key === 'ArrowDown') setSubMenuIndex(prev => (prev < skills.length - 1 ? prev + 1 : 0));
          if (e.key === 'Escape') setActiveMenu('main');
          if (e.key === 'Enter' && skills.length > 0) {
            const skill = skills[subMenuIndex];
            if (player.mp >= skill.mpCost) {
              executeCombatAction(combatTarget, 'skill', skill.id);
            }
          }
        } else if (activeMenu === 'items') {
          const items = player.inventory;
          if (items.length === 0) {
            if (e.key === 'Escape') setActiveMenu('main');
            return;
          }
          if (e.key === 'ArrowUp') setSubMenuIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
          if (e.key === 'ArrowDown') setSubMenuIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
          if (e.key === 'Escape') setActiveMenu('main');
          if (e.key === 'Enter') {
            // В бою используем item по ID (передаем только тип, т.к. в бою логика удаления своя)
            executeCombatAction(combatTarget, 'item', undefined, items[subMenuIndex]);
          }
        }
        return;
      }

      // 3. Логика Меню (вне боя)
      if (isMenuOpen) {
        if (activeMenu === 'main') {
          if (e.key === 'ArrowUp') setMainMenuIndex(prev => (prev > 0 ? prev - 1 : 2));
          if (e.key === 'ArrowDown') setMainMenuIndex(prev => (prev < 2 ? prev + 1 : 0));
          if (e.key === 'Enter') {
            if (mainMenuIndex === 0) { setActiveMenu('skills'); setSubMenuIndex(0); }
            if (mainMenuIndex === 1) { setActiveMenu('items'); setSubMenuIndex(0); }
            if (mainMenuIndex === 2) setIsMenuOpen(false);
          }
          if (e.key === 'Escape') setIsMenuOpen(false);
        } 
        else if (activeMenu === 'skills') {
          const skills = CLASSES[player.class].skills;
          if (e.key === 'ArrowUp') setSubMenuIndex(prev => (prev > 0 ? prev - 1 : skills.length - 1));
          if (e.key === 'ArrowDown') setSubMenuIndex(prev => (prev < skills.length - 1 ? prev + 1 : 0));
          if (e.key === 'Escape') setActiveMenu('main');
        } 
        else if (activeMenu === 'items') {
          const items = player.inventory;
          if (items.length === 0) {
            if (e.key === 'Escape') setActiveMenu('main');
            return;
          }
          // Навигация
          if (e.key === 'ArrowUp') setSubMenuIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
          if (e.key === 'ArrowDown') setSubMenuIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
          if (e.key === 'Escape') setActiveMenu('main');
          
          // Использование / Экипировка
          if (e.key === 'Enter') {
            useItem(subMenuIndex);
            // После использования предмета список может уменьшиться
            // Корректируем индекс, чтобы он не вышел за пределы
            setSubMenuIndex(prev => Math.max(0, Math.min(prev, items.length - 2)));
          }
        }
        return;
      }

      // 4. Обычное движение
      if (mode === 'player' && hasChosenClass) {
        if (e.key === 'ArrowUp' || e.key === 'w') movePlayer(0, -1);
        if (e.key === 'ArrowDown' || e.key === 's') movePlayer(0, 1);
        if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer(-1, 0);
        if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(1, 0);
        
        if (e.key === 'Enter') {
          setIsMenuOpen(true);
          setActiveMenu('main');
          setMainMenuIndex(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    mode, hasChosenClass, combatTarget, activeMenu, mainMenuIndex, 
    subMenuIndex, player, activeRoll, rollActionDie, movePlayer, 
    executeCombatAction, setCombatTarget, isMenuOpen, setIsMenuOpen, useItem
  ]);
}