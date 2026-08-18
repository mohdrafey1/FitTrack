import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, gradients, palette, spacing, typography } from '@/constants/theme';

interface BrandMarkProps {
  size?: number;
  /** Render the "FitTrack" wordmark next to the logo. */
  withWordmark?: boolean;
}

/** The FitTrack "FT" gradient logo used across the web app. */
export function BrandMark({ size = 30, withWordmark = false }: BrandMarkProps) {
  return (
    <View style={styles.row}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>FT</Text>
      </LinearGradient>
      {withWordmark && <Text style={styles.wordmark}>FitTrack</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  initials: {
    color: colors.onGradient,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  wordmark: {
    ...typography.title,
    color: palette.indigo700,
  },
});
