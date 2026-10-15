import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppPressable } from '@/components/AppPressable';
import { border, radius, spacing, surface, type } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

type SearchBarProps = {
  value?: string;
  placeholder?: string;
  /** Makes the whole bar a button that navigates, instead of an editable field. */
  onPress?: () => void;
  onChangeText?: (value: string) => void;
};

const DEFAULT_PLACEHOLDER = 'Search movies, actors, genres';

export function SearchBar({
  value,
  placeholder = DEFAULT_PLACEHOLDER,
  onPress,
  onChangeText,
}: SearchBarProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  // The focused field lifts its hairline so the active target is obvious.
  const containerStyle = [
    styles.container,
    { backgroundColor: surface.sunken, borderColor: focused ? border.strong : border.hairline },
  ];

  const content = (
    <>
      <Feather name="search" size={19} color={focused ? colors.primary : colors.mutedForeground} />
      {onChangeText ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          returnKeyType="search"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { color: colors.foreground }]}
        />
      ) : (
        <Text numberOfLines={1} style={[styles.placeholder, { color: colors.mutedForeground }]}>
          {placeholder}
        </Text>
      )}
      <Feather name="sliders" size={17} color={colors.mutedForeground} />
    </>
  );

  if (onPress) {
    return (
      <AppPressable
        testID="home-search"
        accessibilityLabel={placeholder}
        onPress={onPress}
        accentColor={colors.primary}
        showFocusRing={false}
        style={containerStyle}
        pressedStyle={styles.pressed}
      >
        {content}
      </AppPressable>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.78,
  },
  placeholder: {
    flex: 1,
    ...type.subtitle,
  },
  input: {
    flex: 1,
    ...type.body,
    paddingVertical: 0,
  },
});
