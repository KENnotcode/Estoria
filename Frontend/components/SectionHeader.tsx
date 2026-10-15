import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppPressable } from '@/components/AppPressable';
import { type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

type SectionHeaderProps = {
  title: string;
  /** Renders a trailing "See all" action when provided. */
  onPress?: () => void;
};

export function SectionHeader({ title, onPress }: SectionHeaderProps) {
  const colors = useColors();

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {onPress ? (
        <AppPressable
          accessibilityLabel={`See all ${title}`}
          onPress={onPress}
          accentColor={colors.primary}
          hitSlop={8}
          style={styles.action}
          pressedStyle={styles.actionPressed}
        >
          <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>See all</Text>
          <Feather name="arrow-up-right" size={14} color={colors.mutedForeground} />
        </AppPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    ...type.sectionTitle,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionLabel: {
    ...type.meta,
  },
});
