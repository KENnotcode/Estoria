import { palette, type ThemeColors } from '@/constants/theme';

/**
 * Returns the active brand palette.
 *
 * Kept as a hook so screens and components can consume a stable, typed theme
 * object and so a light theme can be introduced later without touching callers.
 */
export function useColors(): ThemeColors {
  return palette;
}
