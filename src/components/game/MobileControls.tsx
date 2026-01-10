import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft, Zap } from 'lucide-react';

interface MobileControlsProps {
  onMove: (dx: number, dy: number) => void;
  onEnter?: () => void;
  onShift?: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onEnter,
  onShift
}) => {
  const buttonClass = "p-3 bg-slate-800 rounded-full border border-slate-600 active:bg-blue-600 touch-manipulation select-none";
  const actionButtonClass = "mim-w-20 w-30 p-3 bg-slate-800 rounded-lg border border-slate-600 active:bg-amber-600 touch-manipulation select-none flex items-center justify-center gap-1";

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[16vh] bg-slate-900/95 border-t border-slate-700 md:hidden z-30 flex items-center justify-between px-6">
      {/* Левая часть: Enter и Shift */}

      <div className="flex h-full flex-col items-start mt-5">
        <button
          onClick={onEnter}
          className={actionButtonClass}
          title="Enter - Меню"
        >
          <CornerDownLeft size={18} />
          <span className="flex text-[10px] font-bold">Меню</span>
        </button>  
      </div>
  
      {/* Правая часть: D-pad для движения */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => onMove(0, -1)}
          className={buttonClass}
        >
          <ArrowUp size={20} />
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => onMove(-1, 0)}
            className={buttonClass}
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => onMove(0, 1)}
            className={buttonClass}
          >
            <ArrowDown size={20} />
          </button>
          <button
            onClick={() => onMove(1, 0)}
            className={buttonClass}
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex h-full flex-col items-start mt-5">
        <button
          onClick={onShift}
          className={actionButtonClass}
          title="Shift - Кубик"
        >
          <Zap size={18} />
          <span className="text-[10px] font-bold">Кубик</span>
        </button>
      </div>
    </div>
  );
};
