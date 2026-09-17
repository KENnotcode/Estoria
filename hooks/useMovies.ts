import { useQuery } from '@tanstack/react-query';
import { fetchGenres, fetchMovieDetails, fetchNowPlaying, fetchPopular, fetchRecommendations, fetchSearch, fetchTopRated, fetchTrending } from '../services/movieService';
import type { AppMovie } from '../types/movie';

export const MOVIE_QUERY_KEYS = {
  popular: ['movies', 'popular'] as const,
  nowPlaying: ['movies', 'nowPlaying'] as const,
  trending: ['movies', 'trending'] as const,
  topRated: ['movies', 'topRated'] as const,
  search: (query: string) => ['movies', 'search', query] as const,
  genres: ['genres'] as const,
  details: (id: string) => ['movies', 'details', id] as const,
  recommendations: (id: string) => ['movies', 'recommendations', id] as const,
};

export function usePopularMovies(page = 1) {
  return useQuery({
    queryKey: [...MOVIE_QUERY_KEYS.popular, page],
    queryFn: () => fetchPopular(page),
    staleTime: 1000 * 60 * 10,
  });
}

export function useNowPlayingMovies(page = 1) {
  return useQuery({
    queryKey: [...MOVIE_QUERY_KEYS.nowPlaying, page],
    queryFn: () => fetchNowPlaying(page),
    staleTime: 1000 * 60 * 10,
  });
}

export function useTrendingMovies(page = 1) {
  return useQuery({
    queryKey: [...MOVIE_QUERY_KEYS.trending, page],
    queryFn: () => fetchTrending(page),
    staleTime: 1000 * 60 * 10,
  });
}

export function useTopRatedMovies(page = 1) {
  return useQuery({
    queryKey: [...MOVIE_QUERY_KEYS.topRated, page],
    queryFn: () => fetchTopRated(page),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSearchMovies(query: string, page = 1) {
  return useQuery({
    queryKey: MOVIE_QUERY_KEYS.search(query),
    queryFn: () => fetchSearch(query, page),
    enabled: query.trim().length > 0,
    staleTime: 1000 * 60 * 10,
  });
}

export function useGenres() {
  return useQuery({
    queryKey: MOVIE_QUERY_KEYS.genres,
    queryFn: fetchGenres,
    staleTime: 1000 * 60 * 30,
  });
}

export function useMovieDetails(id: string) {
  return useQuery({
    queryKey: MOVIE_QUERY_KEYS.details(id),
    queryFn: () => fetchMovieDetails(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useRecommendations(id: string) {
  return useQuery({
    queryKey: MOVIE_QUERY_KEYS.recommendations(id),
    queryFn: () => fetchRecommendations(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export type { AppMovie };