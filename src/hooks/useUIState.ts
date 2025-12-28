import { useState } from 'react';
import type { CombatTarget, ActiveMenu } from '../types';

export const useUIState = () => {
  const [combatTarget, setCombatTarget] = useState<CombatTarget | null>(null);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('main');
  const [mainMenuIndex, setMainMenuIndex] = useState(0);
  const [subMenuIndex, setSubMenuIndex] = useState(0);
  const [activeRoll, setActiveRoll] = useState<number | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('wall');
  const [isMovingEnemy, setIsMovingEnemy] = useState<{ x: number; y: number } | null>(null);
  
  // --- НОВОЕ: Состояние открыто ли меню игрока ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return {
    combatTarget,
    setCombatTarget,
    activeMenu,
    setActiveMenu,
    mainMenuIndex,
    setMainMenuIndex,
    subMenuIndex,
    setSubMenuIndex,
    activeRoll,
    setActiveRoll,
    selectedTool,
    setSelectedTool,
    isMovingEnemy,
    setIsMovingEnemy,
    // --- Экспортируем новое состояние ---
    isMenuOpen,
    setIsMenuOpen
  };
};