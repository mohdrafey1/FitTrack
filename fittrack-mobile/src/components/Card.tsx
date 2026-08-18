import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, layout, radius, shadows } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  /** Tighter padding for list-style cards and stat tiles. */
  compact?: boolean;
  /** Removes padding entirely (rows supply their own). */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The app's only resting surface: white, hairline-bordered, one shadow. */
export function Card({ children, compact = false, flush = false, style }: CardProps) {
  return (
    <View
      style={[styles.card, compact && styles.compact, flush && styles.flush, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: layout.border,
    borderColor: colors.cardBorder,
    padding: layout.cardPadding,
    ...shadows.card,
  },
  compact: {
    padding: layout.cardPaddingCompact,
  },
  flush: {
    padding: 0,
  },
});
