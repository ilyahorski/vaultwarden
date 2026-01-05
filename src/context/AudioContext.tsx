import { useState, useEffect, useRef, type ReactNode } from 'react';
import { AudioContextProvider, type SoundEffectType } from './audioTypes';

// Реэкспорт хука для обратной совместимости
export { useAudio } from './audioTypes';

// Список музыкальных треков
const MUSIC_TRACKS = [
  '/music/01-your-turn.mp3',
  '/music/02-chosen-one.mp3',
  '/music/03-against-fate.mp3',
  '/music/04-forgotten-hero.mp3',
  '/music/05-another-adventure.mp3',
  '/music/06-ghost-world.mp3',
  '/music/07-lost-in-abyss.mp3',
  '/music/08-phantasy-star.mp3',
  '/music/09-magic-dust.mp3',
  '/music/10-waiting-time.mp3',
  '/music/11-the-darkest-night.mp3',
  '/music/12-just-one-try.mp3',
  '/music/13-missing-person.mp3',
  '/music/14-lietinga-nactis.mp3',
  '/music/15-miniature.mp3',
  '/music/16-garden.mp3',
];

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  // Звуковые эффекты
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);

  // Фоновая музыка
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [repeatMode, setRepeatMode] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const repeatModeRef = useRef(repeatMode);
  const musicEnabledRef = useRef(musicEnabled);
  const soundEffectsRef = useRef<Record<SoundEffectType, HTMLAudioElement | null>>({
    choose: null,
    close: null,
    info: null,
    select: null,
    start: null
  });

  // Синхронизация refs с состоянием (для использования в колбеках)
  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    musicEnabledRef.current = musicEnabled;
  }, [musicEnabled]);

  // Обновление прогресса проигрывания
  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Инициализация аудиоэлементов при первом рендере
  useEffect(() => {
    // Загрузка звуковых эффектов
    soundEffectsRef.current.choose = new Audio('/music/click/choose.wav');
    soundEffectsRef.current.close = new Audio('/music/click/close.wav');
    soundEffectsRef.current.info = new Audio('/music/click/info.wav');
    soundEffectsRef.current.select = new Audio('/music/click/select.wav');
    soundEffectsRef.current.start = new Audio('/music/click/start.wav');

    // Установка громкости для звуковых эффектов
    Object.values(soundEffectsRef.current).forEach(sound => {
      if (sound) sound.volume = 0.7;
    });

    // Создание первоначального аудиоэлемента
    const audio = new Audio(MUSIC_TRACKS[currentTrack]);
    audio.volume = 0.5;
    audio.loop = false;
    audioRef.current = audio;

    // Добавление слушателей событий
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    const handleEnded = () => {
      // Если включен режим повтора — перезапускаем текущий трек
      if (repeatModeRef.current) {
        audio.currentTime = 0;
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error('Ошибка воспроизведения:', err));
        return;
      }

      // Иначе переключаемся на следующий трек
      setCurrentTrack(prevTrack => {
        const nextTrack = (prevTrack + 1) % MUSIC_TRACKS.length;

        audio.pause();
        audio.src = MUSIC_TRACKS[nextTrack];
        audio.load();

        audio.addEventListener('canplay', () => {
          if (musicEnabledRef.current) {
            audio.volume = 0.1;
            audio.play()
              .then(() => {
                setIsPlaying(true);
                const fadeInInterval = setInterval(() => {
                  if (audio.volume < 0.5) {
                    audio.volume = Math.min(0.5, audio.volume + 0.05);
                  } else {
                    clearInterval(fadeInInterval);
                  }
                }, 50);
              })
              .catch(err => console.error('Ошибка воспроизведения:', err));
          }
        }, { once: true });

        return nextTrack;
      });
    };

    audio.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.pause();
      }
    };
  }, []);

  // Воспроизведение звукового эффекта
  const playSoundEffect = (effect: SoundEffectType) => {
    if (soundEffectsEnabled && soundEffectsRef.current[effect]) {
      const sound = soundEffectsRef.current[effect]!.cloneNode() as HTMLAudioElement;
      sound.volume = 0.7;
      sound.play().catch(err => console.error('Ошибка звукового эффекта:', err));
    }
  };

  // Воспроизведение фоновой музыки
  const playMusic = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error('Ошибка воспроизведения:', err);
          setIsPlaying(false);
        });
    }
  };

  // Остановка фоновой музыки
  const pauseMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Переключение воспроизведения
  const togglePlay = () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  };

  // Функция затухания
  const fadeOutAndPlay = (callback: () => void) => {
    if (!audioRef.current) return;

    const fadeOutStep = 0.05;
    const originalVolume = audioRef.current.volume;

    const fadeOut = setInterval(() => {
      if (audioRef.current && audioRef.current.volume > fadeOutStep) {
        audioRef.current.volume -= fadeOutStep;
      } else {
        clearInterval(fadeOut);
        if (audioRef.current) audioRef.current.volume = 0;

        callback();

        setTimeout(() => {
          const fadeIn = setInterval(() => {
            if (audioRef.current && audioRef.current.volume < originalVolume - fadeOutStep) {
              audioRef.current.volume += fadeOutStep;
            } else {
              if (audioRef.current) audioRef.current.volume = originalVolume;
              clearInterval(fadeIn);
            }
          }, 50);
        }, 300);
      }
    }, 50);
  };

  // Смена трека
  const changeTrack = (trackIndex: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      setCurrentTrack(trackIndex);
      audioRef.current.src = MUSIC_TRACKS[trackIndex];
      setCurrentTime(0);

      if (isPlaying) {
        audioRef.current.play()
          .then(() => {
            if (audioRef.current) {
              audioRef.current.volume = 0.1;
              const fadeInInterval = setInterval(() => {
                if (audioRef.current && audioRef.current.volume < 0.5) {
                  audioRef.current.volume = Math.min(0.5, audioRef.current.volume + 0.05);
                } else {
                  clearInterval(fadeInInterval);
                }
              }, 50);
            }
          })
          .catch(err => console.error('Ошибка:', err));
      }
    }
  };

  const playNextTrack = () => {
    fadeOutAndPlay(() => {
      const nextTrack = (currentTrack + 1) % MUSIC_TRACKS.length;
      changeTrack(nextTrack);
    });
  };

  const playPrevTrack = () => {
    fadeOutAndPlay(() => {
      const prevTrack = (currentTrack - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
      changeTrack(prevTrack);
    });
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const togglePlayer = () => setShowPlayer(prev => !prev);
  const toggleSoundEffects = () => setSoundEffectsEnabled(prev => !prev);
  const toggleRepeat = () => setRepeatMode(prev => !prev);

  const toggleMusic = () => {
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    if (newState) {
      playMusic();
    } else {
      pauseMusic();
    }
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTrackName = (index: number): string => {
    const path = MUSIC_TRACKS[index];
    const filename = path.split('/').pop() || '';
    return filename.replace(/^\d+-/, '').replace('.mp3', '').replace(/-/g, ' ');
  };

  return (
    <AudioContextProvider.Provider value={{
      playSoundEffect,
      soundEffectsEnabled,
      toggleSoundEffects,
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
      totalTracks: MUSIC_TRACKS.length,
      repeatMode,
      toggleRepeat
    }}>
      {children}
    </AudioContextProvider.Provider>
  );
}
