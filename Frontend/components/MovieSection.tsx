import { ScrollView, StyleSheet, View } from 'react-native';
import { MovieCard } from '@/components/MovieCard';
import { SectionHeader } from '@/components/SectionHeader';
import { spacing } from '@/constants/theme';
import { useOpenMovie } from '@/hooks/useOpenMovie';
import type { AppMovie } from '@/types/movie';

type MovieSectionProps = {
  title: string;
  movies: AppMovie[];
  /** Enables the trailing "See all" action. */
  onSeeAll?: () => void;
};

/** A titled, horizontally scrollable row of movie posters. */
export function MovieSection({ title, movies, onSeeAll }: MovieSectionProps) {
  const openMovie = useOpenMovie();

  if (movies.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader title={title} onPress={onSeeAll} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onPress={() => openMovie(movie)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.section,
  },
  row: {
    paddingRight: spacing.sm,
  },
});
