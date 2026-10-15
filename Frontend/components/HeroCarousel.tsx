import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useRef, useState } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ScrollView as ScrollViewType,
} from 'react-native';
import { AppPressable } from '@/components/AppPressable';
import { radius, spacing, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import type { AppMovie } from '@/types/movie';

type HeroCarouselProps = {
  movies: AppMovie[];
  onSelect: (movie: AppMovie) => void;
  /** Notified with the real (non-cloned) active index, e.g. to drive dots. */
  onActiveIndexChange?: (index: number) => void;
};

/**
 * Paged hero carousel. The first and last slides are cloned so the wrap-around
 * transition stays seamless, and the visible index is tracked separately from
 * the raw scroll offset.
 */
export function HeroCarousel({ movies, onSelect, onActiveIndexChange }: HeroCarouselProps) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const carouselRef = useRef<ScrollViewType>(null);
  const hasScrolledToStart = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const itemWidth = screenWidth - spacing.screen * 2;
  const canLoop = movies.length > 1;
  const slides = canLoop
    ? [movies[movies.length - 1], ...movies, movies[0]]
    : movies;
  const activeMovie = movies[activeIndex];

  /** Updates the active index and emits it to any listener (dots). */
  const updateActive = useCallback(
    (index: number) => {
      setActiveIndex(index);
      onActiveIndexChange?.(index);
    },
    [onActiveIndexChange],
  );

  const scrollTo = useCallback(
    (index: number, animated: boolean) => {
      carouselRef.current?.scrollTo({ x: index * itemWidth, animated });
    },
    [itemWidth],
  );

  /** Converts a raw page index into the index of the movie it represents. */
  const settleOnPage = useCallback(
    (page: number) => {
      if (!canLoop) {
        updateActive(page);
        return;
      }

      if (page === 0) {
        updateActive(movies.length - 1);
      } else if (page === movies.length + 1) {
        updateActive(0);
      } else {
        updateActive(page - 1);
      }
    },
    [canLoop, movies.length, updateActive],
  );

  const handleMomentumEnd = useCallback(
    (offsetX: number) => {
      const page = Math.round(offsetX / itemWidth);

      // Land on a cloned slide: jump to its real counterpart so looping continues.
      if (canLoop && page === 0) {
        scrollTo(movies.length, false);
      } else if (canLoop && page === movies.length + 1) {
        scrollTo(1, false);
      }

      settleOnPage(page);
    },
    [canLoop, itemWidth, movies.length, scrollTo, settleOnPage],
  );

  const handleLayout = useCallback(() => {
    if (!hasScrolledToStart.current && canLoop) {
      scrollTo(1, false);
      hasScrolledToStart.current = true;
    }
  }, [canLoop, scrollTo]);

  return (
    <View style={styles.hero}>
      <ScrollView
        ref={carouselRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={handleLayout}
        onMomentumScrollEnd={(event) =>
          handleMomentumEnd(event.nativeEvent.contentOffset.x)
        }
      >
        {slides.map((movie, index) => (
          <ImageBackground
            key={`${movie.id}-${index}`}
            source={movie.backdrop}
            resizeMode="cover"
            imageStyle={styles.image}
            style={[styles.slide, { width: itemWidth }]}
          />
        ))}
      </ScrollView>

      <LinearGradient
        colors={['transparent', 'rgba(12, 13, 16, 0.4)', 'rgba(12, 13, 16, 0.82)']}
        locations={[0, 0.55, 1]}
        style={styles.gradient}
      >
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeLabel}>FEATURED</Text>
        </View>
        <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>
          {activeMovie?.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, styles.numeric, { color: colors.foreground }]}>{activeMovie?.releaseYear}</Text>
          <Text style={[styles.dot, { color: colors.mutedForeground }]}>·</Text>
          <Text style={[styles.meta, { color: colors.foreground }]}>{activeMovie?.genres[0]}</Text>
          <View style={styles.rating}>
            <Feather name="star" size={12} color={colors.primary} />
            <Text style={[styles.meta, styles.numeric, { color: colors.foreground }]}>
              {activeMovie?.rating.toFixed(1)}
            </Text>
          </View>
        </View>
        <AppPressable
          accessibilityLabel={`View details for ${activeMovie?.title ?? 'this movie'}`}
          onPress={() => {
            if (activeMovie) {
              onSelect(activeMovie);
            }
          }}
          accentColor={colors.primary}
          style={[styles.detailsButton, { backgroundColor: colors.foreground }]}
          pressedStyle={styles.detailsPressed}
        >
          <Text style={[styles.detailsLabel, { color: colors.background }]}>View details</Text>
          <Feather name="arrow-up-right" size={15} color={colors.background} />
        </AppPressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 20,
    marginBottom: 14,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  slide: {
    height: 302,
  },
  image: {
    borderRadius: radius.xl,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  badge: {
    position: 'absolute',
    bottom: 115,
    left: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  badgeLabel: {
    color: '#FFFFFF',
    ...type.badge,
  },
  title: {
    ...type.hero,
    left: spacing.screen - 8,
    right: spacing.screen - 8,
    position: 'absolute',
    bottom: 72,
  },
  metaRow: {
    position: 'absolute',
    bottom: 55,
    left: spacing.screen - 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meta: {
    ...type.meta,
  },
  numeric: type.numeric,
  dot: {
    ...type.meta,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 2,
  },
  detailsButton: {
    position: 'absolute',
    bottom: 10,
    left: spacing.screen - 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 1,
    borderRadius: radius.md,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  detailsPressed: {
    opacity: 0.85,
  },
  detailsLabel: {
    ...type.button,
  },
});
