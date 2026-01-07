import { X, Move, Sword, Heart, Zap, Backpack, Dice6, DoorOpen, Flame, ArrowDownCircle, Eye, ShoppingCart, KeyRound } from 'lucide-react';

interface TutorialPopupProps {
  onClose: () => void;
}

export function TutorialPopup({ onClose }: TutorialPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Заголовок */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-100">Как играть</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Контент */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm text-slate-300">
          {/* Управление */}
          <section>
            <h3 className="text-amber-500 font-bold uppercase text-xs mb-2 flex items-center gap-2">
              <Move size={14} /> Управление
            </h3>
            <ul className="space-y-1 text-slate-400">
              <li><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">W A S D</kbd> или <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">Стрелки</kbd> — перемещение</li>
              <li><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">Enter</kbd> — открыть меню персонажа</li>
              <li><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">Shift</kbd> — бросить кубик действия</li>
              <li><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">ESC</kbd> — назад / закрыть меню</li>
            </ul>
          </section>

          {/* Бой */}
          <section>
            <h3 className="text-red-500 font-bold uppercase text-xs mb-2 flex items-center gap-2">
              <Sword size={14} /> Бой
            </h3>
            <p className="text-slate-400">
              При столкновении с врагом начинается бой. Двигайтесь на противника чтобы продолжать сражение. 
              Выбирайте действие: атака, навыки или предметы.
              Результат зависит от броска D20 - не обязательно, но можно испытать удачу: 12+ критический успех, 5- провал.
            </p>
          </section>

          {/* Кубик действия */}
          <section>
            <h3 className="text-blue-500 font-bold uppercase text-xs mb-2 flex items-center gap-2">
              <Dice6 size={14} /> Кубик действия
            </h3>
            <p className="text-slate-400">
              Нажмите <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">Shift</kbd> чтобы бросить кубик.
              Результат влияет на следующее действие в бою, успех/неудачу в обезвреживании ловушек.
              <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">Shift</kbd> восстанавливает очки движения если они иссякли.
            </p>
          </section>

          {/* Характеристики */}
          <section>
            <h3 className="text-green-500 font-bold uppercase text-xs mb-2 flex items-center gap-2">
              <Heart size={14} /> Характеристики
            </h3>
            <ul className="space-y-1 text-slate-400">
              <li><span className="text-red-400">HP</span> — здоровье. Если упадёт до 0, игра перезапустится.</li>
              <li><span className="text-blue-400">MP</span> — мана для использования навыков.</li>
              <li><span className="text-amber-400">ATK</span> — сила атаки.</li>
              <li><span className="text-slate-300">DEF</span> — защита, снижает входящий урон.</li>
            </ul>
          </section>

          {/* Навыки и предметы */}
          <section>
            <h3 className="text-purple-500 font-bold uppercase text-xs mb-2 flex items-center gap-2">
              <Zap size={14} /> Навыки
            </h3>
            <p className="text-slate-400">
              Лечащие навыки можно использовать в любое время через меню персонажа (<kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">Enter</kbd>).
              Атакующие навыки доступны только в бою.
            </p>
          </section>

          <section>
            <h3 className="text-emerald-500 font-bold uppercase text-xs mb-2 flex items-center gap-2">
              <Backpack size={14} /> Инвентарь
            </h3>
            <p className="text-slate-400">
              Собирайте зелья и экипировку. Используйте предметы через меню персонажа.
              Оружие и броня экипируются автоматически при использовании.
            </p>
          </section>

          {/* Окружение */}
          <section>
            <h3 className="text-amber-500 font-bold uppercase text-xs mb-2 flex items-center gap-2">
              <DoorOpen size={14} /> Окружение
            </h3>
            <ul className="space-y-1 text-slate-400">
              <li><DoorOpen size={12} className="inline text-amber-500" /> <span className="font-bold">Двери</span> — кликните чтобы открыть/закрыть. Используйте их для защиты от врагов!</li>
              <li><Flame size={12} className="inline text-orange-400" /> <span className="font-bold">Факелы</span> — кликните для зажигания/тушения. Освещают область вокруг.</li>
              <li><ArrowDownCircle size={12} className="inline text-blue-400" /> <span className="font-bold">Лестницы</span> — переход между этажами подземелья.</li>
            </ul>
          </section>

          {/* Инвентарь и торговля */}
          <section>
            <h3 className="text-emerald-500 font-bold uppercase text-xs mb-2 flex items-center gap-2">
              <ShoppingCart size={14} /> Инвентарь и Торговля
            </h3>
            <ul className="space-y-1 text-slate-400">
              <li><span className="font-bold">Инвентарь:</span> Откройте меню персонажа <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">Enter</kbd>, чтобы использовать зелья и экипировать снаряжение.</li>
              <li><span className="font-bold">Торговцы:</span> Подойдите к торговцу и откройте меню персонажа. Покупайте зелья, оружие и броню за золото.</li>
              <li><span className="font-bold">Автоэкипировка:</span> Лучшее оружие и броня экипируются автоматически при получении.</li>
            </ul>
          </section>

          {/* Секреты */}
          <section>
            <h3 className="text-purple-500 font-bold uppercase text-xs mb-2 flex items-center gap-2">
              <Eye size={14} /> Секреты и Тайны
            </h3>
            <ul className="space-y-1 text-slate-400">
              <li><KeyRound size={12} className="inline text-purple-400" /> <span className="font-bold">Секретные кнопки</span> — скрыты на полу, ищите их внимательно!</li>
              <li><span className="font-bold">Скрытые комнаты</span> — активируйте секретную кнопку, чтобы раскрыть невидимую комнату с переходом на следующий уровень.</li>
              <li className="text-purple-400 text-xs italic">Совет: исследуйте все углы подземелья!</li>
            </ul>
          </section>

          {/* Совет */}
          <section className="bg-slate-800/50 p-3 rounded border border-slate-700">
            <p className="text-slate-400 text-xs">
              <span className="text-amber-500 font-bold">Совет:</span> Враги с красным индикатором
              агрессивны и будут преследовать вас. Используйте двери и узкие проходы для тактического преимущества!
            </p>
          </section>
        </div>

        {/* Кнопка закрытия */}
        <div className="p-4 border-t border-slate-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full p-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition-colors"
          >
            Понятно!
          </button>
        </div>
      </div>
    </div>
  );
}
