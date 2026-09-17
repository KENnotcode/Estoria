import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = '@estoria/favorites';

type FavoritesContextValue = {
  favoriteIds: string[];
  isLoaded: boolean;
  isFavorite: (movieId: string) => boolean;
  toggleFavorite: (movieId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) {
            setFavoriteIds(parsed);
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds)).catch(() => undefined);
    }
  }, [favoriteIds, isLoaded]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      isLoaded,
      isFavorite: (movieId) => favoriteIds.includes(movieId),
      toggleFavorite: (movieId) => {
        setFavoriteIds((current) =>
          current.includes(movieId)
            ? current.filter((id) => id !== movieId)
            : [...current, movieId],
        );
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    }),
    [favoriteIds, isLoaded],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }
  return context;
}