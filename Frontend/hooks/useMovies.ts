import { useQueries, useQuery } from '@tanstack/react-query';
import {
  fetchGenres,
  fetchMovieDetails,
  fetchMoviesByGenre,
  fetchNowPlaying,
  fetchPopular,
  fetchRecommendations,
  fetchSearch,
  fetchTopRated,
  fetchTrending,
  fetchUpcoming,
} from '@/services/movieService';

const LIST_STALE_TIME = 1000 * 60 * 10;
const GENRE_STALE_TIME = 1000 * 60 * 30;

export const MOVIE_QUERY_KEYS = {
  popular: ['movies', 'popular'],
  nowPlaying: ['movies', 'nowPlaying'],
  trending: ['movies', 'trending'],
  topRated: ['movies', 'topRated'],
  upcoming: ['movies', 'upcoming'],
  search: (query: string) => ['movies', 'search', query],
  genres: ['genres'],
  moviesByGenre: (genre: string, page = 1) => ['movies', 'byGenre', genre, page],
  details: (id: string) => ['movies', 'details', id],
  recommendations: (id: string) => ['movies', 'recommendations', id],
} as const;


export type MovieCategory = {
  label: string;
  genre: string;
};

export function usePopularMovies(page = 1) {
  return useQuery({
    queryKey: [...MOVIE_QUERY_KEYS.popular, page],
    queryFn: () => fetchPopular(page),
    staleTime: LIST_STALE_TIME,
  });
}

export function useNowPlayingMovies(page = 1) {
  return useQuery({
    queryKey: [...MOVIE_QUERY_KEYS.nowPlaying, page],
    queryFn: () => fetchNowPlaying(page),
    staleTime: LIST_STALE_TIME,
  });
}

export function useTrendingMovies(page = 1) {
  return useQuery({
    queryKey: [...MOVIE_QUERY_KEYS.trending, page],
    queryFn: () => fetchTrending(page),
    staleTime: LIST_STALE_TIME,
  });
}

export function useTopRatedMovies(page = 1) {
  return useQuery({
    queryKey: [...MOVIE_QUERY_KEYS.topRated, page],
    queryFn: () => fetchTopRated(page),
    staleTime: LIST_STALE_TIME,
  });
}

export function useUpcomingMovies(page = 1) {
  return useQuery({
    queryKey: [...MOVIE_QUERY_KEYS.upcoming, page],
    queryFn: () => fetchUpcoming(page),
    staleTime: LIST_STALE_TIME,
  });
}

export function useSearchMovies(query: string, page = 1) {
  return useQuery({
    queryKey: MOVIE_QUERY_KEYS.search(query),
    queryFn: () => fetchSearch(query, page),
    enabled: query.trim().length > 0,
    staleTime: LIST_STALE_TIME,
  });
}

export function useGenres() {
  return useQuery({
    queryKey: MOVIE_QUERY_KEYS.genres,
    queryFn: fetchGenres,
    staleTime: GENRE_STALE_TIME,
  });
}

export function useMoviesByGenre(genre: string, page = 1) {
  return useQuery({
    queryKey: MOVIE_QUERY_KEYS.moviesByGenre(genre, page),
    queryFn: () => fetchMoviesByGenre(genre, page),
    enabled: genre !== 'All',
    staleTime: LIST_STALE_TIME,
  });
}

export function useCategoryMovies(categories: MovieCategory[]) {
  return useQueries({
    queries: categories.map((category) => ({
      queryKey: MOVIE_QUERY_KEYS.moviesByGenre(category.genre),
      queryFn: () => fetchMoviesByGenre(category.genre),
      enabled: Boolean(category.genre),
      staleTime: LIST_STALE_TIME,
    })),
  });
}

export function useMovieDetails(id: string) {
  return useQuery({
    queryKey: MOVIE_QUERY_KEYS.details(id),
    queryFn: () => fetchMovieDetails(id),
    enabled: Boolean(id),
    staleTime: LIST_STALE_TIME,
  });
}

export function useRecommendations(id: string) {
  return useQuery({
    queryKey: MOVIE_QUERY_KEYS.recommendations(id),
    queryFn: () => fetchRecommendations(id),
    enabled: Boolean(id),
    staleTime: LIST_STALE_TIME,
  });
}
