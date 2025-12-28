import React from 'react';
import type { ClassType } from '../../types';
import { CLASSES } from '../../constants';

interface ClassSelectionProps {
  onSelectClass: (classType: ClassType) => void;
}

export const ClassSelection: React.FC<ClassSelectionProps> = ({ onSelectClass }) => {
  return (
    <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-8">
      <h2 className="text-4xl font-bold text-amber-500 mb-2">Выберите Героя</h2>
      <p className="text-slate-400 mb-8">От вашего выбора зависит стиль прохождения</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {(Object.keys(CLASSES) as ClassType[]).map(cls => (
          <button
            key={cls}
            onClick={() => onSelectClass(cls)}
            className="bg-slate-800 border-2 border-slate-700 hover:border-amber-500 hover:bg-slate-750 rounded-xl p-6 flex flex-col items-center text-center transition-all group"
          >
            <div className="mb-4 p-4 bg-slate-900 rounded-full group-hover:scale-110 transition-transform">
              {CLASSES[cls].icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{CLASSES[cls].name}</h3>
            <p className="text-slate-400 text-sm mb-6 h-12">{CLASSES[cls].desc}</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm w-full">
              <div className="flex justify-between">
                <span className="text-slate-500">HP</span>
                <span className="text-green-400 font-bold">{CLASSES[cls].hp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MP</span>
                <span className="text-blue-400 font-bold">{CLASSES[cls].mp}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
