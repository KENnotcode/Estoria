import Constants from 'expo-constants';

const EXTRA = (Constants.expoConfig?.extra ?? {}) as { tmdbApiKey?: string };
const API_KEY = EXTRA.tmdbApiKey ?? process.env.EXPO_PUBLIC_TMDB_API_KEY ?? '';

const BASE_URL = 'https://api.themoviedb.org/3';
const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'w780';

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbMovie {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  genre_ids: number[];
  runtime?: number;
  genres?: TmdbGenre[];
  original_language?: string;
}

interface TmdbListResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export class TmdbClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  getPopular(page = 1): Promise<TmdbMovie[]> {
    return this.list('/movie/popular', page);
  }

  getNowPlaying(page = 1): Promise<TmdbMovie[]> {
    return this.list('/movie/now_playing', page);
  }

  getTrending(page = 1): Promise<TmdbMovie[]> {
    return this.list('/trending/movie/day', page);
  }

  getTopRated(page = 1): Promise<TmdbMovie[]> {
    return this.list('/movie/top_rated', page);
  }

  getUpcoming(page = 1): Promise<TmdbMovie[]> {
    return this.list('/movie/upcoming', page);
  }

  getRecommendations(movieId: number): Promise<TmdbMovie[]> {
    return this.list(`/movie/${movieId}/recommendations`, 1);
  }

  search(query: string, page = 1): Promise<TmdbMovie[]> {
    return this.list('/search/movie', page, { query });
  }

  getDetails(id: number): Promise<TmdbMovie> {
    return this.request<TmdbMovie>(`/movie/${id}`);
  }

  getGenres(): Promise<TmdbGenre[]> {
    return this.request<{ genres: TmdbGenre[] }>('/genre/movie/list').then(
      (data) => data.genres,
    );
  }

  getDiscover(genreId: number, page = 1): Promise<TmdbMovie[]> {
    return this.list('/discover/movie', page, {
      with_genres: String(genreId),
      sort_by: 'popularity.desc',
    });
  }

  private async list(
    endpoint: string,
    page: number,
    extra: Record<string, string> = {},
  ): Promise<TmdbMovie[]> {
    const data = await this.request<TmdbListResponse<TmdbMovie>>(endpoint, {
      page: String(page),
      ...extra,
    });
    return data.results;
  }
}

export const tmdb = new TmdbClient(API_KEY);

export function posterUrl(path: string | null | undefined): string | undefined {
  return path ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${path}` : undefined;
}

export function backdropUrl(path: string | null | undefined): string | undefined {
  return path ? `https://image.tmdb.org/t/p/${BACKDROP_SIZE}${path}` : undefined;
}