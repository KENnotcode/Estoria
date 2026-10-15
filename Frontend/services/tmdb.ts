const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'w780';

const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY ?? '';

if (__DEV__ && API_KEY.length === 0) {
  console.warn('[tmdb] EXPO_PUBLIC_TMDB_API_KEY is not set; TMDB requests will fail.');
}

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

interface TmdbGenreListResponse {
  genres: TmdbGenre[];
}

/** `YYYY-MM-DD` for today in the device's own timezone (not UTC). */
function toIsoDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Thin, typed wrapper around the TMDB REST API. */
export class TmdbClient {
  private readonly apiKey: string;
  private genresRequest: Promise<TmdbGenre[]> | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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

  /**
   * Films that have not opened yet.
   *
   * TMDB's `/movie/upcoming` cannot be used as-is: it is not filtered by
   * release date on the server, so page one is mostly titles that already
   * opened. Discover with a date filter is the supported way to ask for
   * genuine upcoming releases.
   *
   * Results are ordered by popularity rather than date here. Sorting by
   * `primary_release_date.asc` is unusable: the oldest "not yet released"
   * entries are placeholder-dated to today, so the first pages fill up with
   * junk that the UI discards. Popularity puts real titles first; the UI then
   * re-orders by date for the "Soon on Estoria" rail.
   */
  getUpcoming(page = 1): Promise<TmdbMovie[]> {
    return this.list('/discover/movie', page, {
      sort_by: 'popularity.desc',
      'primary_release_date.gte': toIsoDate(Date.now()),
      'with_release_type': '2|3',
      include_video: 'false',
    });
  }

  getRecommendations(movieId: number): Promise<TmdbMovie[]> {
    return this.list(`/movie/${movieId}/recommendations`);
  }

  search(query: string, page = 1): Promise<TmdbMovie[]> {
    return this.list('/search/movie', page, { query });
  }

  getDetails(movieId: number): Promise<TmdbMovie> {
    return this.request<TmdbMovie>(`/movie/${movieId}`);
  }

  getDiscover(genreId: number, page = 1): Promise<TmdbMovie[]> {
    return this.list('/discover/movie', page, {
      with_genres: String(genreId),
      sort_by: 'popularity.desc',
    });
  }

  /** Genres are immutable, so the in-flight request is shared between callers. */
  getGenres(): Promise<TmdbGenre[]> {
    this.genresRequest ??= this.request<TmdbGenreListResponse>('/genre/movie/list')
      .then((data) => data.genres)
      .catch((error: unknown) => {
        this.genresRequest = null;
        throw error;
      });

    return this.genresRequest;
  }

  private async list(
    endpoint: string,
    page = 1,
    extraParams: Record<string, string> = {},
  ): Promise<TmdbMovie[]> {
    const data = await this.request<TmdbListResponse<TmdbMovie>>(endpoint, {
      page: String(page),
      ...extraParams,
    });
    return data.results;
  }

  private async request<T>(
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `TMDB request failed (${response.status} ${response.statusText}): ${endpoint}`,
      );
    }

    return (await response.json()) as T;
  }
}

export const tmdb = new TmdbClient(API_KEY);

function buildImageUrl(path: string | null | undefined, size: string): string | undefined {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : undefined;
}

export function posterUrl(path: string | null | undefined): string | undefined {
  return buildImageUrl(path, POSTER_SIZE);
}

export function backdropUrl(path: string | null | undefined): string | undefined {
  return buildImageUrl(path, BACKDROP_SIZE);
}
