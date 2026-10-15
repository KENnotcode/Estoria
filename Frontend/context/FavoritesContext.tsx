import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = '@estoria/favorites';

type FavoritesContextValue = {
  favoriteIds: string[];
  isLoaded: boolean;
  isFavorite: (movieId: string) => boolean;
  toggleFavorite: (movieId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/** Reads persisted favorites, ignoring malformed payloads. */
async function readStoredFavorites(): Promise<string[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  const parsed: unknown = JSON.parse(stored);
  if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) {
    return parsed;
  }

  return [];
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    readStoredFavorites()
      .then((ids) => {
        if (isActive) {
          setFavoriteIds(ids);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (isActive) {
          setIsLoaded(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds)).catch(() => undefined);
  }, [favoriteIds, isLoaded]);

  const toggleFavorite = useCallback((movieId: string) => {
    setFavoriteIds((current) =>
      current.includes(movieId)
        ? current.filter((id) => id !== movieId)
        : [...current, movieId],
    );
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      isLoaded,
      isFavorite: (movieId) => favoriteIds.includes(movieId),
      toggleFavorite,
    }),
    [favoriteIds, isLoaded, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }

  return context;
}
