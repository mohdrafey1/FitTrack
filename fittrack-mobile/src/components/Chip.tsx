import React from 'react';
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';

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
  selectedColor = colors.primary,
  style,
}: ChipProps) {
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        selected && { backgroundColor: selectedColor, borderColor: selectedColor },
        style,
      ]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {!!sublabel && (
        <Text style={[styles.sublabel, selected && styles.sublabelSelected]}>{sublabel}</Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: layout.border,
    borderColor: colors.inputBorder,
    backgroundColor: colors.card,
  },
  label: {
    ...typography.labelStrong,
  },
  labelSelected: {
    color: colors.onGradient,
  },
  sublabel: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },
  sublabelSelected: {
    color: colors.onGradientMuted,
  },
});
