import { createContext, useContext } from 'react';

// Типы звуковых эффектов
export type SoundEffectType = 'choose' | 'close' | 'info' | 'select' | 'start';

// Интерфейс контекста аудио
export interface AudioContextType {
  // Звуковые эффекты
  playSoundEffect: (effect: SoundEffectType) => void;
  soundEffectsEnabled: boolean;
  toggleSoundEffects: () => void;

  // Фоновая музыка
  isPlaying: boolean;
  togglePlay: () => void;
  playNextTrack: () => void;
  playPrevTrack: () => void;
  currentTrack: number;
  duration: number;
  currentTime: number;
  seekTo: (time: number) => void;
  formatTime: (time: number) => string;
  musicEnabled: boolean;
  toggleMusic: () => void;

  // Плеер
  showPlayer: boolean;
  togglePlayer: () => void;
  getTrackName: (index: number) => string;
  totalTracks: number;

  // Повтор трека
  repeatMode: boolean;
  toggleRepeat: () => void;
}

// Создание контекста
export const AudioContextProvider = createContext<AudioContextType | undefined>(undefined);

// Хук для доступа к контексту
export function useAudio(): AudioContextType {
  const context = useContext(AudioContextProvider);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
