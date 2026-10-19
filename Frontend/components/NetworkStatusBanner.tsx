import { StyleSheet, Text, View } from 'react-native';
import { spacing, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

/**
 * A non-dismissible banner shown at the top of the screen when the device
 * is offline. It sits below the status bar so it never overlaps the header
 * or tab bar.
 */
export function NetworkStatusBanner({ isOnline }: { isOnline: boolean }) {
  const colors = useColors();

  if (isOnline) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.secondary }]}>
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        You appear to be offline. Check your connection and try again.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: spacing.screen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...type.caption,
    textAlign: 'center',
  },
});
