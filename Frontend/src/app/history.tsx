import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { MovieCard } from '@/components/MovieCard';
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner';
import { Skeleton } from '@/components/Skeleton';
import { poster, spacing, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useMovieDetails } from '@/hooks/useMovies';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useWatchHistory } from '@/context/WatchHistoryContext';
import type { WatchHistoryEntry } from '@/services/watchHistoryRepository';

function HistoryItem({
  entry,
  posterWidth,
  onOpen,
}: {
  entry: WatchHistoryEntry;
  posterWidth: number;
  onOpen: (movieId: string) => void;
}) {
  const { data: movie, isLoading } = useMovieDetails(entry.movieId);
  if (isLoading) {
    return <Skeleton width={posterWidth} height={posterWidth / poster.aspectRatio} borderRadius={12} />;
  }
  if (!movie) return null;
  return <MovieCard movie={movie} width={posterWidth} onPress={() => onOpen(entry.movieId)} />;
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { entries } = useWatchHistory();
  const { isOnline } = useNetworkStatus();
  const posterWidth = (screenWidth - spacing.screen * 2 - poster.gridGutter) / 2;
  const openMovie = (movieId: string) => router.push({ pathname: '/movie/[id]', params: { id: movieId } });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <NetworkStatusBanner isOnline={isOnline} />
      <FlatList
        data={entries}
        keyExtractor={(entry) => entry.movieId}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + spacing.md, paddingBottom: 112, flexGrow: entries.length ? 0 : 1 }]}
        renderItem={({ item }) => <HistoryItem entry={item} posterWidth={posterWidth} onOpen={openMovie} />}
        ListHeaderComponent={<View style={styles.header}><Text style={[styles.kicker, { color: colors.primary }]}>YOUR ACTIVITY</Text><Text style={[styles.title, { color: colors.foreground }]}>Watch history</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{entries.length ? `${entries.length} recently watched ${entries.length === 1 ? 'film' : 'films'}` : 'Films you have watched will appear here.'}</Text></View>}
        ListEmptyComponent={<EmptyState title="No watch history yet" message="Open a trailer and it will appear here." actionLabel="Browse movies" onAction={() => router.push('/search')} icon="clock" />}
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
