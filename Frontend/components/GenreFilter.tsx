import { ScrollView, StyleSheet, Text } from 'react-native';
import { AppPressable } from '@/components/AppPressable';
import { border, radius, spacing, surface, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

type GenreFilterProps = {
  genres: string[];
  selectedGenre: string;
  onSelect: (genre: string) => void;
};

/** Horizontally scrollable single-select filter chips. */
export function GenreFilter({ genres, selectedGenre, onSelect }: GenreFilterProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    >
      {genres.map((genre) => {
        const isSelected = genre === selectedGenre;

        return (
          <AppPressable
            key={genre}
            accessibilityRole="tab"
            accessibilityLabel={genre}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(genre)}
            accentColor={colors.primary}
            hitSlop={6}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : surface.sunken,
                borderColor: isSelected ? colors.primary : border.hairline,
              },
            ]}
            pressedStyle={styles.chipPressed}
          >
            <Text
              style={[
                styles.chipLabel,
                { color: isSelected ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              {genre}
            </Text>
          </AppPressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.lg + 2,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 1,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipLabel: {
    ...type.label,
  },
});
