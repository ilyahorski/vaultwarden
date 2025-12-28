import React from 'react';
import { Activity } from 'lucide-react';
import type { LogEntry } from '../../types';

interface EventLogProps {
  logs: LogEntry[];
  logsEndRef: React.RefObject<HTMLDivElement>;
}

export const EventLog: React.FC<EventLogProps> = ({ logs, logsEndRef }) => {
  return (
    <div className="h-48 lg:h-64 bg-slate-900 border-t border-slate-800 flex flex-col shrink-0">
      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-400 uppercase">Журнал Событий</span>
        <Activity size={14} className="text-slate-600" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm scroll-smooth">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-slate-600 text-xs mt-1 shrink-0">{log.timestamp}</span>
            <div className={`
              p-2 rounded-lg text-sm max-w-[85%]
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
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};
