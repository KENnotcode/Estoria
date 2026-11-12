import AsyncStorage from '@react-native-async-storage/async-storage';

export type WatchHistoryEntry = {
  movieId: string;
  watchedAt: number;
};

const MOVIE_ID_PATTERN = /^[0-9]{1,10}$/;
const MAX_HISTORY_ITEMS = 30;

function parseHistory(value: string | null): WatchHistoryEntry[] {
  if (!value) return [];

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) return [];

  return parsed.filter(isWatchHistoryEntry).slice(0, MAX_HISTORY_ITEMS);
}

function isWatchHistoryEntry(value: unknown): value is WatchHistoryEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as { movieId?: unknown; watchedAt?: unknown };
  return (
    typeof entry.movieId === 'string'
    && MOVIE_ID_PATTERN.test(entry.movieId)
    && typeof entry.watchedAt === 'number'
    && Number.isFinite(entry.watchedAt)
  );
}

export async function fetchWatchHistory(storageKey: string): Promise<WatchHistoryEntry[]> {
  const stored = await AsyncStorage.getItem(storageKey);
  return parseHistory(stored);
}

export async function recordWatch(
  storageKey: string,
  movieId: string,
): Promise<WatchHistoryEntry[]> {
  if (!MOVIE_ID_PATTERN.test(movieId)) {
    throw new Error('This movie cannot be added to watch history.');
  }

  const current = await fetchWatchHistory(storageKey);
  const updated = [
    { movieId, watchedAt: Date.now() },
    ...current.filter((entry) => entry.movieId !== movieId),
  ].slice(0, MAX_HISTORY_ITEMS);

  await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
  return updated;
}
