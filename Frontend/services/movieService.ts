import type { ImageSourcePropType } from 'react-native';
import { backdropUrl, posterUrl, tmdb } from '@/services/tmdb';
import type { TmdbGenre, TmdbMovie } from '@/services/tmdb';
import { formatReleaseYear } from '@/utils/format';
import type { AppMovie } from '@/types/movie';

const FALLBACK_POSTER = require('@/assets/images/poster-meridian.jpg');
const FALLBACK_BACKDROP = require('@/assets/images/hero-orbit.jpg');

/** Number of recommendations surfaced on the movie details screen. */
const RECOMMENDATION_LIMIT = 4;

function toImageSource(
  url: string | undefined,
  fallback: ImageSourcePropType,
): ImageSourcePropType {
  return url ? { uri: url } : fallback;
}

function resolveGenres(movie: TmdbMovie, genreNames: Map<number, string>): string[] {
  const names = movie.genres?.map((genre) => genre.name)
    ?? movie.genre_ids.map((genreId) => genreNames.get(genreId));

  return names.filter((name): name is string => Boolean(name));
}

/** Maps a raw TMDB payload onto the app's domain model. */
function mapMovie(movie: TmdbMovie, genres: TmdbGenre[]): AppMovie {
  const genreNames = new Map(genres.map((genre) => [genre.id, genre.name]));

  return {
    id: String(movie.id),
    title: movie.title,
    releaseYear: formatReleaseYear(movie.release_date),
    releaseDate: movie.release_date ?? '',
    runtime: movie.runtime ?? null,
    rating: movie.vote_average ?? 0,
    genres: resolveGenres(movie, genreNames),
    description: movie.overview ?? '',
    poster: toImageSource(posterUrl(movie.poster_path), FALLBACK_POSTER),
    backdrop: toImageSource(backdropUrl(movie.backdrop_path), FALLBACK_BACKDROP),
  };
}

/** Fetches a movie list and its genre lookup table in parallel, then maps it. */
async function fetchMovies(request: () => Promise<TmdbMovie[]>): Promise<AppMovie[]> {
  const [movies, genres] = await Promise.all([request(), tmdb.getGenres()]);
  return movies.map((movie) => mapMovie(movie, genres));
}

export function fetchPopular(page = 1): Promise<AppMovie[]> {
  return fetchMovies(() => tmdb.getPopular(page));
}

export function fetchNowPlaying(page = 1): Promise<AppMovie[]> {
  return fetchMovies(() => tmdb.getNowPlaying(page));
}

export function fetchTrending(page = 1): Promise<AppMovie[]> {
  return fetchMovies(() => tmdb.getTrending(page));
}

export function fetchTopRated(page = 1): Promise<AppMovie[]> {
  return fetchMovies(() => tmdb.getTopRated(page));
}

export function fetchUpcoming(page = 1): Promise<AppMovie[]> {
  return fetchMovies(() => tmdb.getUpcoming(page));
}

export function fetchSearch(query: string, page = 1): Promise<AppMovie[]> {
  return fetchMovies(() => tmdb.search(query, page));
}

export async function fetchMovieDetails(movieId: string): Promise<AppMovie | null> {
  const id = Number(movieId);
  if (!Number.isFinite(id)) {
    return null;
  }

  const [movie, genres] = await Promise.all([tmdb.getDetails(id), tmdb.getGenres()]);
  return mapMovie(movie, genres);
}

export async function fetchGenres(): Promise<string[]> {
  const genres = await tmdb.getGenres();
  return genres.map((genre) => genre.name);
}

export async function fetchMoviesByGenre(
  genreName: string,
  page = 1,
): Promise<AppMovie[]> {
  const genres = await tmdb.getGenres();
  const genreId = genres.find((genre) => genre.name === genreName)?.id;
  if (genreId === undefined) {
    return [];
  }

  const movies = await tmdb.getDiscover(genreId, page);
  return movies.map((movie) => mapMovie(movie, genres));
}

export async function fetchRecommendations(movieId: string): Promise<AppMovie[]> {
  const id = Number(movieId);
  if (!Number.isFinite(id)) {
    return [];
  }

  const [movies, genres] = await Promise.all([
    tmdb.getRecommendations(id),
    tmdb.getGenres(),
  ]);
  return movies.slice(0, RECOMMENDATION_LIMIT).map((movie) => mapMovie(movie, genres));
}
