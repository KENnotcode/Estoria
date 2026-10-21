import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { AppPressable } from '@/components/AppPressable';
import { spacing, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

type DiscoveryCardProps = {
  /** Image source for the card artwork. */
  posterImage: number;
  /** Navigates to the search/explore screen. */
  onPress: () => void;
};

/**
 * Weekly discovery promo card: artwork on the left, copy and CTA on the right.
 */
export function DiscoveryCard({ posterImage, onPress }: DiscoveryCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Image source={posterImage} contentFit="cover" style={styles.image} />
      <View style={styles.copy}>
        <Text style={[styles.kicker, { color: colors.primary }]}>WEEKLY DISCOVERY</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Stories worth staying up for.</Text>
        <AppPressable
          accessibilityLabel="Explore the collection"
          onPress={onPress}
          accentColor={colors.primary}
          style={styles.linkHit}
        >
          <Text style={[styles.link, { color: colors.mutedForeground }]}>Explore the collection  →</Text>
        </AppPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 132,
  },
  image: {
    width: 102,
    height: 132,
  },
  copy: {
    flex: 1,
    padding: spacing.lg - 1,
    justifyContent: 'center',
  },
  kicker: { ...type.kicker },
  title: { ...type.sectionTitle, marginTop: spacing.sm - 1, marginBottom: spacing.sm + 4 },
  link: { ...type.label },
  linkHit: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
});
