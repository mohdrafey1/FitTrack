/**
 * FitTrack design tokens.
 *
 * Ported from the FitTrack web app (Tailwind CSS palette) so the mobile app
 * shares the exact same visual language: soft blue/indigo/purple background,
 * white cards, and feature gradients (orange/red = calories, red/pink = protein,
 * blue/cyan = water).
 *
 * Everything visual lives here. Screens and components must not hard-code font
 * sizes, colors, radii, shadows or animation timings — import a token instead.
 */

import { Easing, ReduceMotion } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',

  indigo50: '#EEF2FF',
  indigo100: '#E0E7FF',
  indigo500: '#6366F1',
  indigo600: '#4F46E5',
  indigo700: '#4338CA',

  purple50: '#FAF5FF',
  purple100: '#F3E8FF',
  purple500: '#A855F7',
  purple600: '#9333EA',

  orange100: '#FFEDD5',
  orange400: '#FB923C',
  orange500: '#F97316',
  orange600: '#EA580C',

  red100: '#FEE2E2',
  red200: '#FECACA',
  red400: '#F87171',
  red500: '#EF4444',
  red600: '#DC2626',
  red50: '#FEF2F2',

  pink500: '#EC4899',

  amber100: '#FEF3C7',
  amber400: '#FBBF24',
  amber600: '#D97706',

  emerald100: '#D1FAE5',
  emerald200: '#A7F3D0',
  emerald500: '#10B981',
  emerald600: '#059669',

  green500: '#22C55E',
  green600: '#16A34A',

  cyan500: '#06B6D4',

  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
} as const;

export const colors = {
  /** App background gradient (blue-50 → indigo-50 → purple-50). */
  backgroundGradient: [palette.blue50, palette.indigo50, palette.purple50] as const,

  primary: palette.blue600,
  primaryDark: palette.indigo700,

  text: palette.gray900,
  textSecondary: palette.gray600,
  textMuted: palette.gray500,
  textFaint: palette.gray400,

  card: palette.white,
  cardBorder: palette.gray100,
  divider: palette.gray200,
  surfaceMuted: palette.gray50,
  /** Neutral fill behind chips, icon buttons and progress tracks. */
  fill: palette.gray100,
  track: palette.gray100,
  skeleton: palette.gray200,

  inputBorder: palette.gray300,
  inputBorderFocused: palette.blue500,
  inputBackground: palette.white,

  danger: palette.red600,
  dangerBg: palette.red50,
  dangerSoft: palette.red100,
  dangerBorder: palette.red200,
  success: palette.emerald600,
  successBg: palette.emerald100,
  successBorder: palette.emerald200,
  warning: palette.amber600,
  warningBg: palette.amber100,
  info: palette.blue600,
  infoBg: palette.blue100,

  /** Dark surface used by toasts. */
  inverseSurface: palette.gray800,
  inverseText: palette.white,

  /** Content drawn on top of a brand gradient. */
  onGradient: palette.white,
  onGradientMuted: 'rgba(255,255,255,0.85)',
  onGradientFaint: 'rgba(255,255,255,0.65)',
  onGradientFill: 'rgba(255,255,255,0.18)',
} as const;

/** Feature gradients, identical to the web app's Tailwind gradient pairs. */
export const gradients = {
  brand: [palette.blue600, palette.indigo700] as const,
  calories: [palette.orange500, palette.red500] as const,
  protein: [palette.red500, palette.pink500] as const,
  water: [palette.blue500, palette.cyan500] as const,
  history: [palette.emerald500, palette.green500] as const,
  analytics: [palette.purple500, palette.indigo500] as const,
} as const;

export type Gradient = readonly [string, string];

/**
 * Progress bar gradient by completion percentage — same tiers as the web app:
 * ≥100 emerald→green, ≥75 amber→orange, ≥50 orange→red, else red→pink.
 */
export function progressGradient(percentage: number): Gradient {
  if (percentage >= 100) return [palette.emerald500, palette.green500];
  if (percentage >= 75) return [palette.amber400, palette.orange500];
  if (percentage >= 50) return [palette.orange400, palette.red400];
  return [palette.red400, palette.pink500];
}

/**
 * Spacing ramp, tuned down ~15% from the original scale for mobile density.
 * (was 4/8/12/16/20/24/32)
 */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 22,
  xxxl: 28,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

/**
 * Structural tokens screens used to inline: card padding, icon tile / icon
 * sizes, border widths and the minimum accessible tap target.
 */
