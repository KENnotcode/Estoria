import type { TmdbGenre, TmdbMovie } from '../services/tmdb';
import { backdropUrl, posterUrl, tmdb } from '../services/tmdb';
import type { AppMovie } from '../types/movie';

export type { AppMovie };

const FALLBACK_POSTER = require('../assets/images/poster-meridian.jpg');
const FALLBACK_BACKDROP = require('../assets/images/hero-orbit.jpg');

function mapMovie(movie: TmdbMovie, genres: TmdbGenre[]): AppMovie {
  const genreMap = new Map(genres.map((g) => [g.id, g.name] as const));
  return {
    id: String(movie.id),
    title: movie.title,
    releaseYear: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
    runtime: movie.runtime ?? 120,
    rating: movie.vote_average ?? 0,
    genres: movie.genres?.map((g) => g.name) ?? movie.genre_ids.map((id) => genreMap.get(id) ?? String(id)),
    description: movie.overview ?? '',
    poster: posterUrl(movie.poster_path) ? { uri: posterUrl(movie.poster_path)! } : FALLBACK_POSTER,
    backdrop: backdropUrl(movie.backdrop_path) ? { uri: backdropUrl(movie.backdrop_path)! } : FALLBACK_BACKDROP,
  };
}

export async function fetchPopular(page = 1): Promise<AppMovie[]> {
  const [movies, genres] = await Promise.all([
    tmdb.getPopular(page),
    tmdb.getGenres(),
  ]);
  return movies.map((m) => mapMovie(m, genres));
}

export async function fetchNowPlaying(page = 1): Promise<AppMovie[]> {
  const [movies, genres] = await Promise.all([
    tmdb.getNowPlaying(page),
    tmdb.getGenres(),
  ]);
  return movies.map((m) => mapMovie(m, genres));
}

export async function fetchTrending(page = 1): Promise<AppMovie[]> {
  const [movies, genres] = await Promise.all([
    tmdb.getTrending(page),
    tmdb.getGenres(),
  ]);
  return movies.map((m) => mapMovie(m, genres));
}

export async function fetchSearch(query: string, page = 1): Promise<AppMovie[]> {
  const [movies, genres] = await Promise.all([
    tmdb.search(query, page),
    tmdb.getGenres(),
  ]);
  return movies.map((m) => mapMovie(m, genres));
}

export async function fetchMovieDetails(id: string): Promise<AppMovie | null> {
  const [movie, genres] = await Promise.all([
    tmdb.getDetails(Number(id)),
    tmdb.getGenres(),
  ]);
  return mapMovie(movie, genres);
}

export async function fetchGenres(): Promise<string[]> {
  const genres = await tmdb.getGenres();
  return genres.map((g) => g.name);
}

export async function fetchRecommendations(movieId: string): Promise<AppMovie[]> {
  const [movies, allGenres] = await Promise.all([
    tmdb.request<TmdbMovie[]>(`/movie/${movieId}/recommendations`, { page: '1' }),
    tmdb.getGenres(),
  ]);
  return movies.slice(0, 4).map((m) => mapMovie(m, allGenres));
}

export const FALLBACK_POSTER_IMAGE = FALLBACK_POSTER;
export const FALLBACK_BACKDROP_IMAGE = FALLBACK_BACKDROP;