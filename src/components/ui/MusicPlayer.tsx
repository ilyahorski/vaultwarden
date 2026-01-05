import { useState, useEffect, useRef } from 'react';
import { Music, ChevronDown, SkipBack, Play, Pause, SkipForward, Volume2, VolumeX, Repeat } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

interface MusicPlayerProps {
  compact?: boolean;
}

export function MusicPlayer({ compact = false }: MusicPlayerProps) {
  const {
    isPlaying,
    togglePlay,
    playNextTrack,
    playPrevTrack,
    currentTrack,
    duration,
    currentTime,
    seekTo,
    formatTime,
    musicEnabled,
    toggleMusic,
    showPlayer,
    togglePlayer,
    getTrackName,
    totalTracks,
    repeatMode,
    toggleRepeat
  } = useAudio();

  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      seekTo(pos * duration);
    }
  };

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

  const handleDragMove = (e: MouseEvent) => {
    if (isDragging && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seekTo(pos * duration);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Компактная версия — только кнопка toggle
  if (compact && !showPlayer) {
    return (
      <button
        onClick={togglePlayer}
        className="flex items-center justify-center gap-2 p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-amber-400 transition-colors w-full"
        title="Открыть плеер"
      >
        <Music size={16} />
        <span className="text-xs">Музыка</span>
      </button>
    );
  }

  return (
    <div className="w-full">
      {/* Кнопка toggle */}
      <button
        onClick={togglePlayer}
        className="flex items-center justify-between gap-2 p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-amber-400 transition-colors w-full mb-1"
      >
        <div className="flex items-center gap-2">
          <Music size={16} className={isPlaying ? 'text-amber-400' : ''} />
          <span className="text-xs truncate max-w-[120px]">
            {isPlaying ? getTrackName(currentTrack) : 'Музыка'}
          </span>
        </div>
        <ChevronDown size={14} className={`transition-transform ${showPlayer ? 'rotate-180' : ''}`} />
      </button>

      {/* Развернутый плеер */}
      {showPlayer && (
        <div className="bg-slate-900 border border-slate-700 rounded p-3 space-y-3">
          {/* Название трека */}
          <div className="text-center">
            <p className="text-amber-400 text-xs font-medium truncate">
              {getTrackName(currentTrack)}
            </p>
            <p className="text-slate-500 text-[10px]">
              Трек {currentTrack + 1} / {totalTracks}
            </p>
          </div>

          {/* Прогресс-бар */}
          <div
            ref={progressRef}
            className="h-2 bg-slate-700 rounded-full relative cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full border-2 border-slate-900 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
              onMouseDown={handleDragStart}
            />
          </div>

          {/* Время */}
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Контролы */}
          <div className="flex items-center justify-between">
            {/* Кнопка вкл/выкл музыки */}
            <button
              onClick={toggleMusic}
              className={`p-1.5 rounded transition-colors ${
                musicEnabled
                  ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-400'
                  : 'bg-red-900/30 border border-red-700 text-red-400'
              }`}
            >
              {musicEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            </button>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={playPrevTrack}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Предыдущий трек"
              >
                <SkipBack size={14} />
              </button>

              <button
                onClick={togglePlay}
                className="p-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                title={isPlaying ? 'Пауза' : 'Играть'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <button
                onClick={playNextTrack}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Следующий трек"
              >
                <SkipForward size={14} />
              </button>
            </div>

            <button
              onClick={toggleRepeat}
              className={`p-1.5 rounded transition-colors ${
                repeatMode
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
              }`}
              title={repeatMode ? 'Повтор включён' : 'Повторять трек'}
            >
              <Repeat size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
