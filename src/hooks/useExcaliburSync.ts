import { useEffect, useRef } from 'react';
import type { Player, CombatTarget } from '../types';
import { EventBridge } from '../excalibur/utils/EventBridge';
import type { ExcaliburGame } from '../excalibur/ExcaliburGame';

interface UseExcaliburSyncProps {
  player: Player;
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  setIsMenuOpen: (open: boolean) => void;
  combatTarget: CombatTarget | null;
  setCombatTarget: (target: CombatTarget | null) => void;
  setShopOpen: (shop: { x: number; y: number } | null) => void;
  gameRef: React.RefObject<{ game: ExcaliburGame | null }>;
  addLog: (message: string, type?: string) => void;
}

/**
 * useExcaliburSync - синхронизация состояния между React и Excalibur
 *
 * Обрабатывает события от Excalibur:
 * - player:move - обновление позиции игрока
 * - trigger:bonfire - открытие меню у костра
 * - trigger:trap - урон от ловушки
 * - trigger:lava - урон от лавы
 * - trigger:merchant - открытие магазина
 * - combat:start - начало случайного боя
 */
export const useExcaliburSync = ({
  player,
  setPlayer,
  setIsMenuOpen,
  combatTarget,
  setCombatTarget,
  setShopOpen,
  gameRef,
  addLog
}: UseExcaliburSyncProps): void => {
  // Храним последнюю позицию для избежания лишних обновлений
  const lastPosRef = useRef({ x: player.x, y: player.y });

  useEffect(() => {
    // Excalibur → React: обновление позиции игрока
    const onPlayerMove = (data: { x: number; y: number; facing: string }) => {
      // Обновляем только если позиция действительно изменилась
      if (lastPosRef.current.x !== data.x || lastPosRef.current.y !== data.y) {
        lastPosRef.current = { x: data.x, y: data.y };

        setPlayer(prev => ({
          ...prev,
          x: data.x,
          y: data.y,
          facing: data.facing as any
        }));
      }
    };

    // Excalibur → React: костер (отдых)
    const onBonfire = () => {
      addLog('Вы нашли костер. Можете отдохнуть.', 'info');
      setIsMenuOpen(true);
      gameRef.current?.game?.pause();
    };

    // Excalibur → React: ловушка (фикс. урон 15 HP)
    const onTrap = (data: { damage: number }) => {
      setPlayer(prev => {
        const newHp = Math.max(0, prev.hp - data.damage);
        addLog(`Вы попали в ловушку! -${data.damage} HP`, 'damage');

        if (newHp === 0) {
          addLog('Вы погибли...', 'death');
        }

        return { ...prev, hp: newHp };
      });
    };

    // Excalibur → React: лава (фикс. урон 1 HP)
    const onLava = (data: { damage: number }) => {
      setPlayer(prev => {
        const newHp = Math.max(0, prev.hp - data.damage);
        addLog(`Вы коснулись лавы! -${data.damage} HP`, 'damage');

        if (newHp === 0) {
          addLog('Вы погибли...', 'death');
        }

        return { ...prev, hp: newHp };
      });
    };

    // Excalibur → React: торговец (магазин)
    const onMerchant = () => {
      addLog('Вы встретили торговца.', 'info');
      setShopOpen({ x: player.x, y: player.y });
      gameRef.current?.game?.pause();
    };

    // Excalibur → React: начало случайного боя
    const onCombatStart = (data: { enemy: string }) => {
      addLog(`Случайная встреча: ${data.enemy}!`, 'combat');
      setCombatTarget({
        x: player.x,
        y: player.y,
        enemy: data.enemy
      });
      gameRef.current?.game?.pause();
    };

    // Подписываемся на события
    EventBridge.on('player:move', onPlayerMove);
    EventBridge.on('trigger:bonfire', onBonfire);
    EventBridge.on('trigger:trap', onTrap);
    EventBridge.on('trigger:lava', onLava);
    EventBridge.on('trigger:merchant', onMerchant);
    EventBridge.on('combat:start', onCombatStart);

    // Cleanup при unmount
    return () => {
      EventBridge.off('player:move', onPlayerMove);
      EventBridge.off('trigger:bonfire', onBonfire);
      EventBridge.off('trigger:trap', onTrap);
      EventBridge.off('trigger:lava', onLava);
      EventBridge.off('trigger:merchant', onMerchant);
      EventBridge.off('combat:start', onCombatStart);
    };
  }, [player.x, player.y, setPlayer, setIsMenuOpen, setCombatTarget, setShopOpen, gameRef, addLog]);

  // React → Excalibur: возобновление игры после закрытия боя
  useEffect(() => {
    const game = gameRef.current?.game;
    if (!game) return;

    // Если бой завершён (combatTarget === null), завершаем его в CombatSystem
    if (combatTarget === null && game.isGamePaused && game.isGamePaused()) {
      console.log('useExcaliburSync: Combat ended, resuming game');
      game.endCombat();
      game.resume();
    }
  }, [combatTarget, gameRef]);
};

export default useExcaliburSync;
