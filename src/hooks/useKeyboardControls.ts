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
  onConsumeItem: (index: number) => void;

  // Новые пропсы
  canCloseDoor: boolean;
  onCloseDoor: () => void;
  canLightTorch: boolean;
  onLightTorch: () => void;
  canOpenShop: boolean;
  onOpenShop: () => void;
  onUseSkill: (skillId: string) => void;
  isShopOpen: boolean;
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
  onConsumeItem,
  canCloseDoor,
  onCloseDoor,
  canLightTorch,
  onLightTorch,
  canOpenShop,
  onOpenShop,
  onUseSkill,
  isShopOpen
}: UseKeyboardControlsProps) {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 0. Если открыто меню магазина — блокируем все действия (ShopMenu сам обрабатывает клавиши)
      if (isShopOpen) {
        return;
      }

      // 1. Бросок кубика / Отдых (Shift)
      if (e.key === 'Shift') {
        if (activeRoll === null && mode === 'player') {
          rollActionDie();
        }
        return;
      }

      // 2. Логика в бою
      if (combatTarget) {
        if (activeMenu === 'main') {
          if (e.key === 'ArrowUp') setMainMenuIndex(prev => (prev > 0 ? prev - 1 : 3));
          if (e.key === 'ArrowDown') setMainMenuIndex(prev => (prev < 3 ? prev + 1 : 0));
          
          if (e.key === 'Enter' || e.key === 'ArrowRight') {
            if (mainMenuIndex === 0 && e.key === 'Enter') executeCombatAction(combatTarget, 'attack');
            if (mainMenuIndex === 1) { setActiveMenu('skills'); setSubMenuIndex(0); }
            if (mainMenuIndex === 2) { setActiveMenu('items'); setSubMenuIndex(0); }
            if (mainMenuIndex === 3 && e.key === 'Enter') setCombatTarget(null);
          }
        } 
        else if (activeMenu === 'skills') {
          const skills = CLASSES[player.class].skills;
          if (e.key === 'ArrowUp') setSubMenuIndex(prev => (prev > 0 ? prev - 1 : skills.length - 1));
          if (e.key === 'ArrowDown') setSubMenuIndex(prev => (prev < skills.length - 1 ? prev + 1 : 0));
          
          if (e.key === 'Escape' || e.key === 'ArrowLeft') setActiveMenu('main');
          
          if (e.key === 'Enter' && skills.length > 0) {
            const skill = skills[subMenuIndex];
            if (player.mp >= skill.mpCost) {
              executeCombatAction(combatTarget, 'skill', skill.id);
            }
          }
        } 
        else if (activeMenu === 'items') {
          const items = player.inventory;
          if (items.length === 0) {
            if (e.key === 'Escape' || e.key === 'ArrowLeft') setActiveMenu('main');
            return;
          }
          if (e.key === 'ArrowUp') setSubMenuIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
          if (e.key === 'ArrowDown') setSubMenuIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
          
          if (e.key === 'Escape' || e.key === 'ArrowLeft') setActiveMenu('main');
          
          if (e.key === 'Enter') {
            executeCombatAction(combatTarget, 'item', undefined, items[subMenuIndex]);
          }
        }
        return;
      }

      // 3. Логика Меню Игрока (вне боя)
      if (isMenuOpen) {
        if (activeMenu === 'main') {
          // Строим массив опций в том же порядке, что и в PlayerMenu
          const menuOptions: string[] = [];
          if (canCloseDoor) menuOptions.push('door');
          if (canLightTorch) menuOptions.push('torch');
          if (canOpenShop) menuOptions.push('shop');
          menuOptions.push('skills', 'items', 'close');

          const menuSize = menuOptions.length;

          if (e.key === 'ArrowUp') setMainMenuIndex(prev => (prev > 0 ? prev - 1 : menuSize - 1));
          if (e.key === 'ArrowDown') setMainMenuIndex(prev => (prev < menuSize - 1 ? prev + 1 : 0));

          if (e.key === 'Enter' || e.key === 'ArrowRight') {
            const currentOption = menuOptions[mainMenuIndex];
            if (currentOption === 'door' && e.key === 'Enter') { onCloseDoor(); }
            else if (currentOption === 'torch' && e.key === 'Enter') { onLightTorch(); }
            else if (currentOption === 'shop' && e.key === 'Enter') { onOpenShop(); }
            else if (currentOption === 'skills') { setActiveMenu('skills'); setSubMenuIndex(0); }
            else if (currentOption === 'items') { setActiveMenu('items'); setSubMenuIndex(0); }
            else if (currentOption === 'close' && e.key === 'Enter') setIsMenuOpen(false);
          }

          if (e.key === 'Escape' || e.key === 'ArrowLeft') setIsMenuOpen(false);
        } 
        else if (activeMenu === 'skills') {
          const skills = CLASSES[player.class].skills;
          if (e.key === 'ArrowUp') setSubMenuIndex(prev => (prev > 0 ? prev - 1 : skills.length - 1));
          if (e.key === 'ArrowDown') setSubMenuIndex(prev => (prev < skills.length - 1 ? prev + 1 : 0));

          if (e.key === 'Escape' || e.key === 'ArrowLeft') setActiveMenu('main');

          // Использование навыка вне боя (только лечащие навыки)
          if (e.key === 'Enter' && skills.length > 0) {
            const skill = skills[subMenuIndex];
            const isHealSkill = !!skill.heal && !skill.dmgMult;
            if (player.mp >= skill.mpCost && isHealSkill) {
              onUseSkill(skill.id);
            }
          }
        } 
        else if (activeMenu === 'items') {
          const items = player.inventory;
          if (items.length === 0) {
            if (e.key === 'Escape' || e.key === 'ArrowLeft') setActiveMenu('main');
            return;
          }
          if (e.key === 'ArrowUp') setSubMenuIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
          if (e.key === 'ArrowDown') setSubMenuIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
          
          if (e.key === 'Escape' || e.key === 'ArrowLeft') setActiveMenu('main');
          
          if (e.key === 'Enter') {
            onConsumeItem(subMenuIndex);
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
    
  }, [mode, hasChosenClass, combatTarget, activeMenu, mainMenuIndex, subMenuIndex, player, activeRoll,
    rollActionDie, movePlayer, executeCombatAction, setCombatTarget, isMenuOpen, setIsMenuOpen,
    onConsumeItem, setMainMenuIndex, setActiveMenu, setSubMenuIndex, canCloseDoor, onCloseDoor,
    canLightTorch, onLightTorch, canOpenShop, onOpenShop, onUseSkill, isShopOpen]);
}