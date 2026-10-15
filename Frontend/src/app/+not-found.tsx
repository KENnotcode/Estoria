import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, type } from '@/constants/theme';
import { useColors } from '../../hooks/useColors';

export default function NotFoundScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          This page could not be found.
        </Text>
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          The screen you were looking for is not part of Estoria.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Go home
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screen,
    gap: spacing.sm,
  },
  title: {
    ...type.pageTitle,
    textAlign: 'center',
  },
  message: {
    ...type.subtitle,
    textAlign: 'center',
    maxWidth: 320,
  },
  link: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkText: {
    ...type.button,
  },
});
