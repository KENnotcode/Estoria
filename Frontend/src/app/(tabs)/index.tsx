import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { AppState, Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppPressable } from '../../../components/AppPressable';
import { EmptyState } from '../../../components/EmptyState';
import { HeroCarousel } from '../../../components/HeroCarousel';
import { MovieCard } from '../../../components/MovieCard';
import { MovieSection } from '../../../components/MovieSection';
import { MovieRailSkeleton, Skeleton } from '../../../components/Skeleton';
import { SearchBar } from '../../../components/SearchBar';
import { NetworkStatusBanner } from '../../../components/NetworkStatusBanner';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { border, radius, spacing, surface, type } from '../../../constants/theme';
import { useColors } from '../../../hooks/useColors';
import { useCategoryMovies, usePopularMovies, useTopRatedMovies, useTrendingMovies, useUpcomingMovies } from '../../../hooks/useMovies';
import { isUpcomingRelease } from '../../../utils/format';
import { useAuth } from '../../../context/AuthContext';

const meridianImage = require('../../../assets/images/poster-meridian.jpg');

const CATEGORIES = [
  { label: 'Action', genre: 'Action' },
  { label: 'Drama', genre: 'Drama' },
  { label: 'Comedy / RomCom', genre: 'Comedy' },
  { label: 'Horror', genre: 'Horror' },
  { label: 'Anime', genre: 'Animation' },
];

