import React from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState } from '../../../components/EmptyState';
import { MovieCard } from '../../../components/MovieCard';
import { Skeleton } from '../../../components/Skeleton';
import { NetworkStatusBanner } from '../../../components/NetworkStatusBanner';
import { poster, spacing, type } from '../../../constants/theme';
import { useColors } from '../../../hooks/useColors';
import { useFavorites } from '../../../context/FavoritesContext';
import { useMovieDetails } from '../../../hooks/useMovies';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

function FavoriteItem({ id, posterWidth, onOpen }: { id: string; posterWidth: number; onOpen: (id: string) => void }) {
  const { data: movie, isLoading } = useMovieDetails(id);
  if (isLoading) {
    return <Skeleton width={posterWidth} height={posterWidth / poster.aspectRatio} borderRadius={12} />;
  }
  if (!movie) return null;
  return <MovieCard movie={movie} width={posterWidth} onPress={() => onOpen(id)} />;
}

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { favoriteIds } = useFavorites();
  const { isOnline } = useNetworkStatus();

  const posterWidth = (screenWidth - spacing.screen * 2 - poster.gridGutter) / 2;

  const openMovie = (id: string) => router.push({ pathname: '/movie/[id]', params: { id } });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <NetworkStatusBanner isOnline={isOnline} />
      <FlatList
        data={favoriteIds}
        keyExtractor={(item) => item}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + spacing.md, paddingBottom: 112, flexGrow: favoriteIds.length ? 0 : 1 }]}
        renderItem={({ item }) => <FavoriteItem id={item} posterWidth={posterWidth} onOpen={openMovie} />}
        ListHeaderComponent={<View style={styles.header}><Text style={[styles.kicker, { color: colors.primary }]}>YOUR COLLECTION</Text><Text style={[styles.title, { color: colors.foreground }]}>Saved for later</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{favoriteIds.length ? `${favoriteIds.length} films you want to remember` : 'Keep the stories that stay with you.'}</Text></View>}
        ListEmptyComponent={<EmptyState title="Your list is empty" message="Save a movie and it will be waiting here whenever you are ready." actionLabel="Browse movies" onAction={() => router.push('/search')} icon="heart" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingHorizontal: spacing.screen },
  header: { marginBottom: spacing.lg + 10 },
  kicker: { ...type.kicker, marginBottom: 6 },
  title: { ...type.pageTitle },
  subtitle: { ...type.subtitle, marginTop: spacing.sm },
  column: { justifyContent: 'space-between', marginBottom: spacing.lg + 6 },
});
