import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../../components/EmptyState';
import { MovieCard } from '../../../components/MovieCard';
import { SearchBar } from '../../../components/SearchBar';
import { useColors } from '../../../hooks/useColors';
import { useGenres, useMoviesByGenre, usePopularMovies, useSearchMovies } from '../../../hooks/useMovies';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Could not search movies"
          message="Check your internet connection and try again."
          actionLabel="Retry"
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
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 12, paddingBottom: 112, flexGrow: filteredMovies.length ? 0 : 1 }]}
        renderItem={({ item }) => <MovieCard movie={item} width={156} onPress={() => router.push({ pathname: '/movie/[id]', params: { id: item.id } })} />}
        ListHeaderComponent={
          <View>
            <View style={styles.titleRow}><View><Text style={[styles.kicker, { color: colors.primary }]}>THE LIBRARY</Text><Text style={[styles.title, { color: colors.foreground }]}>Find your next story</Text></View><Feather name="search" size={23} color={colors.mutedForeground} /></View>
            <SearchBar value={query} onChangeText={setQuery} />
            <FlatList data={genreList} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item) => item} contentContainerStyle={styles.genreList} renderItem={({ item }) => <Pressable accessibilityRole="button"               onPress={() => router.setParams({ genre: item })} style={[styles.genre, { backgroundColor: selectedGenre === item ? colors.primary : colors.card }]}><Text style={[styles.genreText, { color: selectedGenre === item ? colors.primaryForeground : colors.mutedForeground }]}>{item}</Text></Pressable>} />
            <View style={styles.resultsHeader}><Text style={[styles.resultsTitle, { color: colors.foreground }]}>{query.trim() || selectedGenre !== 'All' ? 'Your results' : 'Popular picks'}</Text><Text style={[styles.count, { color: colors.mutedForeground }]}>{filteredMovies.length} films</Text></View>
          </View>
        }
        ListEmptyComponent={loading ? (
          <View style={styles.centered}>
            <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>Searching...</Text>
          </View>
        ) : (
          <EmptyState title="No movies found" message="Try another title or explore a different genre." actionLabel="Clear filters"           onAction={() => { setQuery(''); router.setParams({ genre: 'All' }); }} icon="search" />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingHorizontal: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 },
  kicker: { fontSize: 10, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  title: { fontSize: 25, letterSpacing: -0.6, fontFamily: 'Inter_700Bold' },
  genreList: { paddingVertical: 18, gap: 8 },
  genre: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  genreText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 },
  resultsTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  count: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  column: { justifyContent: 'space-between', marginBottom: 22 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});