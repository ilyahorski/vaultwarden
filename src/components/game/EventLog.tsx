import React from 'react';
import { Activity } from 'lucide-react';
import type { LogEntry } from '../../types';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface EventLogProps {
  logs: LogEntry[];
  logsEndRef: React.RefObject<HTMLDivElement>;
}

export const EventLog: React.FC<EventLogProps> = ({ logs, logsEndRef }) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border-t lg:border-t-0 border-slate-800">

      {/* Хедер лога */}
      <div className={`bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0 ${isMobile ? 'px-2 py-1' : 'px-4 py-2'}`}>
        <span className={`font-bold text-slate-400 uppercase ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Журнал Событий</span>
        <Activity size={isMobile ? 12 : 14} className="text-slate-600" />
      </div>

      {/* Список сообщений */}
      <div className={`flex-1 overflow-y-auto space-y-1 font-mono scroll-smooth scrollbar-thin scrollbar-thumb-slate-700 ${isMobile ? 'p-2 text-[10px]' : 'p-4 text-sm'}`}>
        {logs.slice(isMobile ? -10 : undefined).map((log) => (
          <div key={log.id} className={`flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <span className={`text-slate-600 shrink-0 select-none ${isMobile ? 'text-[8px] mt-0.5' : 'text-xs mt-1'}`}>{log.timestamp}</span>
            <div className={`
              rounded w-full wrap-break-word
              ${isMobile ? 'p-1 text-[10px]' : 'p-2 text-sm'}
              ${log.type === 'combat' ? 'bg-red-900/20 text-red-200 border border-red-900/30' : ''}
              ${log.type === 'loot' ? 'bg-amber-900/20 text-amber-200 border border-amber-900/30' : ''}
              ${log.type === 'level' ? 'bg-yellow-600/20 text-yellow-200 border border-yellow-500/50 shadow-glow' : ''}
              ${log.type === 'fail' ? 'bg-red-950/40 text-red-300 border border-red-800 font-bold' : ''}
              ${log.type === 'success' ? 'bg-green-900/20 text-green-300 border border-green-800 font-bold' : ''}
              ${log.type === 'rest' ? 'bg-blue-900/20 text-blue-300 border border-blue-800' : ''}
              ${log.type === 'roll' ? 'text-indigo-300' : ''}
              ${log.type === 'info' ? 'text-slate-300' : ''}
            `}>
              {log.type === 'level' && '⚡ '}
              {log.text}
            </div>
          </div>
        ))}
        {/* Якорь для скролла */}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};
