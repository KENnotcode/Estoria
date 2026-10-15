import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
  type Insets,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { motion, radius } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type AccessibilityRole = 'button' | 'link' | 'tab' | 'switch';

type AppPressableProps = {
  onPress?: () => void;
  /** Dims the control and blocks interaction. */
  disabled?: boolean;
  /** Swaps the label for a spinner and blocks interaction. */
  loading?: boolean;
  /** Enlarges the touch target without affecting the visual bounds. */
  hitSlop?: number | Insets;
  style?: StyleProp<ViewStyle>;
  /** Added while pressed, e.g. a background dimming. */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Draws a ring outside the bounds for keyboard / assistive focus. */
  showFocusRing?: boolean;
  /** Color of the focus ring and the loading spinner. */
  accentColor?: string;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: { selected?: boolean; checked?: boolean; expanded?: boolean };
  accessibilityHint?: string;
  testID?: string;
  children: ReactNode;
};

/**
 * The single pressable primitive for the app.
 *
 * Everything interactive goes through this so the tactile contract is
 * identical everywhere: a small scale-down on press-in, a visible focus ring
 * for keyboard / assistive focus, and explicit disabled and loading states.
 *
 * Motion is skipped entirely when the user prefers reduced motion.
 */
export function AppPressable({
  onPress,
  disabled = false,
  loading = false,
  hitSlop,
  style,
  pressedStyle,
  showFocusRing = true,
  accentColor,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  accessibilityHint,
  testID,
  children,
}: AppPressableProps) {
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  // Lazily-created animated value: stable across renders, never read as a ref.
  const [scale] = useState(() => new Animated.Value(1));
  const inactive = disabled || loading;

  const animateTo = useCallback(
    (toValue: number) => {
      if (reduceMotion) {
        scale.setValue(toValue);
        return;
      }
      Animated.timing(scale, {
        toValue,
        duration: motion.pressDuration,
        useNativeDriver: true,
      }).start();
    },
    [reduceMotion, scale],
  );

  const handlePressIn = useCallback(() => {
    if (!inactive) animateTo(motion.pressScale);
  }, [animateTo, inactive]);

  const handlePressOut = useCallback(() => {
    if (!inactive) animateTo(1);
  }, [animateTo, inactive]);

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  return (
    // Outer hosts exist so the scale transform never clips the focus ring or
    // the control's own overflow, and so nothing constrains its size.
    <View style={showFocusRing ? styles.ringHost : undefined} pointerEvents="box-none">
      <Animated.View style={reduceMotion ? undefined : styles.scaleHost}>
        <Animated.View style={reduceMotion ? undefined : { transform: [{ scale }] }}>
          <Pressable
            accessibilityRole={accessibilityRole}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled: inactive, busy: loading, ...accessibilityState }}
            disabled={inactive}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onFocus={handleFocus}
            onBlur={handleBlur}
            hitSlop={hitSlop}
            testID={testID}
            style={({ pressed }) => [
              style,
              focused && showFocusRing ? styles.focusRing : null,
              focused && showFocusRing && accentColor ? { borderColor: accentColor, borderWidth: 1 } : null,
              pressed && !inactive ? pressedStyle : null,
              inactive && styles.inactive,
            ]}
          >
            {loading ? <ActivityIndicator size="small" color={accentColor} /> : children}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scaleHost: {
    // `alignSelf` stays auto so the control follows its parent's alignment.
  },
  ringHost: {
    // Same: lets the wrapper size itself to whatever it contains.
  },
  focusRing: {
    borderRadius: radius.md,
  },
  inactive: {
    opacity: 0.45,
  },
});
