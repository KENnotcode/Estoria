import type { FontVariant } from 'react-native';

/**
 * Estoria ships a single cinematic dark theme, so the palette is defined once
 * and shared by every component through `useColors`.
 *
 * Everything visual is a token. Components never invent font sizes, letter
 * spacing, corner radii or gutters: they compose `type`, `spacing` and
 * `radius` below. That is what keeps the rhythm consistent across the app.
 */
export const palette = {
  background: '#0C0D10',
  foreground: '#F7F4EF',
  card: '#17191F',
  primary: '#E14D4D',
  primaryForeground: '#FFFFFF',
  secondary: '#22252C',
  muted: '#1C1F26',
  mutedForeground: '#9397A3',
  border: '#292C35',
  tint: '#E14D4D',
  /** Translucent surfaces layered on top of artwork. */
  scrim: 'rgba(12, 13, 16, 0.78)',
  overlay: 'rgba(12, 13, 16, 0.6)',
} as const;

export type ThemeColors = typeof palette;

/** Font families registered in the root layout via `useFonts`. */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/**
 * Semantic type scale. Each role carries its own size, line-height, tracking
 * and weight so hierarchy reads the same on every screen. Spread these into
 * `StyleSheet` text styles instead of hard-coding `fontSize`/`letterSpacing`.
 */
export const type = {
  /** Featured / hero movie title above the artwork. */
  hero: { fontSize: 30, lineHeight: 34, letterSpacing: -0.9, fontFamily: fontFamily.bold },
  /** Top-of-screen page titles (Search, Favorites, Profile, Movie details). */
  pageTitle: { fontSize: 26, lineHeight: 32, letterSpacing: -0.7, fontFamily: fontFamily.bold },
  /** Section headings inside a page ("Trending now", "You may also like"). */
  sectionTitle: { fontSize: 18, lineHeight: 23, letterSpacing: -0.3, fontFamily: fontFamily.bold },
  /** Movie card titles. */
  cardTitle: { fontSize: 14, lineHeight: 19, fontFamily: fontFamily.semiBold },
  /** Long-form copy (descriptions). */
  body: { fontSize: 14, lineHeight: 22, fontFamily: fontFamily.regular },
  /** Secondary copy under a title. */
  subtitle: { fontSize: 13, lineHeight: 20, fontFamily: fontFamily.regular },
  /** Inline metadata rows (year · genre · rating). */
  meta: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.medium },
  /** Small supporting captions. */
  caption: { fontSize: 11, lineHeight: 15, fontFamily: fontFamily.regular },
  /** Button labels, chips, emphasized small text. */
  label: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.semiBold },
  /** Primary / secondary CTA label — one size across every button on the app. */
  button: { fontSize: 13, lineHeight: 17, fontFamily: fontFamily.semiBold },
  /** Uppercase section kickers — use sparingly (one per few sections). */
  kicker: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, fontFamily: fontFamily.bold },
  /** Tiny uppercase badges overlaid on artwork (rating, "FEATURED"). */
  badge: { fontSize: 9, lineHeight: 12, letterSpacing: 1.1, fontFamily: fontFamily.bold },
  /** Override for figures so ratings and runtimes align in columns. */
  numeric: { fontVariant: ['tabular-nums'] as FontVariant[] },
} as const;

export type TypeToken = (typeof type)[keyof typeof type];

/**
 * Spacing scale. `screen`/`section` drive the page shell; the numeric ladder
 * replaces ad-hoc `marginTop`/`padding` values.
 */
export const spacing = {
  /** Horizontal padding applied to every screen. */
  screen: 20,
  /** Vertical gap between two content sections. */
  section: 28,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const;

/**
 * Shape consistency rule (documented so the mix stays intentional):
 * - Hero / featured imagery and full cards  -> `lg` (16) or `xl` (20)
 * - Controls: buttons, inputs, tags          -> `md` (12)
 * - Small overlay badges                     -> `sm` (8)
 * - Chips and circular avatars               -> `pill`
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/**
 * Tonal surface steps, deepest to most raised. Depth comes from a single
 * step of tone (never a second hue), so a "raised" chip reads as raised
 * rather than as a differently-colored box.
 */
export const surface = {
  /** Page background. */
  base: palette.background,
  /** Grouped content blocks. */
  card: palette.card,
  /** Interactive bars, selected chips, icon wells. */
  raised: palette.secondary,
  /** Recessed fills (skeletons, tracks). */
  sunken: palette.muted,
} as const;

/**
 * Hairlines. Use one weight everywhere (`hairline`) and jump to `strong`
 * only when a boundary must read as interactive.
 */
export const border = {
  /** 1px default divider / card edge. */
  hairline: palette.border,
  /** Barely-there fill separators. */
  subtle: '#20232B',
  /** Focus rings, selected edges. */
  strong: '#3A3F4D',
} as const;

/**
 * Elevation. Shadow color is tinted toward the background hue (never a
 * neutral gray on a blue-black base), which keeps dark mode from mudding.
 */
export const shadow = {
  card: {
    shadowColor: '#05070C',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  floating: {
    shadowColor: '#05070C',
    shadowOpacity: 0.6,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
} as const;

/**
 * Motion values. Kept as tokens so press feedback is identical everywhere and
 * honors `prefers-reduced-motion` at the single place that animates.
 */
export const motion = {
  /** Scale applied to any pressable on press-in. */
  pressScale: 0.97,
  /** Duration of the press/ release tween, in ms. */
  pressDuration: 110,
  /** Focus ring and state-transition duration, in ms. */
  stateDuration: 160,
} as const;

/**
 * Poster metrics shared by every surface. One aspect ratio and one row width
 * means a card looks like the same card on Home, Search and Favorites.
 */
export const poster = {
  aspectRatio: 0.69,
  /** Width used inside horizontal rails. */
  rowWidth: 134,
  /** Gap between the two columns of a poster grid. */
  gridGutter: 14,
  /** Horizontal inset of a grid from the screen edge. */
  gridInset: spacing.screen,
} as const;
