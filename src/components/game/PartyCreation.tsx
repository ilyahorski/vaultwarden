import React, { useState } from 'react';
import { User, Cat, Pickaxe, BookOpen, Heart, Zap, Swords, Shield } from 'lucide-react';
import type { DuoParty, HeroStats, CatStats } from '../../types';
import { INITIAL_HERO, INITIAL_CAT, INITIAL_PARTY } from '../../constants';

interface PartyCreationProps {
  onCreateParty: (party: DuoParty) => void;
}

export const PartyCreation: React.FC<PartyCreationProps> = ({ onCreateParty }) => {
  const [heroName, setHeroName] = useState('');
  const [catName, setCatName] = useState('');
  const [step, setStep] = useState<'hero' | 'cat' | 'confirm'>('hero');

  const handleCreate = () => {
    const hero: HeroStats = {
      ...INITIAL_HERO,
      name: heroName || 'Археолог'
    };

    const cat: CatStats = {
      ...INITIAL_CAT,
      name: catName || 'Кот-учёный'
    };

    const party: DuoParty = {
      ...INITIAL_PARTY,
      hero,
      cat
    };

    onCreateParty(party);
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center p-4 md:p-8 overflow-y-auto">
      {/* Заголовок */}
      <h2 className="text-2xl md:text-4xl font-bold text-amber-500 mb-1 md:mb-2">
        Aetheria: The Cat's Codex
      </h2>
      <p className="text-slate-400 text-sm md:text-base mb-6">
        Создайте своих героев для путешествия сквозь время
      </p>

      {/* Индикатор шагов */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          step === 'hero' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'
        }`}>
          <User size={20} />
        </div>
        <div className="w-8 h-1 bg-slate-700" />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          step === 'cat' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'
        }`}>
          <Cat size={20} />
        </div>
        <div className="w-8 h-1 bg-slate-700" />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          step === 'confirm' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'
        }`}>
          <Swords size={20} />
        </div>
      </div>

      {/* Шаг 1: Героиня */}
      {step === 'hero' && (
        <div className="w-full max-w-lg animate-fadeIn">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-amber-600/20 rounded-full">
                <User size={32} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Героиня — Археолог</h3>
                <p className="text-slate-400 text-sm">Физический боец с инструментами исследования</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-slate-500 text-sm font-bold mb-2">Имя героини</label>
              <input
                type="text"
                value={heroName}
                onChange={(e) => setHeroName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-amber-500 outline-none"
                placeholder="Введите имя..."
              />
            </div>

            {/* Статы героини */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Heart size={16} className="text-red-400" />
                  <span className="text-slate-400 text-sm">Здоровье</span>
                </div>
                <span className="text-xl font-bold text-green-400">{INITIAL_HERO.maxHp}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={16} className="text-yellow-400" />
                  <span className="text-slate-400 text-sm">Выносливость</span>
                </div>
                <span className="text-xl font-bold text-yellow-400">{INITIAL_HERO.maxStamina}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Swords size={16} className="text-orange-400" />
                  <span className="text-slate-400 text-sm">Сила</span>
                </div>
                <span className="text-xl font-bold text-orange-400">{INITIAL_HERO.strength}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={16} className="text-blue-400" />
                  <span className="text-slate-400 text-sm">Ловкость</span>
                </div>
                <span className="text-xl font-bold text-blue-400">{INITIAL_HERO.dexterity}</span>
              </div>
            </div>

            {/* Навыки */}
            <div className="mb-6">
              <h4 className="text-slate-300 font-bold mb-2 flex items-center gap-2">
                <Pickaxe size={16} /> Инструменты
              </h4>
              <div className="flex flex-wrap gap-2">
                {INITIAL_HERO.tools.map(tool => (
                  <span key={tool.id} className="px-3 py-1 bg-amber-600/20 text-amber-400 rounded-full text-sm">
                    {tool.name}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep('cat')}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Далее →
            </button>
          </div>
        </div>
      )}

      {/* Шаг 2: Кот */}
      {step === 'cat' && (
        <div className="w-full max-w-lg animate-fadeIn">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-purple-600/20 rounded-full">
                <Cat size={32} className="text-purple-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Кот — Бывший учёный</h3>
                <p className="text-slate-400 text-sm">Магический компаньон со знанием древних тайн</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-slate-500 text-sm font-bold mb-2">Имя кота</label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-purple-500 outline-none"
                placeholder="Введите имя..."
              />
            </div>

            {/* Статы кота */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Heart size={16} className="text-red-400" />
                  <span className="text-slate-400 text-sm">Здоровье</span>
                </div>
                <span className="text-xl font-bold text-green-400">{INITIAL_CAT.maxHp}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={16} className="text-blue-400" />
                  <span className="text-slate-400 text-sm">Мана</span>
                </div>
                <span className="text-xl font-bold text-blue-400">{INITIAL_CAT.maxMana}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={16} className="text-purple-400" />
                  <span className="text-slate-400 text-sm">Интеллект</span>
                </div>
                <span className="text-xl font-bold text-purple-400">{INITIAL_CAT.intelligence}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={16} className="text-cyan-400" />
                  <span className="text-slate-400 text-sm">Мудрость</span>
                </div>
                <span className="text-xl font-bold text-cyan-400">{INITIAL_CAT.wisdom}</span>
              </div>
            </div>

            {/* Навыки */}
            <div className="mb-6">
              <h4 className="text-slate-300 font-bold mb-2 flex items-center gap-2">
                <BookOpen size={16} /> Знания
              </h4>
              <div className="flex flex-wrap gap-2">
                {INITIAL_CAT.lore.map(skill => (
                  <span key={skill.id} className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('hero')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                ← Назад
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Далее →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Шаг 3: Подтверждение */}
      {step === 'confirm' && (
        <div className="w-full max-w-2xl animate-fadeIn">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white text-center mb-6">Ваша команда готова!</h3>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Карточка героини */}
              <div className="bg-slate-900 rounded-lg p-4 border border-amber-600/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-600/20 rounded-full">
                    <User size={24} className="text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-400">{heroName || 'Археолог'}</h4>
                    <p className="text-slate-500 text-xs">Героиня</p>
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  <p>HP: <span className="text-green-400">{INITIAL_HERO.maxHp}</span></p>
                  <p>Выносливость: <span className="text-yellow-400">{INITIAL_HERO.maxStamina}</span></p>
                </div>
              </div>

              {/* Карточка кота */}
              <div className="bg-slate-900 rounded-lg p-4 border border-purple-600/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-600/20 rounded-full">
                    <Cat size={24} className="text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-400">{catName || 'Кот-учёный'}</h4>
                    <p className="text-slate-500 text-xs">Компаньон</p>
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  <p>HP: <span className="text-green-400">{INITIAL_CAT.maxHp}</span></p>
                  <p>Мана: <span className="text-blue-400">{INITIAL_CAT.maxMana}</span></p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-6 text-center">
              <p className="text-slate-400 text-sm">
                Вместе вы отправитесь в путешествие через руины древней цивилизации,
                разгадывая тайны манипуляции временем и собирая утерянные эссенции.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('cat')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                ← Назад
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg transition-all"
              >
                Начать приключение!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartyCreation;
