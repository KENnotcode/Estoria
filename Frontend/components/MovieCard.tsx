import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppPressable } from '@/components/AppPressable';
import { useFavorites } from '@/context/FavoritesContext';
import { border, poster, radius, surface, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import type { AppMovie } from '@/types/movie';

type MovieCardProps = {
  movie: AppMovie;
  onPress: () => void;
  /** Poster width in points; the aspect ratio keeps the height in sync. */
  width?: number;
  /** Badge text for unreleased titles, e.g. `In 3d`. */
  eta?: string;
  showRating?: boolean;
};

export function MovieCard({
  movie,
  onPress,
  width = poster.rowWidth,
  eta,
  showRating = true,
}: MovieCardProps) {
  const colors = useColors();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(movie.id);

  const handleFavoritePress = async () => {
    try {
      await toggleFavorite(movie.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save this movie.';
      Alert.alert('Unable to save', message);
    }
  };

  return (
    <View testID={`movie-card-${movie.id}`} style={[styles.card, { width }]}>
      <View style={styles.posterContainer}>
        <AppPressable
          accessibilityLabel={`Open ${movie.title}`}
          onPress={onPress}
          accentColor={colors.primary}
          showFocusRing={false}
          style={styles.poster}
          pressedStyle={styles.posterPressed}
        >
          <Image
            source={movie.poster}
            contentFit="cover"
            style={[styles.posterImage, { backgroundColor: surface.sunken }]}
          />
          {showRating ? (
            <View style={[styles.rating, { backgroundColor: colors.primary }]}>
              <Feather name="star" size={10} color={colors.primaryForeground} />
              <Text style={[styles.badgeText, styles.numeric, { color: colors.primaryForeground }]}>
                {movie.rating.toFixed(1)}
              </Text>
            </View>
          ) : null}
          {eta ? (
            <View style={[styles.eta, { backgroundColor: colors.scrim, borderColor: border.strong, borderWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.badgeText, { color: colors.foreground }]}>{eta}</Text>
            </View>
          ) : null}
        </AppPressable>

        <AppPressable
          testID={`favorite-${movie.id}`}
          accessibilityLabel={
            favorite ? `Remove ${movie.title} from favorites` : `Add ${movie.title} to favorites`
          }
          accessibilityState={{ selected: favorite }}
          onPress={handleFavoritePress}
          disabled={false}
          accentColor={colors.primary}
          showFocusRing={false}
          hitSlop={8}
          style={[styles.favorite, { backgroundColor: colors.scrim, borderColor: border.hairline, borderWidth: StyleSheet.hairlineWidth }]}
        >
          <Feather name="heart" size={14} color={favorite ? colors.primary : colors.foreground} />
        </AppPressable>
      </View>

      <AppPressable
        accessibilityLabel={`Open ${movie.title}`}
        onPress={onPress}
        accentColor={colors.primary}
        showFocusRing={false}
        style={styles.metaBlock}
      >
        <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>
          {movie.title}
        </Text>
        <Text numberOfLines={1} style={[styles.meta, { color: colors.mutedForeground }]}>
          {formatMovieMeta(movie)}
        </Text>
      </AppPressable>
    </View>
  );
}

function formatMovieMeta(movie: AppMovie): string {
  const year = movie.releaseYear ?? '—';
  return [year, movie.genres[0]].filter(Boolean).join('  ·  ');
}

const styles = StyleSheet.create({
  card: {
    marginRight: poster.gridGutter,
  },
  posterContainer: {
    position: 'relative',
  },
  poster: {
    borderRadius: radius.md,
    overflow: 'hidden',
    // Crisp edge so the poster reads as a cut-out, not a floating glow.
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: border.hairline,
  },
  posterPressed: {
    opacity: 0.8,
  },
  posterImage: {
    width: '100%',
    aspectRatio: poster.aspectRatio,
  },
  numeric: type.numeric,
  favorite: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rating: {
    position: 'absolute',
    left: 9,
    bottom: 9,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eta: {
    position: 'absolute',
    top: 9,
    left: 9,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  badgeText: {
    ...type.badge,
  },
  title: {
    ...type.cardTitle,
    marginTop: 10,
  },
  meta: {
    ...type.caption,
    ...type.numeric,
    marginTop: 4,
  },
  metaBlock: {
    // Keeps the whole label row inside the same press target.
    alignItems: 'flex-start',
  },
});
