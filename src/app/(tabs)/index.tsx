import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../../components/EmptyState';
import { MovieCard } from '../../../components/MovieCard';
import { SearchBar } from '../../../components/SearchBar';
import { SectionHeader } from '../../../components/SectionHeader';
import { useColors } from '../../../hooks/useColors';
import { usePopularMovies, useTrendingMovies } from '../../../hooks/useMovies';

const meridianImage = require('../../../assets/images/poster-meridian.jpg');

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openMovie = (id: string) => router.push({ pathname: '/movie/[id]', params: { id } });

  const { data: popular = [], isLoading: popularLoading, error: popularError, refetch: refetchPopular } = usePopularMovies();
  const { data: trending = [], isLoading: trendingLoading, error: trendingError, refetch: refetchTrending } = useTrendingMovies();

  const featuredMovie = popular[0];
  const latest = [...popular].sort((a, b) => b.releaseYear - a.releaseYear).slice(0, 5);
  const trendingMovies = trending.filter((movie) => movie.id !== featuredMovie?.id).slice(0, 5);

  const loading = popularLoading || trendingLoading;
  const error = popularError || trendingError;

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !featuredMovie) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Could not load movies"
          message="Check your internet connection and try again."
          actionLabel="Retry"
          onAction={() => { refetchPopular(); refetchTrending(); }}
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
          <Pressable testID="featured-movie" accessibilityRole="button" accessibilityLabel={`Open featured movie ${featuredMovie.title}`} onPress={() => openMovie(featuredMovie.id)} style={styles.hero}>
            <ImageBackground source={featuredMovie.backdrop} resizeMode="cover" style={styles.heroImage} imageStyle={styles.heroImageRadius}>
              <LinearGradient colors={['transparent', 'rgba(12,13,16,0.22)', colors.background]} locations={[0, 0.48, 1]} style={styles.heroGradient}>
                <View style={[styles.heroBadge, { backgroundColor: colors.primary }]}><Text style={styles.heroBadgeText}>FEATURED TONIGHT</Text></View>
                <Text style={[styles.heroTitle, { color: colors.foreground }]}>{featuredMovie.title}</Text>
                <View style={styles.heroMeta}><Text style={[styles.metaText, { color: colors.foreground }]}>{featuredMovie.releaseYear}</Text><Text style={[styles.dot, { color: colors.mutedForeground }]}>•</Text><Text style={[styles.metaText, { color: colors.foreground }]}>{featuredMovie.genres[0]}</Text><View style={styles.star}><Feather name="star" size={12} color={colors.primary} /><Text style={[styles.metaText, { color: colors.foreground }]}>{featuredMovie.rating}</Text></View></View>
                <View style={[styles.detailsButton, { backgroundColor: colors.foreground }]}><Text style={[styles.detailsButtonText, { color: colors.background }]}>View details</Text><Feather name="arrow-up-right" size={15} color={colors.background} /></View>
              </LinearGradient>
            </ImageBackground>
          </Pressable>
          <SectionHeader title="Trending now" onPress={() => router.push('/search')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent}>
            {trendingMovies.map((movie) => <MovieCard key={movie.id} movie={movie} onPress={() => openMovie(movie.id)} />)}
          </ScrollView>
          <View style={styles.sectionSpacing}><SectionHeader title="Latest releases" onPress={() => router.push('/search')} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent}>
            {latest.map((movie) => <MovieCard key={movie.id} movie={movie} onPress={() => openMovie(movie.id)} />)}
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
  hero: { marginTop: 20, marginBottom: 27, borderRadius: 20, overflow: 'hidden' },
  heroImage: { height: 302, justifyContent: 'flex-end' },
  heroImageRadius: { borderRadius: 20 },
  heroGradient: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  heroBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, marginBottom: 10 },
  heroBadgeText: { color: '#FFFFFF', fontSize: 9, letterSpacing: 1.1, fontFamily: 'Inter_700Bold' },
  heroTitle: { fontSize: 29, letterSpacing: -0.8, fontFamily: 'Inter_700Bold' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  metaText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  dot: { fontSize: 12 },
  star: { flexDirection: 'row', gap: 4, alignItems: 'center', marginLeft: 2 },
  detailsButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10, marginTop: 16 },
  detailsButtonText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  rowContent: { paddingRight: 8 },
  sectionSpacing: { marginTop: 28 },
  discoveryCard: { marginTop: 32, borderRadius: 18, backgroundColor: '#17191F', overflow: 'hidden', flexDirection: 'row', minHeight: 132 },
  discoveryImage: { width: 102, height: 132 },
  discoveryCopy: { flex: 1, padding: 17, justifyContent: 'center' },
  discoveryTitle: { fontSize: 17, lineHeight: 22, fontFamily: 'Inter_700Bold', marginTop: 7, marginBottom: 12 },
  discoveryLink: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
