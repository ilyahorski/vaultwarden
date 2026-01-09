import React, { useState, useRef } from 'react';
import type { ClassType, DungeonCampaign } from '../../types';
import { CLASSES } from '../../constants';
import { Upload, Lock } from 'lucide-react';

interface ClassSelectionProps {
  onSelectClass: (classType: ClassType, name: string, campaign?: DungeonCampaign) => void;
  onParseCampaign: (file: File) => Promise<DungeonCampaign>;
}

export const ClassSelection: React.FC<ClassSelectionProps> = ({ onSelectClass, onParseCampaign }) => {
  const [heroName, setHeroName] = useState('');
  const [campaign, setCampaign] = useState<DungeonCampaign | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const cmp = await onParseCampaign(file);
          setCampaign(cmp);
          setErrorMsg('');
      } catch {
          setErrorMsg('Ошибка чтения файла кампании');
      }
  };

  const handleSelect = (cls: ClassType) => {
      if (campaign && campaign.password && campaign.password !== passwordInput) {
          setErrorMsg('Неверный пароль подземелья!');
          return;
      }
      onSelectClass(cls, heroName, campaign || undefined);
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center p-4 md:p-8 overflow-y-auto">
      <h2 className="text-2xl md:text-4xl font-bold text-amber-500 mb-1 md:mb-2">Новое Приключение</h2>
      <p className="text-slate-400 text-sm md:text-base mb-4 md:mb-6">Создайте своего героя</p>

      <div className="mb-4 md:mb-8 w-full max-w-md">
          <label className="block text-slate-500 text-sm font-bold mb-1 md:mb-2">Имя Героя</label>
          <input
            type="text"
            value={heroName}
            onChange={(e) => setHeroName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 md:p-3 text-white focus:border-amber-500 outline-none"
            placeholder="Введите имя..."
          />
      </div>

      <div className="mb-4 md:mb-8 w-full max-w-md bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-700">
          <h3 className="text-slate-300 font-bold text-sm md:text-base mb-2 md:mb-3 flex items-center gap-2">
              Источник Подземелья
          </h3>
          <div className="flex gap-2 md:gap-4">
              <button
                onClick={() => { setCampaign(null); setPasswordInput(''); }}
                className={`flex-1 p-2 rounded text-sm ${!campaign ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                  Случайное
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className={`flex-1 p-2 rounded text-sm flex items-center justify-center gap-2 ${campaign ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                  <Upload size={14}/> Загрузить
              </button>
              <input type="file" ref={fileRef} className="hidden" accept=".json" onChange={handleFile} />
          </div>

          {campaign && (
              <div className="text-sm mt-3">
                  <p className="text-amber-300 mb-2">Кампания: {campaign.name}</p>
                  {campaign.password && (
                      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-red-900/50">
                          <Lock size={14} className="text-red-400"/>
                          <input
                            type="password"
                            placeholder="Пароль подземелья"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="bg-transparent text-white w-full outline-none"
                          />
                      </div>
                  )}
              </div>
          )}
          {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-6 max-w-4xl w-full">
        {(Object.keys(CLASSES) as ClassType[]).map(cls => (
          <button
            key={cls}
            onClick={() => handleSelect(cls)}
            className="bg-slate-800 border-2 border-slate-700 hover:border-amber-500 hover:bg-slate-750 rounded-lg md:rounded-xl p-3 md:p-6 flex flex-col items-center text-center transition-all group relative overflow-hidden"
          >
            <div className="mb-2 md:mb-4 p-2 md:p-4 bg-slate-900 rounded-full group-hover:scale-110 transition-transform relative z-10">
              {CLASSES[cls].icon}
            </div>
            <h3 className="text-base md:text-2xl font-bold text-white mb-1 md:mb-2 relative z-10">{CLASSES[cls].name}</h3>
            <p className="text-slate-400 text-xs md:text-sm mb-2 md:mb-6 hidden md:block h-12 relative z-10">{CLASSES[cls].desc}</p>
            <div className="flex flex-col md:grid md:grid-cols-2 gap-1 md:gap-x-8 md:gap-y-2 text-xs md:text-sm w-full relative z-10">
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