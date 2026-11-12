import { tmdb } from '@/services/tmdb';

export type MovieVideo = {
  key: string;
  name: string;
  type: string;
  official: boolean;
};

const TYPE_PRIORITY = [
  'Trailer',
  'Teaser',
  'Clip',
  'Featurette',
  'Behind the Scenes',
  'Bloopers',
] as const;

export async function fetchMovieVideos(movieId: string, signal?: AbortSignal): Promise<MovieVideo[]> {
  const id = Number(movieId);
  if (!Number.isFinite(id)) return [];

  const response = await tmdb.getMovieVideos(id, signal);
  const seen = new Set<string>();

  return response.results
    .filter((video) => video.site === 'YouTube' && video.key && !seen.has(video.key))
    .filter((video) => {
      seen.add(video.key);
      return true;
    })
    .sort((a, b) => {
      const priority = (type: string) => {
        const index = TYPE_PRIORITY.indexOf(type as (typeof TYPE_PRIORITY)[number]);
        return index === -1 ? TYPE_PRIORITY.length : index;
      };
      return priority(a.type) - priority(b.type) || Number(b.official) - Number(a.official);
    })
    .slice(0, 12)
    .map(({ key, name, type, official }) => ({ key, name, type, official: Boolean(official) }));
}

export async function fetchTrailerKey(movieId: string, signal?: AbortSignal): Promise<string | null> {
  const videos = await fetchMovieVideos(movieId, signal);
  return videos.find((video) => video.type === 'Trailer' || video.type === 'Teaser')?.key ?? null;
}
