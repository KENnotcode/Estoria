import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import type { ScrollView as ScrollViewType } from 'react-native';
import { ActivityIndicator, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../../components/EmptyState';
import { MovieCard } from '../../../components/MovieCard';
import { SearchBar } from '../../../components/SearchBar';
import { SectionHeader } from '../../../components/SectionHeader';
import { useColors } from '../../../hooks/useColors';
import { usePopularMovies, useTopRatedMovies, useTrendingMovies } from '../../../hooks/useMovies';

const meridianImage = require('../../../assets/images/poster-meridian.jpg');

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const carouselRef = useRef<ScrollViewType>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const openMovie = (id: string) => router.push({ pathname: '/movie/[id]', params: { id } });

  const { data: popular = [], isLoading: popularLoading, error: popularError, refetch: refetchPopular } = usePopularMovies();
  const { data: trending = [], isLoading: trendingLoading, error: trendingError, refetch: refetchTrending } = useTrendingMovies();
  const { data: topRated = [], isLoading: topRatedLoading, error: topRatedError, refetch: refetchTopRated } = useTopRatedMovies();

  const featuredMovie = popular[0];
  const latest = [...popular].sort((a, b) => b.releaseYear - a.releaseYear).slice(0, 5);
  const trendingMovies = trending.filter((movie) => movie.id !== featuredMovie?.id).slice(0, 5);
  const topRatedMovies = topRated.filter((movie) => ![...popular, ...trending].some((m) => m.id === movie.id)).slice(0, 10);

  const carouselMovies = topRatedMovies.length > 0 ? topRatedMovies : popular.slice(0, 10);

  const loading = popularLoading || trendingLoading || topRatedLoading;
  const error = popularError || trendingError || topRatedError;

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || carouselMovies.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Could not load movies"
          message="Check your internet connection and try again."
          actionLabel="Retry"
          onAction={() => { refetchPopular(); refetchTrending(); refetchTopRated(); }}
          icon="alert-triangle"
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 112 }}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}><Text style={styles.logoText}>K</Text></View>
            <View><Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>GOOD EVENING</Text><Text style={[styles.brand, { color: colors.foreground }]}>Kenneth</Text></View>
          </View>
          <Pressable testID="home-profile" accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={[styles.avatar, { backgroundColor: colors.card }]}><Text style={[styles.avatarText, { color: colors.primary }]}>K</Text></Pressable>
        </View>
        <View style={styles.content}>
          <SearchBar onPress={() => router.push('/search')} />
          <View style={styles.hero}>
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 40));
                setCarouselIndex(index);
              }}
            >
              {carouselMovies.map((movie) => (
                <ImageBackground key={movie.id} source={movie.backdrop} resizeMode="cover" style={[styles.heroImage, { width: screenWidth - 40 }]} imageStyle={styles.heroImageRadius} />
              ))}
            </ScrollView>
            <LinearGradient colors={['transparent', 'rgba(12,13,16,0.4)', 'rgba(12,13,16,0.75)']} locations={[0, 0.55, 1]} style={styles.heroGradient}>
              <View style={[styles.heroBadge, { backgroundColor: colors.primary, position: 'absolute', bottom: 115, left: 8 }]}><Text style={styles.heroBadgeText}>FEATURED MOVIES</Text></View>
              <Text numberOfLines={1} style={[styles.heroTitle, { color: colors.foreground, position: 'absolute', bottom: 72, left: 12 }]}>{carouselMovies[carouselIndex]?.title}</Text>
              <View style={[styles.heroMeta, { position: 'absolute', bottom: 55, left: 12 }]}><Text style={[styles.metaText, { color: colors.foreground }]}>{carouselMovies[carouselIndex]?.releaseYear}</Text><Text style={[styles.dot, { color: colors.mutedForeground }]}>•</Text><Text style={[styles.metaText, { color: colors.foreground }]}>{carouselMovies[carouselIndex]?.genres[0]}</Text><View style={styles.star}><Feather name="star" size={12} color={colors.primary} /><Text style={[styles.metaText, { color: colors.foreground }]}>{carouselMovies[carouselIndex]?.rating.toFixed(1)}</Text></View></View>
              <Pressable onPress={() => openMovie(carouselMovies[carouselIndex]?.id)} style={[styles.detailsButton, { backgroundColor: colors.foreground, position: 'absolute', bottom: 10, left: 12 }]}><Text style={[styles.detailsButtonText, { color: colors.background }]}>View details</Text><Feather name="arrow-up-right" size={15} color={colors.background} /></Pressable>
            </LinearGradient>
            <Pressable onPress={() => setCarouselIndex((prev) => { const n = carouselMovies.length; const next = (prev - 1 + n) % n; const isWrap = next > prev; (carouselRef.current as any)?.scrollTo?.({ x: next * (screenWidth - 40), animated: !isWrap }); return next; })} style={[styles.carouselArrow, { left: 4 }]} hitSlop={{ top: 12, bottom: 12, left: 20, right: 5 }}><Feather name="chevron-left" size={22} color={colors.primary} /></Pressable>
            <Pressable onPress={() => setCarouselIndex((prev) => { const n = carouselMovies.length; const next = (prev + 1) % n; const isWrap = next < prev; (carouselRef.current as any)?.scrollTo?.({ x: next * (screenWidth - 40), animated: !isWrap }); return next; })} style={[styles.carouselArrow, { right: 4 }]} hitSlop={{ top: 12, bottom: 12, left: 5, right: 20 }}><Feather name="chevron-right" size={22} color={colors.primary} /></Pressable>
          </View>
          <View style={styles.dotsRow}>
            {carouselMovies.map((_, i) => (
              <View key={i} style={[styles.dotIndicator, i === carouselIndex && { backgroundColor: colors.primary, width: 24 }]} />
            ))}
          </View>
          <SectionHeader title="Trending now" onPress={() => router.push('/search')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent}>
            {trendingMovies.map((movie) => <MovieCard key={movie.id} movie={movie} onPress={() => openMovie(movie.id)} />)}
          </ScrollView>
          <View style={styles.sectionSpacing}><SectionHeader title="Latest releases" onPress={() => router.push('/search')} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent}>
            {latest.map((movie) => <MovieCard key={movie.id} movie={movie} onPress={() => openMovie(movie.id)} />)}
          </ScrollView>
          <View style={styles.sectionSpacing}><SectionHeader title="Top rated" onPress={() => router.push('/search')} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent}>
            {topRatedMovies.map((movie) => <MovieCard key={movie.id} movie={movie} onPress={() => openMovie(movie.id)} />)}
          </ScrollView>
          <View style={styles.discoveryCard}>
            <Image source={meridianImage} resizeMode="cover" style={styles.discoveryImage} />
            <View style={styles.discoveryCopy}><Text style={[styles.eyebrow, { color: colors.primary }]}>WEEKLY DISCOVERY</Text><Text style={[styles.discoveryTitle, { color: colors.foreground }]}>Stories worth staying up for.</Text><Pressable onPress={() => router.push('/search')}><Text style={[styles.discoveryLink, { color: colors.mutedForeground }]}>Explore the collection  →</Text></Pressable></View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  content: { paddingHorizontal: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Inter_700Bold' },
  eyebrow: { fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_700Bold' },
  brand: { fontSize: 21, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, marginTop: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  hero: { marginTop: 20, marginBottom: 14, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  heroImage: { height: 302, justifyContent: 'flex-end' },
  heroImageRadius: { borderRadius: 20 },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, marginBottom: 10 },
  heroBadgeText: { color: '#FFFFFF', fontSize: 9, letterSpacing: 1.1, fontFamily: 'Inter_700Bold' },
  heroTitle: { fontSize: 29, letterSpacing: -0.8, fontFamily: 'Inter_700Bold' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  metaText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  dot: { fontSize: 12 },
  star: { flexDirection: 'row', gap: 4, alignItems: 'center', marginLeft: 2 },
  detailsButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10, marginTop: 16 },
  detailsButtonText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 4, marginBottom: 22 },
  dotIndicator: { height: 6, width: 6, borderRadius: 3, backgroundColor: '#3A3D45' },
  carouselArrow: { position: 'absolute', top: '50%', marginTop: -16, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(12,13,16,0.6)', zIndex: 10 },
  rowContent: { paddingRight: 8 },
  sectionSpacing: { marginTop: 28 },
  discoveryCard: { marginTop: 32, borderRadius: 18, backgroundColor: '#17191F', overflow: 'hidden', flexDirection: 'row', minHeight: 132 },
  discoveryImage: { width: 102, height: 132 },
  discoveryCopy: { flex: 1, padding: 17, justifyContent: 'center' },
  discoveryTitle: { fontSize: 17, lineHeight: 22, fontFamily: 'Inter_700Bold', marginTop: 7, marginBottom: 12 },
  discoveryLink: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});