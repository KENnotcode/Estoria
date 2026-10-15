import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../../components/EmptyState';
import { GenreFilter } from '../../../components/GenreFilter';
import { MovieCard } from '../../../components/MovieCard';
import { MovieGridSkeleton } from '../../../components/Skeleton';
import { SearchBar } from '../../../components/SearchBar';
import { poster, spacing, type } from '../../../constants/theme';
import { useColors } from '../../../hooks/useColors';
import { useGenres, useMoviesByGenre, usePopularMovies, useSearchMovies } from '../../../hooks/useMovies';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { genre } = useLocalSearchParams<{ genre?: string }>();
  const [query, setQuery] = useState('');
  const selectedGenre = genre ?? 'All';

  const { data: popular = [], isLoading: popularLoading, refetch: refetchPopular } = usePopularMovies();
  const { data: searchResults = [], isLoading: searchLoading, error: searchError, refetch } = useSearchMovies(query);
  const { data: genres = [] } = useGenres();
  const { data: genreMovies = [], isLoading: genreLoading, error: genreError, refetch: refetchGenre } = useMoviesByGenre(selectedGenre);

  const baseResults = query.trim() ? searchResults : selectedGenre !== 'All' ? genreMovies : popular;
  const filteredMovies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return baseResults.filter((movie) => {
      const matchesGenre = selectedGenre === 'All' || movie.genres.includes(selectedGenre);
      const matchesQuery = !normalizedQuery || [movie.title, movie.description, ...movie.genres].join(' ').toLowerCase().includes(normalizedQuery);
      return matchesGenre && matchesQuery;
    });
  }, [query, selectedGenre, baseResults]);

  const genreList = ['All', ...genres];
  const loading = query.trim() ? searchLoading : selectedGenre !== 'All' ? genreLoading : popularLoading;
  const error = genreError || searchError;

  // Posters are one of two measured columns, so the metric scales with the
  // viewport instead of a fixed pixel width.
  const posterWidth =
    (screenWidth - spacing.screen * 2 - poster.gridGutter) / 2;

  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Could not search movies"
          message="Check your internet connection and try again."
          actionLabel="Retry"
          actionLoading={loading}
          onAction={() => {
            if (query.trim()) refetch();
            else if (selectedGenre !== 'All') refetchGenre();
            else refetchPopular();
          }}
          icon="alert-triangle"
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredMovies}
        numColumns={2}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + spacing.md, paddingBottom: 112, flexGrow: filteredMovies.length ? 0 : 1 }]}
        renderItem={({ item }) => <MovieCard movie={item} width={posterWidth} onPress={() => router.push({ pathname: '/movie/[id]', params: { id: item.id } })} />}
        ListHeaderComponent={
          <View>
            <View style={styles.titleRow}>
              <View>
                <Text style={[styles.kicker, { color: colors.primary }]}>THE LIBRARY</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>Find your next story</Text>
              </View>
            </View>
            <SearchBar value={query} onChangeText={setQuery} />
            <GenreFilter
              genres={genreList}
              selectedGenre={selectedGenre}
              onSelect={(value) => router.setParams({ genre: value })}
            />
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: colors.foreground }]}>{query.trim() || selectedGenre !== 'All' ? 'Your results' : 'Popular picks'}</Text>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>{filteredMovies.length} films</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <MovieGridSkeleton itemWidth={posterWidth} count={6} gutter={poster.gridGutter} />
          ) : (
            <EmptyState title="No movies found" message="Try another title or explore a different genre." actionLabel="Clear filters" onAction={() => { setQuery(''); router.setParams({ genre: 'All' }); }} icon="search" />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingHorizontal: spacing.screen },
  titleRow: { marginBottom: spacing.lg },
  kicker: { ...type.kicker, marginBottom: 6 },
  title: { ...type.pageTitle },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg, marginTop: spacing.xs },
  resultsTitle: { ...type.sectionTitle },
  count: { ...type.caption, ...type.numeric },
  column: { justifyContent: 'space-between', marginBottom: spacing.lg + 6 },
});
