import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import type { AppMovie } from '@/types/movie';

type OpenMovieOptions = {
  releaseDate?: string;
};

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
