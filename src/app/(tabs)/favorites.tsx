import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState } from '../../../components/EmptyState';
import { MovieCard } from '../../../components/MovieCard';
import { useColors } from '../../../hooks/useColors';
import { useFavorites } from '../../../context/FavoritesContext';
import { useMovieDetails } from '../../../hooks/useMovies';

function FavoriteItem({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  const { data: movie } = useMovieDetails(id);
  if (!movie) return null;
  return <MovieCard movie={movie} width={156} onPress={() => onOpen(id)} />;
}

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favoriteIds } = useFavorites();

  const openMovie = (id: string) => router.push({ pathname: '/movie/[id]', params: { id } });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={favoriteIds}
        keyExtractor={(item) => item}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 16, paddingBottom: 112, flexGrow: favoriteIds.length ? 0 : 1 }]}
        renderItem={({ item }) => <FavoriteItem id={item} onOpen={openMovie} />}
        ListHeaderComponent={<View style={styles.header}><Text style={[styles.kicker, { color: colors.primary }]}>YOUR COLLECTION</Text><Text style={[styles.title, { color: colors.foreground }]}>Saved for later</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{favoriteIds.length ? `${favoriteIds.length} films you want to remember` : 'Keep the stories that stay with you.'}</Text></View>}
        ListEmptyComponent={<EmptyState title="Your list is empty" message="Save a movie and it will be waiting here whenever you are ready." actionLabel="Browse movies" onAction={() => router.push('/search')} icon="heart" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingHorizontal: 20 },
  header: { marginBottom: 26 },
  kicker: { fontSize: 10, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  title: { fontSize: 26, letterSpacing: -0.7, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 8 },
  column: { justifyContent: 'space-between', marginBottom: 22 },
});