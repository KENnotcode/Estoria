import { ScrollView, StyleSheet, View } from 'react-native';
import { MovieCard } from '@/components/MovieCard';
import { SectionHeader } from '@/components/SectionHeader';
import { spacing } from '@/constants/theme';
import type { AppMovie } from '@/types/movie';

type UpcomingRailProps = {
  /** Movies to render in the upcoming rail. Only released/upcoming titles. */
  movies: AppMovie[];
  /** Formats the ETA badge for a movie's release date. */
  formatEta: (releaseDate: string) => string | undefined;
  /** Navigates to the movie details screen. */
  onPress: (id: string, releaseDate?: string) => void;
};

/**
 * Horizontal rail of upcoming releases, each card showing an ETA badge
 * (Today / Tomorrow / In Xd / In Xmo) instead of a rating.
 */
export function UpcomingRail({ movies, formatEta, onPress }: UpcomingRailProps) {
  const upcoming = movies.filter((movie) => Boolean(formatEta(movie.releaseDate)));

  if (upcoming.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <SectionHeader title="Soon on Estoria" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
      >
        {upcoming.slice(0, 10).map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            eta={formatEta(movie.releaseDate)}
            showRating={false}
            onPress={() => onPress(movie.id, movie.releaseDate)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.section,
  },
  rowContent: {
    paddingRight: spacing.sm,
  },
});
