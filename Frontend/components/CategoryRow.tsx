import { useRouter } from 'expo-router';
import { MovieSection } from '@/components/MovieSection';
import type { AppMovie } from '@/types/movie';

type CategoryRowProps = {
  /** Display label for the category section header. */
  label: string;
  /** TMDB genre name used to deep-link into filtered search. */
  genre: string;
  /** Movies belonging to this category. */
  movies: AppMovie[];
};

/**
 * One "Browse by category" row: a MovieSection whose "See all" action
 * opens Search with the row's genre selected.
 */
export function CategoryRow({ label, genre, movies }: CategoryRowProps) {
  const router = useRouter();

  return (
    <MovieSection
      title={label}
      movies={movies}
      onSeeAll={() => router.push({ pathname: '/search', params: { genres: genre } })}
    />
  );
}