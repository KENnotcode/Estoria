import { useCallback, useEffect, useState } from 'react';
import { fetchMovieVideos, type MovieVideo } from '@/services/trailers';

type CacheEntry = {
  videos: MovieVideo[];
  status: 'loading' | 'ready' | 'error';
  promise?: Promise<MovieVideo[]>;
  controller?: AbortController;
  consumers: number;
};

const cache = new Map<string, CacheEntry>();

function loadVideos(movieId: string): CacheEntry {
  const existing = cache.get(movieId);
  if (existing) return existing;

  const controller = new AbortController();
  const entry: CacheEntry = { videos: [], status: 'loading', controller, consumers: 0 };
  entry.promise = fetchMovieVideos(movieId, controller.signal)
    .then((videos) => {
      entry.videos = videos;
      entry.status = 'ready';
      return videos;
    })
    .catch((error: unknown) => {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      entry.status = 'error';
      throw error;
    });
  cache.set(movieId, entry);
  return entry;
}

function subscribe(movieId: string, onUpdate: () => void): () => void {
  const entry = loadVideos(movieId);
  entry.consumers += 1;
  entry.promise?.then(onUpdate, onUpdate);
  return () => {
    entry.consumers -= 1;
    if (entry.consumers === 0 && entry.status === 'loading') {
      entry.controller?.abort();
      cache.delete(movieId);
    }
  };
}

export function useMovieVideos(movieId: string, enabled: boolean) {
  const [, rerender] = useState(0);
  const refresh = useCallback(() => rerender((value) => value + 1), []);
  const entry = enabled && movieId ? loadVideos(movieId) : undefined;

  useEffect(() => {
    if (!enabled || !movieId) return undefined;
    return subscribe(movieId, refresh);
  }, [enabled, movieId, refresh]);

  return {
    status: entry?.status ?? 'loading',
    videos: entry?.videos ?? [],
  } as { status: 'loading' | 'ready' | 'error'; videos: MovieVideo[] };
}

export function useTrailerKey(movieId: string, enabled = true) {
  const { status, videos } = useMovieVideos(movieId, enabled);
  const key = videos.find((video) => video.type === 'Trailer' || video.type === 'Teaser')?.key ?? null;
  return { status, key };
}
