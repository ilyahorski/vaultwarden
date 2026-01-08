import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft, Zap } from 'lucide-react';

interface MobileControlsProps {
  onMove: (dx: number, dy: number) => void;
  onEnter?: () => void;
  onShift?: () => void;
  mapScale: number;
  onScaleChange: (scale: number) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onEnter,
  onShift,
  mapScale,
  onScaleChange
}) => {
  const buttonClass = "p-3 bg-slate-800 rounded-full border border-slate-600 active:bg-blue-600 touch-manipulation select-none";
  const actionButtonClass = "p-3 bg-slate-800 rounded-lg border border-slate-600 active:bg-amber-600 touch-manipulation select-none flex items-center justify-center gap-1";

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[15vh] bg-slate-900/95 border-t border-slate-700 md:hidden z-30 flex items-center justify-between px-4">
      {/* Левая часть: Enter и Shift */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onEnter}
          className={actionButtonClass}
          title="Enter - Взаимодействие"
        >
          <CornerDownLeft size={18} />
          <span className="text-[10px] font-bold">Enter</span>
        </button>
        <button
          onClick={onShift}
          className={actionButtonClass}
          title="Shift - Меню"
        >
          <Zap size={18} />
          <span className="text-[10px] font-bold">Shift</span>
        </button>
      </div>

      {/* Центральная часть: Слайдер масштабирования */}
      <div className="flex-1 mx-4 flex flex-col items-center justify-center gap-1">
        <span className="text-[10px] text-slate-400 font-bold uppercase">Масштаб</span>
        <input
          type="range"
          min="0.3"
          max="1.5"
          step="0.1"
          value={mapScale}
          onChange={(e) => onScaleChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <span className="text-[10px] text-slate-500">{Math.round(mapScale * 100)}%</span>
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
    </div>
  );
};