export const layout = {
  /** Horizontal gutter for every screen. */
  screenPadding: spacing.lg,
  /** Default padding inside a `Card`. */
  cardPadding: spacing.lg,
  /** Denser padding for list-style cards and stat tiles. */
  cardPaddingCompact: spacing.md,
  /** Hairline separators between list rows. */
  hairline: StyleSheet.hairlineWidth,
  border: 1,
  /** Minimum accessible tap target (pt). */
  tapTarget: 44,
  /** Standard hitSlop for small icon buttons. */
  hitSlop: 10,
  /** Rounded square behind a feature icon. */
  iconTile: {
    sm: 24,
    md: 30,
    lg: 36,
  },
  /** Lucide icon sizes. */
  icon: {
    xs: 11,
    sm: 13,
    md: 16,
    lg: 18,
    xl: 22,
  },
  /** Circular icon button (header bell, modal close). */
  iconButton: 34,
  /** Stroke width for lucide icons — one value app-wide. */
  strokeWidth: 2.2,
} as const;

/**
 * Type ramp. Every token carries `fontSize` + `lineHeight` + `fontWeight` +
 * `color` so screens never hand-roll a size.
 *
 * Ramp (was 26/20/17/15/13/12 with ad-hoc 22/21/19/14/12.5/9.5 in screens):
 *   display 22 · title 18 · heading 15 · body 14 · label 13 · caption 12 · micro 10
 * with a parallel numeric ramp for metrics.
 */
export const typography = {
  /** Auth hero wordmark — the one place the brand runs large. */
  brand: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const, color: colors.primaryDark },
  /** Screen-level greeting / hero title. */
  display: { fontSize: 22, lineHeight: 27, fontWeight: '700' as const, color: colors.text },
  /** Modal + sub-screen titles, brand wordmark. */
  title: { fontSize: 18, lineHeight: 23, fontWeight: '700' as const, color: colors.text },
  /** Section headers and card titles. */
  heading: { fontSize: 15, lineHeight: 20, fontWeight: '700' as const, color: colors.text },
  /** Card sub-title / grouped row title. */
  subheading: { fontSize: 14, lineHeight: 19, fontWeight: '600' as const, color: colors.text },

  body: { fontSize: 14, lineHeight: 19, fontWeight: '400' as const, color: colors.text },
  bodyStrong: { fontSize: 14, lineHeight: 19, fontWeight: '600' as const, color: colors.text },

  /** Form labels, list row secondary text. */
  label: { fontSize: 13, lineHeight: 17, fontWeight: '500' as const, color: colors.textSecondary },
  labelStrong: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },

  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, color: colors.textMuted },
  captionStrong: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },

  /** Chart axes, bar values, unit hints. */
  micro: { fontSize: 10, lineHeight: 13, fontWeight: '500' as const, color: colors.textFaint },

  /** Numeric ramp — bold, tight leading, for values rather than prose. */
  numberXl: { fontSize: 28, lineHeight: 32, fontWeight: '700' as const, color: colors.text },
  numberLg: { fontSize: 20, lineHeight: 24, fontWeight: '700' as const, color: colors.text },
  numberMd: { fontSize: 17, lineHeight: 21, fontWeight: '700' as const, color: colors.text },
  numberSm: { fontSize: 14, lineHeight: 18, fontWeight: '700' as const, color: colors.text },

  /** Button labels. */
  button: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const, color: colors.onGradient },
  buttonSmall: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600' as const,
    color: colors.onGradient,
  },
} as const;

/**
 * Two elevations only: `card` for every resting surface and `raised` for
 * floating chrome (buttons, banners, toasts). Never toggle these on press —
 * animate opacity/scale instead (on Android a shadow change recreates the
 * native view and drops `TextInput` focus).
 */
export const shadows = {
  card: {
    shadowColor: palette.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: palette.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
} as const;

/**
 * Motion tokens. Quick and functional: 120–260ms, spring only for press
 * feedback. Anything longer reads as decoration on a tracking app.
 *
 * `ReduceMotion.System` makes Reanimated honour the OS "reduce motion" switch
 * for every animation configured with it; components additionally skip
 * entering/looping animations via `useReducedMotion()`.
 */
export const motion = {
  duration: {
    /** Press states, tiny opacity swaps. */
    fast: 120,
    /** Default UI transition. */
    base: 180,
    /** Progress fills, count-ups, banners. */
    slow: 260,
    /** Skeleton pulse half-cycle. */
    pulse: 700,
  },
  easing: {
    /** Material "standard" curve — decelerate into place. */
    standard: Easing.bezier(0.2, 0, 0, 1),
    out: Easing.out(Easing.quad),
    inOut: Easing.inOut(Easing.quad),
  },
  spring: {
    /** Snappy, non-bouncy — press feedback and chips. */
    press: { damping: 20, stiffness: 420, mass: 0.6, reduceMotion: ReduceMotion.System },
    /** Slightly softer — banners and toasts sliding in. */
    entrance: { damping: 22, stiffness: 260, mass: 0.9, reduceMotion: ReduceMotion.System },
  },
  press: {
    /** Scale applied while a card / button / row is held. */
    scale: 0.97,
    /** Subtler scale for large full-width surfaces. */
    scaleSubtle: 0.985,
    opacity: 0.9,
  },
  /** Stagger between list item entrances (ms), capped by the caller. */
  stagger: 35,
} as const;
