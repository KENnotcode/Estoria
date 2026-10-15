import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppPressable } from '@/components/AppPressable';
import { border, radius, spacing, surface, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

type EmptyStateProps = {
  title: string;
  message: string;
  /** Feather glyph name shown above the copy. */
  icon?: keyof typeof Feather.glyphMap;
  /** When both an action label and handler are given, a CTA is rendered. */
  actionLabel?: string;
  onAction?: () => void;
  /** Shows a spinner inside the CTA and blocks presses. */
  actionLoading?: boolean;
};

export function EmptyState({
  title,
  message,
  icon = 'film',
  actionLabel,
  onAction,
  actionLoading = false,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.icon,
          { backgroundColor: surface.sunken, borderColor: border.hairline },
        ]}
      >
        <Feather name={icon} size={24} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>

      {actionLabel && onAction ? (
        <AppPressable
          accessibilityLabel={actionLabel}
          onPress={onAction}
          loading={actionLoading}
          accentColor={colors.primary}
          style={[styles.action, { backgroundColor: colors.primary }]}
          pressedStyle={styles.actionPressed}
        >
          <Text style={[styles.actionLabel, { color: colors.primaryForeground }]}>
            {actionLabel}
          </Text>
        </AppPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen * 2,
    minHeight: 330,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    ...type.sectionTitle,
    textAlign: 'center',
  },
  message: {
    ...type.subtitle,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  action: {
    paddingHorizontal: spacing.lg + 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: 22,
  },
  actionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionLabel: {
    ...type.button,
  },
});
