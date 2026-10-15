import { memo, useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { poster, radius, surface, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type SkeletonProps = {
  width: number | `${number}%`;
  height: number;
  /** Corner radius; defaults to the small step. */
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A single loading block. A soft highlight sweeps across it so the shape reads
 * as "loading" instead of as a broken layout. The sweep is disabled under
 * reduced motion, leaving a static recessed fill.
 */
export const Skeleton = memo(function Skeleton({
  width,
  height,
  borderRadius = radius.sm,
  style,
}: SkeletonProps) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const [sweep] = useState(() => new Animated.Value(0));
  const numericWidth = typeof width === 'number' ? width : 160;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, sweep]);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-numericWidth, numericWidth],
  });

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[{ width, height, borderRadius, backgroundColor: surface.sunken, overflow: 'hidden' }, style]}
    >
      {reduceMotion ? null : (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { width: numericWidth * 2, transform: [{ translateX }] },
          ]}
        >
          <LinearGradient
            colors={['transparent', `${colors.foreground}12`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
});

type SkeletonTextProps = {
  /** Width of the line; a number of points or a percentage string. */
  width: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** A text-sized loading line, sized from the caption step of the type scale. */
export const SkeletonText = memo(function SkeletonText({
  width,
  height = type.caption.lineHeight,
  borderRadius = radius.sm / 2,
  style,
}: SkeletonTextProps) {
  return <Skeleton width={width} height={height} borderRadius={borderRadius} style={style} />;
});

type MovieCardSkeletonProps = {
  /** Matches `MovieCard`'s `width` prop so the placeholder is the real size. */
  width?: number;
};

/** Loading placeholder shaped exactly like a filled `MovieCard`. */
export const MovieCardSkeleton = memo(function MovieCardSkeleton({
  width = poster.rowWidth,
}: MovieCardSkeletonProps) {
  return (
    <View style={{ width, marginRight: poster.gridGutter }} accessibilityElementsHidden>
      <Skeleton
        width="100%"
        height={width / poster.aspectRatio}
        borderRadius={radius.md}
      />
      <SkeletonText width="80%" height={type.cardTitle.lineHeight} style={{ marginTop: 10 }} />
      <SkeletonText width="50%" height={type.caption.lineHeight} style={{ marginTop: 4 }} />
    </View>
  );
});

/** A horizontal rail of card placeholders, matching a `MovieSection` row. */
export const MovieRailSkeleton = memo(function MovieRailSkeleton({
  count = 4,
}: {
  count?: number;
}) {
  return (
    <View style={rail.row} accessibilityElementsHidden>
      {Array.from({ length: count }, (_, index) => (
        <MovieCardSkeleton key={index} />
      ))}
    </View>
  );
});

/** Poster-grid placeholders, matching the 2-column search and favorites grids. */
export const MovieGridSkeleton = memo(function MovieGridSkeleton({
  itemWidth,
  columns = 2,
  count = 6,
  gutter = poster.gridGutter,
}: {
  itemWidth: number;
  columns?: number;
  count?: number;
  gutter?: number;
}) {
  const rows = Math.ceil(count / columns);

  return (
    <View style={[grid.grid, { columnGap: gutter }]} accessibilityElementsHidden>
      {Array.from({ length: rows * columns }, (_, index) => (
        // Trailing cells are hidden so an incomplete row leaves no orphan block.
        <View
          key={index}
          style={index < count ? undefined : grid.hiddenCell}
        >
          {index < count ? <MovieCardSkeleton width={itemWidth} /> : null}
        </View>
      ))}
    </View>
  );
});

const rail = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginTop: 14,
  },
});

const grid = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  hiddenCell: {
    opacity: 0,
  },
});
