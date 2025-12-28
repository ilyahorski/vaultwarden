import type { CellData, Player, LogEntry, PotionType, CombatTarget } from '../types';
import { MONSTER_STATS, CLASSES, POTION_STATS } from '../constants';
import { applyLevelUp } from '../utils';

interface UseCombatProps {
  grid: CellData[][];
  setGrid: (grid: CellData[][]) => void;
  player: Player;
  setPlayer: (player: Player | ((prev: Player) => Player)) => void;
  activeRoll: number | null;
  setActiveRoll: (roll: number | null) => void;
  addLog: (text: string, type?: LogEntry['type']) => void;
  setCombatTarget: (target: CombatTarget | null) => void;
  setActiveMenu: (menu: 'main' | 'skills' | 'items') => void;
  setMainMenuIndex: (index: number) => void;
  processEnemyTurn: (grid: CellData[][], player: Player) => void;
  setMode: (mode: 'dm' | 'player') => void;
}

export function useCombat({
  grid,
  setGrid,
  player,
  setPlayer,
  activeRoll,
  setActiveRoll,
  addLog,
  setCombatTarget,
  setActiveMenu,
  setMainMenuIndex,
  processEnemyTurn,
  setMode
}: UseCombatProps) {
  
  const executeCombatAction = (
    combatTarget: CombatTarget,
    type: 'attack' | 'skill' | 'item',
    skillId?: string,
    itemId?: string
  ) => {
    if (!combatTarget || !combatTarget.enemy) return;

    const enemyStats = MONSTER_STATS[combatTarget.enemy];
    const levelMultiplier = 1 + (player.dungeonLevel - 1) * 0.1;
    const scaledEnemyHp = Math.floor(enemyStats.hp * levelMultiplier);
    const scaledEnemyAtk = Math.floor(enemyStats.atk * levelMultiplier);
    const scaledEnemyGold = Math.floor(enemyStats.gold * levelMultiplier);

    const updates = { ...player };

    let roll = activeRoll;
    if (roll === null) {
      roll = Math.floor(Math.random() * 20) + 1;
    }
    setActiveRoll(null);

    const prefix = `[D20: ${roll}]`;
    const isSuccess = roll >= 16;
    const isFail = roll <= 5;

    let playerDmg = 0;
    let selfHealHp = 0;
    let selfHealMp = 0;
    let actionName = "Атака";

    if (type === 'attack') {
      playerDmg = Math.max(1, updates.atk + Math.floor(Math.random() * 3));
      if (isSuccess) playerDmg = Math.floor(playerDmg * 1.5);
      if (isFail) playerDmg = Math.floor(playerDmg * 0.5);
    } else if (type === 'skill' && skillId) {
      const skill = CLASSES[player.class].skills.find(s => s.id === skillId);
      if (!skill) return;

      updates.mp -= skill.mpCost;
      actionName = skill.name;

      if (skill.dmgMult) {
        playerDmg = Math.floor(updates.atk * skill.dmgMult);
        if (isSuccess) playerDmg = Math.floor(playerDmg * 1.5);
      }
      if (skill.heal) {
        selfHealHp = skill.heal;
        if (isSuccess) selfHealHp = Math.floor(selfHealHp * 1.5);
      }
    } else if (type === 'item' && itemId) {
      const potion = POTION_STATS[itemId as PotionType];
      actionName = potion.name;

      if (potion.type === 'hp') selfHealHp = potion.heal;
      if (potion.type === 'mp') selfHealMp = potion.mana;

      const idx = updates.inventory.indexOf(itemId as PotionType);
      if (idx > -1) {
        const newInv = [...updates.inventory];
        newInv.splice(idx, 1);
        updates.inventory = newInv;
      }
    }

    if (selfHealHp > 0) {
      updates.hp = Math.min(updates.maxHp, updates.hp + selfHealHp);
      addLog(`${prefix} ${actionName}: +${selfHealHp} HP`, 'success');
    }
    if (selfHealMp > 0) {
      updates.mp = Math.min(updates.maxMp, updates.mp + selfHealMp);
      addLog(`${prefix} ${actionName}: +${selfHealMp} MP`, 'success');
    }

    let isVictory = false;
    if (playerDmg > 0) {
      addLog(`${prefix} ${actionName} по ${enemyStats.name}: ${playerDmg} ур.`, 'combat');

      let killThreshold = (playerDmg / scaledEnemyHp) * 100 + 20;
      if (isSuccess) killThreshold += 30;
      if (isFail) killThreshold -= 20;

      const rollCheck = Math.random() * 100;
      if (rollCheck < killThreshold) {
        isVictory = true;
      }
    }

    if (isVictory) {
      addLog(`⚔️ Победили ${enemyStats.name}!`, 'combat');
      addLog(`Награда: +${enemyStats.xp} XP, +${scaledEnemyGold} Золота`, 'loot');

      const newGrid = [...grid];
      newGrid[combatTarget.y][combatTarget.x].enemy = null;
      setGrid(newGrid);

      updates.gold += scaledEnemyGold;
      applyLevelUp(updates, enemyStats.xp, addLog);

      setPlayer(updates);
      setCombatTarget(null);
      setActiveMenu('main');
      setMainMenuIndex(0);

      processEnemyTurn(grid, updates);
      return;
    }

    let enemyDmg = Math.max(0, scaledEnemyAtk - updates.def);
    if (isSuccess) enemyDmg = Math.floor(enemyDmg * 0.5);
    if (isFail) enemyDmg = Math.floor(enemyDmg * 1.5);

    if (enemyDmg > 0 && !isFail && playerDmg > 0) {
      addLog(`${enemyStats.name} бьет в ответ! -${enemyDmg} HP`, 'combat');
      updates.hp -= enemyDmg;
    } else if (playerDmg === 0 && selfHealHp === 0 && selfHealMp === 0) {
      addLog(`${enemyStats.name} пользуется моментом! -${enemyDmg} HP`, 'combat');
      updates.hp -= enemyDmg;
    }

    if (updates.hp <= 0) {
      addLog('💀 ВЫ ПОГИБЛИ! Рестарт...', 'fail');
      setMode('dm');
      setCombatTarget(null);
      setMainMenuIndex(0);
      setPlayer(updates);
      localStorage.removeItem('dungeon_save_v1');
      return;
    }

    setPlayer(updates);
    setCombatTarget(null);
    setActiveMenu('main');
    setMainMenuIndex(0);

    processEnemyTurn(grid, updates);
  };

  return { executeCombatAction };
}
