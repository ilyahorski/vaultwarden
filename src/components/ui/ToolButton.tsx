import React from 'react';

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export const ToolButton: React.FC<ToolButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 p-2 rounded-md text-xs font-medium transition-all w-full
        ${active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
          : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'}
      `}
    >
      <div className="shrink-0">{icon}</div>
      <span className="truncate">{label}</span>
    </button>
  );
};
