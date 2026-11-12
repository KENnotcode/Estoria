import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo, useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AppPressable } from '@/components/AppPressable';
import { radius, spacing, surface, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useMovieVideos } from '@/hooks/useTrailerKey';
import type { MovieVideo } from '@/services/trailers';

type VideosRowProps = {
  movieId: string;
  onSelect: (video: MovieVideo) => void;
};

const CARD_WIDTH = 240;

const VideoCard = memo(function VideoCard({
  video,
  onSelect,
}: {
  video: MovieVideo;
  onSelect: (video: MovieVideo) => void;
}) {
  const colors = useColors();
  return (
    <AppPressable
      accessibilityLabel={`Play ${video.name}`}
      onPress={() => onSelect(video)}
      accentColor={colors.primary}
      showFocusRing={false}
      style={styles.card}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: `https://img.youtube.com/vi/${video.key}/hqdefault.jpg` }}
          contentFit="cover"
          style={styles.thumbnail}
        />
        <View style={[styles.playButton, { backgroundColor: colors.overlay }]}>
          <Feather name="play" size={18} color={colors.foreground} fill={colors.foreground} />
        </View>
      </View>
      <Text numberOfLines={2} style={[styles.name, { color: colors.foreground }]}>
        {video.name}
      </Text>
      <Text style={[styles.videoType, { color: colors.mutedForeground }]}>{video.type}</Text>
    </AppPressable>
  );
});

export function VideosRow({ movieId, onSelect }: VideosRowProps) {
  const colors = useColors();
  const { status, videos } = useMovieVideos(movieId, true);
  const handleSelect = useCallback((video: MovieVideo) => onSelect(video), [onSelect]);
  const renderItem = useCallback(
    ({ item }: { item: MovieVideo }) => <VideoCard video={item} onSelect={handleSelect} />,
    [handleSelect],
  );

  if (status === 'error' || (status === 'ready' && videos.length === 0)) return null;

  if (status === 'loading') {
    return (
      <View style={styles.section}>
        <Text style={[styles.heading, { color: colors.foreground }]}>Videos</Text>
        <View style={styles.skeletonRow}>
          {[0, 1].map((item) => <View key={item} style={[styles.skeleton, { backgroundColor: surface.sunken }]} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: colors.foreground }]}>Videos</Text>
      <FlatList
        data={videos}
        horizontal
        keyExtractor={(video) => video.key}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing['2xl'] - 4, marginHorizontal: -spacing.screen },
  heading: { ...type.sectionTitle, marginHorizontal: spacing.screen, marginBottom: spacing.md + 3 },
  listContent: { paddingHorizontal: spacing.screen },
  card: { width: CARD_WIDTH, marginRight: spacing.md },
  thumbnailContainer: { width: CARD_WIDTH, aspectRatio: 16 / 9, borderRadius: radius.md, overflow: 'hidden' },
  thumbnail: { width: '100%', height: '100%', backgroundColor: surface.sunken },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...type.cardTitle, marginTop: spacing.sm },
  videoType: { ...type.caption, marginTop: spacing.xs },
  skeletonRow: { flexDirection: 'row', paddingHorizontal: spacing.screen, gap: spacing.md },
  skeleton: { width: CARD_WIDTH, aspectRatio: 16 / 9, borderRadius: radius.md },
});
