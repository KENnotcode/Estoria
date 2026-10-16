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
import { useAuth } from '@/context/AuthContext';
import {
  fetchFavorites,
  toggleFavorite as persistFavoriteToggle,
} from '@/services/favoritesRepository';

type FavoritesContextValue = {
  favoriteIds: string[];
  isLoaded: boolean;
  isFavorite: (movieId: string) => boolean;
  toggleFavorite: (movieId: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { account, isLoading: authLoading } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (authLoading) {
      setIsLoaded(false);
      return () => {
        isActive = false;
      };
    }

    if (!account) {
      setFavoriteIds([]);
      setIsLoaded(true);
      return () => {
        isActive = false;
      };
    }

    setFavoriteIds([]);
    setIsLoaded(false);
    fetchFavorites()
      .then((favorites) => {
        if (isActive) {
          setFavoriteIds(favorites.map(({ movieId }) => movieId));
        }
      })
      .catch(() => {
        if (isActive) {
          setFavoriteIds([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoaded(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, [account, authLoading]);

  const toggleFavorite = useCallback(async (movieId: string) => {
    if (!account || !isLoaded) {
      return;
    }

    const wasFavorite = favoriteIds.includes(movieId);
    setFavoriteIds((current) =>
      wasFavorite ? current.filter((id) => id !== movieId) : [...current, movieId],
    );
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const isFavorite = await persistFavoriteToggle(movieId);
      setFavoriteIds((current) => {
        const withoutMovie = current.filter((id) => id !== movieId);
        return isFavorite ? [...withoutMovie, movieId] : withoutMovie;
      });
    } catch (error) {
      setFavoriteIds((current) => {
        const withoutMovie = current.filter((id) => id !== movieId);
        return wasFavorite ? [...withoutMovie, movieId] : withoutMovie;
      });
      throw error;
    }
  }, [account, favoriteIds, isLoaded]);

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
