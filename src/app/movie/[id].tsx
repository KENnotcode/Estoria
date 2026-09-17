import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../../components/EmptyState';
import { MovieCard } from '../../../components/MovieCard';
import { useFavorites } from '../../../context/FavoritesContext';
import { useColors } from '../../../hooks/useColors';
import { useMovieDetails, useRecommendations } from '../../../hooks/useMovies';

const TODAY = new Date().toISOString().slice(0, 10);

const formatReleaseDate = (releaseDate: string) => {
  if (!releaseDate) return undefined;
  const date = new Date(`${releaseDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

export default function MovieDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, upcoming, releaseDate: routeReleaseDate } = useLocalSearchParams<{ id: string; upcoming?: string; releaseDate?: string }>();
  const { data: movie, isLoading, error, refetch } = useMovieDetails(id ?? '');
  const { data: recommendations = [] } = useRecommendations(id ?? '');
  const { isFavorite, toggleFavorite } = useFavorites();

  if (isLoading) {
    return <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}><Text style={{ color: colors.mutedForeground }}>Loading…</Text></View>;
  }

  if (error || !movie) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <EmptyState title="Movie not found" message="The film you were looking for is unavailable." actionLabel="Go back" onAction={() => router.back()} icon="film" />
      </View>
    );
  }

  const favorite = isFavorite(movie.id);
  const releaseDate = movie.releaseDate || routeReleaseDate || '';
  const releaseEta = formatReleaseDate(releaseDate);
  const isUpcoming = upcoming === 'true' || (!!releaseDate && releaseDate >= TODAY);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        <ImageBackground source={movie.backdrop} resizeMode="cover" style={styles.backdrop}>
          <LinearGradient colors={['rgba(12,13,16,0.1)', colors.background]} locations={[0.35, 1]} style={styles.backdropGradient}>
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.iconButton}><Feather name="arrow-left" size={20} color={colors.foreground} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'} onPress={() => toggleFavorite(movie.id)} style={styles.iconButton}><Feather name="heart" size={19} color={favorite ? colors.primary : colors.foreground} /></Pressable></View>
          </LinearGradient>
        </ImageBackground>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground, top: 13 }]}>{movie.title}</Text>
          <View style={styles.metaRow}>{isUpcoming && releaseEta ? <Text style={[styles.meta, { color: colors.tint }]}>Estimated Release Date:<Text style={[styles.meta, { color: colors.foreground }]}>  {releaseEta}</Text></Text> : <View style={styles.rating}><Feather name="star" size={14} color={colors.primary} /><Text style={[styles.metaStrong, { color: colors.foreground }]}>{movie.rating.toFixed(1)}</Text></View>}<Text style={[styles.meta, { color: colors.mutedForeground }]}></Text>{!isUpcoming ? <><Text style={[styles.dot, { color: colors.mutedForeground }]}>•</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</Text></> : null}</View>
          <View style={styles.genreRow}>{movie.genres.map((genre) => <View key={genre} style={[styles.genre, { backgroundColor: colors.card }]}><Text style={[styles.genreText, { color: colors.mutedForeground }]}>{genre}</Text></View>)}</View>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{movie.description}</Text>
          <View style={styles.actions}><Pressable accessibilityRole="button" onPress={() => Alert.alert('Preview unavailable', 'Trailer previews will be available soon.')} style={[styles.primaryAction, { backgroundColor: colors.foreground }]}><Feather name="play" size={15} fill={colors.background} color={colors.background} /><Text style={[styles.primaryActionText, { color: colors.background }]}>Play preview</Text></Pressable><Pressable accessibilityRole="button" onPress={() => toggleFavorite(movie.id)} style={[styles.secondaryAction, { borderColor: colors.border }]}><Feather name="heart" size={17} color={favorite ? colors.primary : colors.foreground} /><Text style={[styles.secondaryActionText, { color: colors.foreground }]}>{favorite ? 'Saved' : 'Save'}</Text></Pressable></View>
          {recommendations.length ? <><Text style={[styles.recommendationTitle, { color: colors.foreground }]}>You may also like</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{recommendations.map((item) => <MovieCard key={item.id} movie={item} onPress={() => router.push({ pathname: '/movie/[id]', params: { id: item.id } })} />)}</ScrollView></> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backdrop: { height: 392 },
  backdropGradient: { flex: 1 },
  topBar: { paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(12,13,16,0.65)', alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, marginTop: -34 },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7 },
  tagText: { color: '#FFFFFF', fontSize: 9, letterSpacing: 1, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 31, letterSpacing: -0.8, fontFamily: 'Inter_700Bold', marginTop: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaStrong: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  dot: { fontSize: 12 },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 18 },
  genre: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  genreText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  description: { fontSize: 14, lineHeight: 22, fontFamily: 'Inter_400Regular', marginTop: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 23 },
  primaryAction: { flex: 1, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryActionText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  secondaryAction: { width: 106, height: 48, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  secondaryActionText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  recommendationTitle: { fontSize: 19, fontFamily: 'Inter_700Bold', marginTop: 36, marginBottom: 15 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  backLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 14 },
});