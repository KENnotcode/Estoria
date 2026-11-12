import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import {
  Animated,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import YoutubePlayer, { type YoutubeIframeRef } from 'react-native-youtube-iframe';
import { AppPressable } from '@/components/AppPressable';
import { Skeleton } from '@/components/Skeleton';
import { border, radius, spacing, surface, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useTrailerKey } from '@/hooks/useTrailerKey';

const VIDEO_PLAYER_PARAMS = {
  controls: false,
  modestbranding: true,
  rel: false,
  iv_load_policy: 3,
  preventFullScreen: true,
};
const MIN_PLAYER_WIDTH = 200 * (16 / 9);

type TrailerModalProps = {
  movieId: string;
  visible: boolean;
  onClose: () => void;
  videoKey?: string;
  videoName?: string;
  movieTitle?: string;
  releaseYear?: number | null;
  runtime?: number | null;
  genre?: string;
};

export function TrailerModal(props: TrailerModalProps) {
  if (!props.visible) return null;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
      statusBarTranslucent
      navigationBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={props.onClose}
    >
      <SafeAreaProvider style={styles.modalRoot}>
        <TrailerModalContent {...props} />
      </SafeAreaProvider>
    </Modal>
  );
}

function TrailerModalContent({
  movieId,
  onClose,
  videoKey,
  videoName,
  movieTitle,
  releaseYear,
  runtime,
  genre,
}: TrailerModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { status, key: trailerKey } = useTrailerKey(movieId, !videoKey);
  const [playerErrorKey, setPlayerErrorKey] = useState<string | null>(null);
  const [play, setPlay] = useState(false);
  const [translateY] = useState(() => new Animated.Value(0));
  const [landscapeStageSize, setLandscapeStageSize] = useState({ width: 0, height: 0 });
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [progressWidth, setProgressWidth] = useState(1);
  const playerRef = useRef<YoutubeIframeRef | null>(null);
  const key = videoKey ?? trailerKey;
  const playerError = key !== null && playerErrorKey === key;
  const safeWidth = Math.max(0, width - insets.left - insets.right);
  const safeHeight = Math.max(0, height);
  const ratio = 16 / 9;
  const stageWidth = landscapeStageSize.width || safeWidth;
  const stageHeight = landscapeStageSize.height || safeHeight;
  const idealPlayerWidth = Math.min(stageWidth, stageHeight * ratio);
  const maxPlayerWidth = Math.min(idealPlayerWidth, stageWidth, stageHeight * ratio);
  const playerWidth = Math.max(MIN_PLAYER_WIDTH, Math.min(maxPlayerWidth, stageWidth - 168));
  const playerHeight = playerWidth * 9 / 16;
  const portraitPlayerHeight = width / ratio;
  const loading = !videoKey && status === 'loading';
  const noTrailer = !loading && !key;
  const movieInfo = [releaseYear, runtime ? `${Math.floor(runtime / 60)}h ${runtime % 60}m` : null, genre]
    .filter(Boolean)
    .join('  ·  ');
  const title = movieTitle ?? videoName ?? 'Trailer';

  const lockOrientation = useCallback(
    (orientation: ScreenOrientation.OrientationLock) => {
      void ScreenOrientation.lockAsync(orientation).catch((error: unknown) => {
        console.warn('[TrailerModal] Could not change screen orientation.', error);
      });
    },
    [],
  );

  const handlePlayerError = useCallback(() => {
    if (key) setPlayerErrorKey(key);
    lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, [key, lockOrientation]);

  const updateProgress = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;

    const [current, duration] = await Promise.all([
      player.getCurrentTime(),
      player.getDuration(),
    ]);
    setProgress({ current, duration });
  }, []);

  useEffect(() => {
    if (!play || !key || playerError) return undefined;
    void updateProgress();
    const interval = setInterval(() => {
      void updateProgress();
    }, 500);
    return () => clearInterval(interval);
  }, [key, play, playerError, updateProgress]);

  useEffect(() => {
    lockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, [lockOrientation]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 80 || gesture.vy > 1.2) {
          onClose();
          return;
        }
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
    [onClose, translateY],
  );

  const openOnYouTube = useCallback(() => {
    if (key) void Linking.openURL(`https://www.youtube.com/watch?v=${key}`);
  }, [key]);

  const handleSeek = useCallback(
    (event: GestureResponderEvent) => {
      if (!progress.duration) return;
      const nextTime = Math.max(0, Math.min(1, event.nativeEvent.locationX / progressWidth)) * progress.duration;
      playerRef.current?.seekTo(nextTime, true);
      setProgress((current) => ({ ...current, current: nextTime }));
    },
    [progress.duration, progressWidth],
  );

  const progressRatio = progress.duration > 0
    ? Math.min(1, Math.max(0, progress.current / progress.duration))
    : 0;

  const player = (heightValue: number, widthValue: number | `${number}%`) => (
    <YoutubePlayer
      ref={playerRef}
      height={heightValue}
      width={widthValue}
      play={play}
      videoId={key ?? ''}
      onReady={() => setPlay(true)}
      onError={handlePlayerError}
      initialPlayerParams={VIDEO_PLAYER_PARAMS}
      webViewProps={{ allowsInlineMediaPlayback: true, mediaPlaybackRequiresUserAction: false }}
    />
  );

  return (
    <>
      <StatusBar hidden={isLandscape} />
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close video" />
        {isLandscape ? (
          <View
            style={[
              styles.landscapeRoot,
              {
                paddingRight: insets.right,
                paddingLeft: insets.left,
              },
            ]}
          >
            <View
              onLayout={({ nativeEvent }) => {
                const { width: measuredWidth, height: measuredHeight } = nativeEvent.layout;
                if (measuredWidth !== landscapeStageSize.width || measuredHeight !== landscapeStageSize.height) {
                  setLandscapeStageSize({ width: measuredWidth, height: measuredHeight });
                }
              }}
              style={[styles.landscapeStage, { width: safeWidth, height: safeHeight }]}
            >
              {playerError ? (
                <View style={styles.landscapeFallback}>
                  <Text style={[styles.message, { color: colors.mutedForeground }]}>This video cannot be embedded.</Text>
                  <AppPressable onPress={openOnYouTube} accessibilityLabel="Watch on YouTube" accentColor={colors.primary} style={[styles.youtubeButton, { borderColor: border.hairline }]}>
                    <Text style={[styles.buttonText, { color: colors.foreground }]}>Watch on YouTube</Text>
                  </AppPressable>
                </View>
              ) : (
                <View style={[styles.landscapePlayer, { width: playerWidth, height: playerHeight }]}>
                  {loading ? <Skeleton width={playerWidth} height={playerHeight} borderRadius={0} /> : null}
                  {noTrailer ? <Text style={[styles.message, { color: colors.mutedForeground }]}>No trailer is available for this movie.</Text> : null}
                  {key ? player(playerHeight, playerWidth) : null}
                </View>
              )}
              {!playerError && key ? (
                <VideoControls
                  landscape
                  playing={play}
                  progress={progressRatio}
                  onToggle={() => setPlay((current) => !current)}
                  onSeek={handleSeek}
                  onTrackLayout={setProgressWidth}
                />
              ) : null}
              <Pressable
                accessibilityLabel="Close video"
                onPress={onClose}
                style={[
                  styles.landscapeClose,
                  { top: insets.top + 8, right: 6 },
                ]}
              >
                <Feather name="x" size={21} color={colors.foreground} />
              </Pressable>
            </View>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: surface.card,
                borderColor: border.hairline,
                paddingBottom: Math.max(insets.bottom, spacing.lg),
                transform: [{ translateY }],
              },
            ]}
          >
            <View {...panResponder.panHandlers} style={styles.grabberHitArea}>
              <View style={[styles.grabber, { backgroundColor: colors.mutedForeground }]} />
            </View>
            <View style={styles.header}>
              <Text style={[styles.headerLabel, { color: colors.foreground }]}>Trailer</Text>
              <AppPressable accessibilityLabel="Close video" onPress={onClose} accentColor={colors.primary} style={styles.close}>
                <Feather name="x" size={21} color={colors.foreground} />
              </AppPressable>
            </View>
            <View style={styles.player}>
              {loading ? <Skeleton width="100%" height={portraitPlayerHeight} borderRadius={0} /> : null}
              {noTrailer ? <Text style={[styles.message, { color: colors.mutedForeground }]}>No trailer is available for this movie.</Text> : null}
              {key ? player(portraitPlayerHeight, '100%') : null}
            </View>
            {!playerError && key ? (
              <VideoControls
                playing={play}
                progress={progressRatio}
                onToggle={() => setPlay((current) => !current)}
                onSeek={handleSeek}
                onTrackLayout={setProgressWidth}
              />
            ) : null}
            <View style={styles.info}>
              <Text numberOfLines={2} style={[styles.title, { color: colors.foreground }]}>{title}</Text>
              {movieInfo ? <Text style={[styles.meta, { color: colors.mutedForeground }]}>{movieInfo}</Text> : null}
              {!playerError && key ? (
                <AppPressable onPress={openOnYouTube} accessibilityLabel="Watch on YouTube" accentColor={colors.primary} style={[styles.youtubeButton, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Watch on YouTube</Text>
                </AppPressable>
              ) : null}
            </View>
            {playerError ? (
              <View style={styles.fallback}>
                <Text style={[styles.message, { color: colors.mutedForeground }]}>This video cannot be embedded.</Text>
                <AppPressable onPress={openOnYouTube} accessibilityLabel="Watch on YouTube" accentColor={colors.primary} style={[styles.youtubeButton, { borderColor: border.hairline }]}>
                  <Text style={[styles.buttonText, { color: colors.foreground }]}>Watch on YouTube</Text>
                </AppPressable>
              </View>
            ) : null}
          </Animated.View>
        )}
      </View>
    </>
  );
}