const NOW = Date.now();

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 18) return 'Afternoon';
  return 'Evening';
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { account } = useAuth();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay);
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    const updateTimeOfDay = () => setTimeOfDay(getTimeOfDay());
    const interval = setInterval(updateTimeOfDay, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') updateTimeOfDay();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const displayName = account?.name || 'Estoria member';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const openMovie = (id: string, releaseDate?: string) => router.push({
    pathname: '/movie/[id]',
    params: { id, upcoming: releaseDate ? 'true' : undefined, releaseDate },
  });

  const formatEta = (releaseDate: string) => {
    if (!releaseDate) return undefined;
    const d = new Date(releaseDate);
    if (Number.isNaN(d.getTime())) return undefined;
    const days = Math.round((d.getTime() - NOW) / 86400000);
    if (days < 0) return undefined;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 30) return `In ${days}d`;
    return `In ${Math.round(days / 30)}mo`;
  };

  const { data: popular = [], isLoading: popularLoading, error: popularError, refetch: refetchPopular } = usePopularMovies();
  const { data: trending = [], isLoading: trendingLoading, error: trendingError, refetch: refetchTrending } = useTrendingMovies();
  const { data: topRated = [], isLoading: topRatedLoading, error: topRatedError, refetch: refetchTopRated } = useTopRatedMovies();
  const { data: upcoming = [], isLoading: upcomingLoading, error: upcomingError, refetch: refetchUpcoming } = useUpcomingMovies();

  const featuredMovie = popular[0];
  const latest = [...popular].sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0)).slice(0, 5);
  const trendingMovies = trending.filter((movie) => movie.id !== featuredMovie?.id).slice(0, 5);
  const topRatedMovies = topRated.filter((movie) => ![...popular, ...trending].some((m) => m.id === movie.id)).slice(0, 10);

  const carouselMovies = topRatedMovies.length > 0 ? topRatedMovies : popular.slice(0, 10);

  const upcomingMovies = upcoming
    .filter((movie) => isUpcomingRelease(movie.releaseDate, NOW))
    .sort((a, b) => (a.releaseDate < b.releaseDate ? -1 : a.releaseDate > b.releaseDate ? 1 : 0));

  const categoryResults = useCategoryMovies(CATEGORIES);
  const moviesByCategory = CATEGORIES.map((category, index) => ({
    label: category.label,
    genre: category.genre,
    movies: (categoryResults[index]?.data ?? []).slice(0, 6),
  }));

  const loading = popularLoading || trendingLoading || topRatedLoading || upcomingLoading;
  const error = popularError || trendingError || topRatedError || upcomingError;
  const { isOnline } = useNetworkStatus();

  if (loading) {
    const heroWidth = screenWidth - spacing.screen * 2;
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: 112 }}
      >
        <NetworkStatusBanner isOnline={isOnline} />
        <View style={styles.skeletonHeader}>
          <View style={styles.brandRow}>
            <Skeleton width={34} height={34} borderRadius={11} />
            <View style={styles.skeletonBrandCopy}>
              <Skeleton width={86} height={10} borderRadius={5} />
              <Skeleton width={64} height={16} borderRadius={6} />
            </View>
          </View>
          <Skeleton width={38} height={38} borderRadius={19} />
        </View>

        <View style={styles.content}>
          <Skeleton width="100%" height={52} borderRadius={radius.lg} />
          <Skeleton width={heroWidth} height={302} borderRadius={radius.xl} style={{ marginTop: 20 }} />
          <View style={styles.dotsRow}>
            <Skeleton width={24} height={6} borderRadius={3} />
            <Skeleton width={6} height={6} borderRadius={3} />
            <Skeleton width={6} height={6} borderRadius={3} />
          </View>
          <MovieRailSkeleton />
          <MovieRailSkeleton />
        </View>
      </ScrollView>
    );
  }

  if (error || carouselMovies.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <NetworkStatusBanner isOnline={isOnline} />
        <EmptyState
          title="Could not load movies"
          message="Check your internet connection and try again."
          actionLabel="Retry"
          onAction={() => {
            refetchPopular();
            refetchTrending();
            refetchTopRated();
            refetchUpcoming();
          }}
          icon="alert-triangle"
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <NetworkStatusBanner isOnline={isOnline} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: 112 }}>

        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              {account?.photoURL ? (
                <Image source={{ uri: account.photoURL }} style={styles.logoImage} />
              ) : (
                <Text style={styles.logoText}>{avatarInitial}</Text>
              )}
            </View>
            <View>
              <Text style={[styles.kicker, { color: colors.mutedForeground }]}>GOOD {timeOfDay.toUpperCase()}</Text>
              <Text style={[styles.brand, { color: colors.foreground }]}>{displayName}</Text>
            </View>
          </View>
          <AppPressable testID="home-profile" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} accentColor={colors.primary} style={[styles.avatar, { backgroundColor: surface.raised, borderColor: border.hairline, borderWidth: StyleSheet.hairlineWidth }]}>
            {account?.photoURL ? (
              <Image source={{ uri: account.photoURL }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.primary }]}>{avatarInitial}</Text>
            )}
          </AppPressable>
        </View>

        <View style={styles.content}>
          <SearchBar onPress={() => router.push('/search')} />

          <View>
            <HeroCarousel
              movies={carouselMovies}
              onSelect={(movie) => openMovie(movie.id)}
              onActiveIndexChange={setCarouselIndex}
            />
            <View style={styles.dotsRow}>
              {carouselMovies.map((_, i) => (
                <View key={i} style={[styles.dotIndicator, i === carouselIndex && { backgroundColor: colors.primary, width: 24 }]} />
              ))}
            </View>
          </View>

          <MovieSection title="Trending now" movies={trendingMovies} onSeeAll={() => router.push('/search')} />
          <MovieSection title="Latest releases" movies={latest} onSeeAll={() => router.push('/search')} />
          <MovieSection title="Top rated" movies={topRatedMovies} onSeeAll={() => router.push('/search')} />

          <View style={styles.browseHeader}>
            <Text style={[styles.browseTitle, { color: colors.foreground }]}>Browse movies by category</Text>
          </View>
          {moviesByCategory.map(({ label, genre, movies }) => (
            <MovieSection
              key={label}
              title={label}
              movies={movies}
              onSeeAll={() => router.push({ pathname: '/search', params: { genre } })}
            />
          ))}

          {upcomingMovies.length > 0 ? (
            <View style={styles.soonWrap}>
              <View style={[styles.soonHeader, { backgroundColor: colors.primary }]}>
                <Text style={styles.soonHeaderText}>Soon on Estoria</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent}>
                {upcomingMovies.slice(0, 10).map((movie) => (
                  <MovieCard key={movie.id} movie={movie} eta={formatEta(movie.releaseDate)} showRating={false} onPress={() => openMovie(movie.id, movie.releaseDate)} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={[styles.discoveryCard, { backgroundColor: colors.card }]}>
            <Image source={meridianImage} resizeMode="cover" style={styles.discoveryImage} />
            <View style={styles.discoveryCopy}>
              <Text style={[styles.kicker, { color: colors.primary }]}>WEEKLY DISCOVERY</Text>
              <Text style={[styles.discoveryTitle, { color: colors.foreground }]}>Stories worth staying up for.</Text>
              <AppPressable accessibilityLabel="Explore the collection" onPress={() => router.push('/search')} accentColor={colors.primary} style={styles.discoveryLinkHit}><Text style={[styles.discoveryLink, { color: colors.mutedForeground }]}>Explore the collection  →</Text></AppPressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: spacing.screen, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  content: { paddingHorizontal: spacing.screen },
  skeletonHeader: { paddingHorizontal: spacing.screen, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  skeletonBrandCopy: { gap: 6, marginLeft: spacing.sm + 2 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  logo: { width: 34, height: 34, borderRadius: radius.md - 1, alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: '100%', height: '100%', borderRadius: radius.md - 1 },
  logoText: { color: '#FFFFFF', fontSize: 18, fontFamily: type.hero.fontFamily },
  kicker: { ...type.kicker },
  brand: { fontSize: 21, lineHeight: 26, letterSpacing: -0.5, fontFamily: type.pageTitle.fontFamily },
  avatar: { width: 38, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: radius.pill },
  avatarText: { fontSize: 15, fontFamily: type.cardTitle.fontFamily },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.xs + 2, marginBottom: spacing.lg },
  dotIndicator: { height: 6, width: 6, borderRadius: 3, backgroundColor: '#3A3D45' },
  rowContent: { paddingRight: spacing.sm },
  browseHeader: { marginTop: spacing.section },
  browseTitle: { ...type.pageTitle },
  soonWrap: { marginTop: spacing.section },
  soonHeader: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, marginBottom: spacing.md + 2 },
  soonHeaderText: { color: '#FFFFFF', ...type.sectionTitle },
  discoveryCard: { marginTop: spacing.section, borderRadius: radius.lg + 2, overflow: 'hidden', flexDirection: 'row', minHeight: 132 },
  discoveryImage: { width: 102, height: 132 },
  discoveryCopy: { flex: 1, padding: spacing.lg - 1, justifyContent: 'center' },
  discoveryTitle: { ...type.sectionTitle, marginTop: spacing.sm - 1, marginBottom: spacing.sm + 4 },
  discoveryLink: { ...type.label },
  discoveryLinkHit: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
});
