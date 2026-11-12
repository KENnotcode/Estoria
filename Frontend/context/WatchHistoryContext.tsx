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
  clearWatchHistory,
  fetchWatchHistory,
  recordWatch,
  type WatchHistoryEntry,
} from '@/services/watchHistoryRepository';

type WatchHistoryContextValue = {
  entries: WatchHistoryEntry[];
  isLoaded: boolean;
  error: string | null;
  recordMovie: (movieId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
};

const WatchHistoryContext = createContext<WatchHistoryContextValue | null>(null);

export function WatchHistoryProvider({ children }: { children: ReactNode }) {
  const { account, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<WatchHistoryEntry[]>([]);
  const [loadedAccount, setLoadedAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const storageKey = account ? `@estoria/watch-history/${account.uid}` : null;

  useEffect(() => {
    let active = true;
    if (authLoading || !storageKey || !account) return undefined;

    fetchWatchHistory(storageKey)
      .then((history) => {
        if (active) {
          setEntries(history);
          setLoadedAccount(account.uid);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setEntries([]);
          setLoadedAccount(account.uid);
          setError(loadError instanceof Error ? loadError.message : 'Could not load watch history.');
        }
      });

    return () => {
      active = false;
    };
  }, [account, authLoading, storageKey]);

  const recordMovie = useCallback(async (movieId: string) => {
    if (!storageKey) {
      throw new Error('Sign in to save watch history.');
    }

    const updated = await recordWatch(storageKey, movieId);
    setEntries(updated);
    setLoadedAccount(account?.uid ?? null);
  }, [account?.uid, storageKey]);

  const clearHistory = useCallback(async () => {
    if (!storageKey) {
      throw new Error('Sign in to clear watch history.');
    }

    await clearWatchHistory(storageKey);
    setEntries([]);
    setLoadedAccount(account?.uid ?? null);
  }, [account?.uid, storageKey]);

  const value = useMemo<WatchHistoryContextValue>(() => ({
    entries: account && loadedAccount === account.uid ? entries : [],
    isLoaded: !authLoading && (!account || loadedAccount === account.uid),
    error,
    recordMovie,
    clearHistory,
  }), [account, authLoading, entries, error, loadedAccount, recordMovie, clearHistory]);

  return <WatchHistoryContext.Provider value={value}>{children}</WatchHistoryContext.Provider>;
}

export function useWatchHistory(): WatchHistoryContextValue {
  const context = useContext(WatchHistoryContext);
  if (!context) {
    throw new Error('useWatchHistory must be used inside WatchHistoryProvider');
  }
  return context;
}
