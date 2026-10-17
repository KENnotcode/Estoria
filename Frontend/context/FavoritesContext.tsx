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
  error: string | null;
  isFavorite: (movieId: string) => boolean;
  toggleFavorite: (movieId: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { account, isLoading: authLoading } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Holds the account whose favorites are currently stored in `favoriteIds`
  // state. Favorites are only exposed when this matches the signed-in
  // account, so a sign-out followed by a sign-in as a different account can
  // never leak the previous account's favorites — without resetting state
  // synchronously inside an effect.
  const [favoriteIdsAccount, setFavoriteIdsAccount] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    // While Firebase auth is still resolving, hold off. The derived values
    // above keep isLoaded false until the account settles.
    if (authLoading || !account) {
      return () => {
        isActive = false;
      };
    }

    // Every setState below happens inside a fetch callback, never
    // synchronously within the effect body.
    fetchFavorites()
      .then((favorites) => {
        if (isActive) {
          setFavoriteIds(favorites.map(({ movieId }) => movieId));
          setFavoriteIdsAccount(account.uid);
        }
      })
      .catch(() => {
        if (isActive) {
          setFavoriteIds([]);
          setFavoriteIdsAccount(account.uid);
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

    setError(null);
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
    } catch (err) {
      setFavoriteIds((current) => {
        const withoutMovie = current.filter((id) => id !== movieId);
        return wasFavorite ? [...withoutMovie, movieId] : withoutMovie;
      });
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      throw err;
    }
  }, [account, favoriteIds, isLoaded]);

  const value = useMemo<FavoritesContextValue>(() => {
    // While Firebase auth is still resolving there is nothing to load, and
    // without a signed-in account there are no favorites. Deriving these
    // values during render avoids calling setState synchronously inside an
    // effect, which triggers cascading renders
    // (https://react.dev/learn/you-might-not-need-an-effect).
    const effectiveFavoriteIds =
      account && favoriteIdsAccount === account.uid ? favoriteIds : [];
    const effectiveIsLoaded = !authLoading && (!account || isLoaded);

    return ({
      favoriteIds: effectiveFavoriteIds,
      isLoaded: effectiveIsLoaded,
      error,
      isFavorite: (movieId) => effectiveFavoriteIds.includes(movieId),
      toggleFavorite,
    });
  }, [
    account,
    favoriteIdsAccount,
    favoriteIds,
    authLoading,
    isLoaded,
    error,
    toggleFavorite,
  ]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }

  return context;
}
