import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppPressable } from '../../../components/AppPressable';
import { EmptyState } from '../../../components/EmptyState';
import { MovieCard } from '../../../components/MovieCard';
import { MovieRailSkeleton, Skeleton } from '../../../components/Skeleton';
import { useFavorites } from '../../../context/FavoritesContext';
import { border, radius, spacing, surface, type } from '../../../constants/theme';
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

/** Placeholder shaped like the loaded detail layout. */
function DetailsSkeleton() {
  return (
    <View accessibilityElementsHidden>
      <Skeleton width="100%" height={392} borderRadius={0} />
      <View style={styles.skeletonContent}>
        <Skeleton width="72%" height={30} borderRadius={8} />
        <Skeleton width="45%" height={13} borderRadius={6} style={{ marginTop: 12 }} />
        <View style={styles.skeletonGenreRow}>
          <Skeleton width={64} height={26} borderRadius={radius.sm} />
          <Skeleton width={80} height={26} borderRadius={radius.sm} />
        </View>
        <Skeleton width="100%" height={15} borderRadius={6} style={{ marginTop: 20 }} />
        <Skeleton width="96%" height={15} borderRadius={6} style={{ marginTop: 8 }} />
        <Skeleton width="88%" height={15} borderRadius={6} style={{ marginTop: 8 }} />
        <Skeleton width="100%" height={48} borderRadius={radius.md} style={{ marginTop: 24 }} />
      </View>
      <MovieRailSkeleton />
    </View>
  );
}

export default function MovieDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, upcoming, releaseDate: routeReleaseDate } = useLocalSearchParams<{ id: string; upcoming?: string; releaseDate?: string }>();
  const { data: movie, isLoading, error } = useMovieDetails(id ?? '');
  const { data: recommendations = [] } = useRecommendations(id ?? '');
  const { isFavorite, toggleFavorite } = useFavorites();

  if (isLoading) {
    return (
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <DetailsSkeleton />
      </ScrollView>
    );
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
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
              <AppPressable accessibilityLabel="Go back" onPress={() => router.back()} accentColor={colors.primary} style={[styles.iconButton, { borderColor: border.hairline, borderWidth: StyleSheet.hairlineWidth }]}>
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </AppPressable>
              <AppPressable accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'} accessibilityState={{ selected: favorite }} onPress={() => toggleFavorite(movie.id)} accentColor={colors.primary} style={[styles.iconButton, { borderColor: border.hairline, borderWidth: StyleSheet.hairlineWidth }]}>
                <Feather name="heart" size={19} color={favorite ? colors.primary : colors.foreground} />
              </AppPressable>
            </View>
          </LinearGradient>
        </ImageBackground>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>{movie.title}</Text>
          <View style={styles.metaRow}>{isUpcoming && releaseEta ? <Text style={[styles.meta, styles.numeric, { color: colors.tint }]}>Estimated release:<Text style={[styles.meta, { color: colors.foreground }]}>  {releaseEta}</Text></Text> : <View style={styles.rating}><Feather name="star" size={14} color={colors.primary} /><Text style={[styles.metaStrong, { color: colors.foreground }]}>{movie.rating.toFixed(1)}</Text></View>}{!isUpcoming && movie.runtime != null ? <><Text style={[styles.dot, { color: colors.mutedForeground }]}>·</Text><Text style={[styles.meta, styles.numeric, { color: colors.mutedForeground }]}>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</Text></> : null}</View>
          <View style={styles.genreRow}>{movie.genres.map((genre) => <View key={genre} style={[styles.genre, { backgroundColor: surface.sunken, borderColor: border.hairline, borderWidth: StyleSheet.hairlineWidth }]}><Text style={[styles.genreText, { color: colors.mutedForeground }]}>{genre}</Text></View>)}</View>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{movie.description}</Text>
          <View style={styles.actions}>
            <AppPressable
              accessibilityLabel="Play preview"
              onPress={() => Alert.alert('Preview unavailable', 'Trailer previews will be available soon.')}
              accentColor={colors.primary}
              style={[styles.primaryAction, { backgroundColor: colors.foreground }]}
              pressedStyle={styles.actionPressed}
            >
              <Feather name="play" size={15} fill={colors.background} color={colors.background} />
              <Text style={[styles.primaryActionText, { color: colors.background }]}>Play preview</Text>
            </AppPressable>
            <AppPressable
              accessibilityLabel={favorite ? `Remove ${movie.title} from favorites` : `Save ${movie.title} to favorites`}
              accessibilityState={{ selected: favorite }}
              onPress={() => toggleFavorite(movie.id)}
              accentColor={colors.primary}
              style={[styles.secondaryAction, { borderColor: border.hairline }]}
              pressedStyle={styles.actionPressed}
            >
              <Feather name="heart" size={17} color={favorite ? colors.primary : colors.foreground} />
              <Text style={[styles.secondaryActionText, { color: colors.foreground }]}>{favorite ? 'Saved' : 'Save'}</Text>
            </AppPressable>
          </View>
          {recommendations.length ? <><Text style={[styles.recommendationTitle, { color: colors.foreground }]}>You may also like</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendationRow}>{recommendations.map((item) => <MovieCard key={item.id} movie={item} onPress={() => router.push({ pathname: '/movie/[id]', params: { id: item.id } })} />)}</ScrollView></> : null}
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(12,13,16,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.screen, marginTop: -34 },
  skeletonContent: { paddingHorizontal: spacing.screen, marginTop: -34 },
  skeletonGenreRow: { flexDirection: 'row', gap: spacing.sm - 1, marginTop: spacing.lg },
  title: { ...type.hero, fontSize: 30, marginTop: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 2, marginTop: spacing.sm + 2 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 1 },
  metaStrong: { ...type.meta, ...type.numeric, fontFamily: type.label.fontFamily },
  meta: { ...type.meta },
  numeric: type.numeric,
  dot: { ...type.meta },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 1, marginTop: spacing.lg },
  genre: { paddingHorizontal: spacing.md - 2, paddingVertical: 7, borderRadius: radius.sm },
  genreText: { ...type.caption },
  description: { ...type.body, marginTop: spacing.lg + 4 },
  actions: { flexDirection: 'row', gap: spacing.md - 2, marginTop: spacing.xl },
  primaryAction: { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm },
  primaryActionText: { ...type.button },
  secondaryAction: { width: 106, height: 48, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm - 1 },
  secondaryActionText: { ...type.label },
  actionPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  recommendationTitle: { ...type.sectionTitle, marginTop: spacing['2xl'] - 4, marginBottom: spacing.md + 3 },
  recommendationRow: { paddingRight: spacing.screen },
});
