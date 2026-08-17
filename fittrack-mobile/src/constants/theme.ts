/**
 * FitTrack design tokens.
 *
 * Ported from the FitTrack web app (Tailwind CSS palette) so the mobile app
 * shares the exact same visual language: soft blue/indigo/purple background,
 * white cards, and feature gradients (orange/red = calories, red/pink = protein,
 * blue/cyan = water).
 */

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
  red400: '#F87171',
  red500: '#EF4444',
  red600: '#DC2626',

  pink500: '#EC4899',

  amber100: '#FEF3C7',
  amber400: '#FBBF24',
  amber600: '#D97706',

  emerald100: '#D1FAE5',
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
  inputBorder: palette.gray300,
  inputBackground: palette.white,

  danger: palette.red600,
  dangerBg: '#FEF2F2',
  success: palette.emerald600,
  successBg: palette.emerald100,
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

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  title: { fontSize: 26, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  section: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
  small: { fontSize: 12, color: colors.textMuted },
} as const;

export const shadows = {
  card: {
    shadowColor: palette.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  button: {
    shadowColor: palette.gray900,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;