type VideoControlsProps = {
  landscape?: boolean;
  playing: boolean;
  progress: number;
  onToggle: () => void;
  onSeek: (event: GestureResponderEvent) => void;
  onTrackLayout: (width: number) => void;
};

function VideoControls({
  landscape = false,
  playing,
  progress,
  onToggle,
  onSeek,
  onTrackLayout,
}: VideoControlsProps) {
  const colors = useColors();

  return (
    <View style={[styles.controls, landscape ? styles.landscapeControls : null]}>
      <AppPressable
        accessibilityLabel={playing ? 'Pause video' : 'Play video'}
        onPress={onToggle}
        accentColor={colors.primary}
        showFocusRing={false}
        style={styles.playButton}
      >
        <Feather name={playing ? 'pause' : 'play'} size={16} color={colors.foreground} fill={colors.foreground} />
      </AppPressable>
      <Pressable
        accessibilityLabel="Seek video"
        accessibilityRole="adjustable"
        onLayout={({ nativeEvent }) => onTrackLayout(nativeEvent.layout.width)}
        onPress={onSeek}
        style={styles.progressTrack}
      >
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, backgroundColor: '#000' },
  landscapeRoot: { flex: 1, backgroundColor: '#000' },
  landscapeStage: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  landscapePlayer: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  landscapeClose: { position: 'absolute', top: 8, right: 6, width: 36, height: 36, borderRadius: radius.pill, backgroundColor: surface.raised, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  landscapeControls: { position: 'absolute', top: '50%', right: 6, width: 72, paddingHorizontal: 0, paddingTop: 0, flexDirection: 'column', gap: spacing.sm, transform: [{ translateY: -30 }] },
  playButton: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: surface.raised, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { width: '100%', height: 4, borderRadius: radius.pill, backgroundColor: border.subtle, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill },
  sheet: { width: '100%', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  grabberHitArea: { height: 24, alignItems: 'center', justifyContent: 'center' },
  grabber: { width: 38, height: 4, borderRadius: radius.pill, opacity: 0.65 },
  header: { paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerLabel: { ...type.sectionTitle },
  close: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: surface.raised, alignItems: 'center', justifyContent: 'center' },
  player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: surface.sunken, justifyContent: 'center' },
  info: { padding: spacing.lg, paddingBottom: 0 },
  title: { ...type.sectionTitle },
  meta: { ...type.meta, marginTop: spacing.xs },
  message: { ...type.body, textAlign: 'center', paddingVertical: spacing.xl },
  fallback: { alignItems: 'center', paddingHorizontal: spacing.lg },
  landscapeFallback: { alignItems: 'center' },
  youtubeButton: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginTop: spacing.md, borderWidth: 1, borderRadius: radius.md },
  buttonText: { ...type.button },
});
