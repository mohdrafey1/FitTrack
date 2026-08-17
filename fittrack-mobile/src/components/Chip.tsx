import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, palette, radius, spacing } from '@/constants/theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Secondary line (e.g. gram amount under a serving size). */
  sublabel?: string;
  /** Selected background color; defaults to FitTrack blue. */
  selectedColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function Chip({
  label,
  selected,
  onPress,
  sublabel,
  selectedColor = palette.blue600,
  style,
}: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: selectedColor, borderColor: selectedColor },
        pressed && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {!!sublabel && (
        <Text style={[styles.sublabel, selected && styles.sublabelSelected]}>{sublabel}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: palette.white,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  labelSelected: {
    color: palette.white,
  },
  sublabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  sublabelSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
});
