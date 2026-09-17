import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFavorites } from '../context/FavoritesContext';
import { useColors } from '../hooks/useColors';
import type { AppMovie } from '../types/movie';

type MovieCardProps = {
  movie: AppMovie;
  onPress: () => void;
  width?: number;
};

export function MovieCard({ movie, onPress, width = 134 }: MovieCardProps) {
  const colors = useColors();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(movie.id);

  return (
    <View testID={`movie-card-${movie.id}`} style={[styles.card, { width }]}>
      <View style={styles.posterContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${movie.title}`}
          onPress={onPress}
          style={({ pressed }) => [styles.posterButton, { opacity: pressed ? 0.78 : 1 }]}
        >
          <View style={styles.posterWrap}>
            <Image source={movie.poster} contentFit="cover" style={styles.poster} />
            <View style={[styles.rating, { backgroundColor: colors.primary }]}>
              <Feather name="star" size={10} color={colors.primaryForeground} />
              <Text style={[styles.ratingText, { color: colors.primaryForeground }]}>{movie.rating.toFixed(1)}</Text>
            </View>
          </View>
        </Pressable>
        <Pressable
          testID={`favorite-${movie.id}`}
          accessibilityRole="button"
          accessibilityLabel={favorite ? `Remove ${movie.title} from favorites` : `Add ${movie.title} to favorites`}
          onPress={() => toggleFavorite(movie.id)}
          hitSlop={8}
          style={[styles.favorite, { backgroundColor: 'rgba(12,13,16,0.78)' }]}
        >
          <Feather name="heart" size={14} color={favorite ? colors.primary : colors.text} />
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${movie.title}`} onPress={onPress}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>
          {movie.title}
        </Text>
        <Text numberOfLines={1} style={[styles.meta, { color: colors.mutedForeground }]}>
          {movie.releaseYear}  ·  {movie.genres[0]}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: 14 },
  posterContainer: { position: 'relative' },
  posterButton: { borderRadius: 14, overflow: 'hidden' },
  posterWrap: { aspectRatio: 0.69, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  poster: { width: '100%', height: '100%', backgroundColor: '#1C1F26' },
  favorite: { position: 'absolute', top: 9, right: 9, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rating: { position: 'absolute', left: 9, bottom: 9, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 10 },
  meta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
});