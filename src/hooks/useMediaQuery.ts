import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // Инициализируем состояние на основе текущего media query
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia(query);

    // Синхронизируем при изменении query (необходимо при изменении query prop)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Современный метод
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      // Fallback для старых браузеров
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}

// Предопределенные хуки для удобства
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)');
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 769px) and (max-width: 1023px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}
