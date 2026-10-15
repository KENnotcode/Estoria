import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import type { AppMovie } from '@/types/movie';

type OpenMovieOptions = {
  /** Set for unreleased titles so the details screen shows the release estimate. */
  releaseDate?: string;
};

/**
 * Single place that knows how to navigate to a movie, so every screen builds
 * the same route params.
 */
export function useOpenMovie() {
  const router = useRouter();

  return useCallback(
    (movie: AppMovie, options: OpenMovieOptions = {}) => {
      router.push({
        pathname: '/movie/[id]',
        params: {
          id: movie.id,
          releaseDate: options.releaseDate,
          upcoming: options.releaseDate ? 'true' : undefined,
        },
      });
    },
    [router],
  );
}
