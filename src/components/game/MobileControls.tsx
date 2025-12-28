import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface MobileControlsProps {
  onMove: (dx: number, dy: number) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onMove }) => {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2 md:hidden z-30 opacity-80">
      <button
        onClick={() => onMove(0, -1)}
        className="p-4 bg-slate-800 rounded-full border border-slate-600 active:bg-blue-600"
      >
        <ArrowUp size={24} />
      </button>
      <div className="flex gap-4">
        <button
          onClick={() => onMove(-1, 0)}
          className="p-4 bg-slate-800 rounded-full border border-slate-600 active:bg-blue-600"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={() => onMove(1, 0)}
          className="p-4 bg-slate-800 rounded-full border border-slate-600 active:bg-blue-600"
        >
          <ArrowRight size={24} />
        </button>
      </div>
      <button
        onClick={() => onMove(0, 1)}
        className="p-4 bg-slate-800 rounded-full border border-slate-600 active:bg-blue-600"
      >
        <ArrowDown size={24} />
      </button>
    </div>
  );
};
