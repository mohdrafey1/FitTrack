import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import {
  colors,
  gradients,
  layout,
  radius,
  shadows,
  spacing,
  typography,
  type Gradient,
} from '@/constants/theme';
import type { HapticStyle } from '@/utils/haptics';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  gradient?: Gradient;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  /** Compact height for inline placement. */
  small?: boolean;
  /** Haptic fired on press; defaults to a light impact. */
  haptic?: HapticStyle;
  style?: StyleProp<ViewStyle>;
}

export function GradientButton({
  label,
  onPress,
  gradient = gradients.brand,
  icon: Icon,
  disabled = false,
  loading = false,
  small = false,
  haptic = 'light',
  style,
}: GradientButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      haptic={isDisabled ? 'none' : haptic}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={label}
      style={[styles.pressable, isDisabled && styles.disabled, style]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, small && styles.gradientSmall]}>
        {loading ? (
          <ActivityIndicator color={colors.onGradient} size="small" />
        ) : (
          <>
            {Icon && (
              <Icon
                size={small ? layout.icon.md : layout.icon.lg}
                color={colors.onGradient}
                strokeWidth={layout.strokeWidth}
              />
            )}
            <Text style={small ? styles.labelSmall : styles.label} numberOfLines={1}>
              {label}
            </Text>
          </>
        )}
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.md,
    ...shadows.raised,
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: layout.tapTarget,
  },
  gradientSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 38,
  },
  label: {
    ...typography.button,
  },
  labelSmall: {
    ...typography.buttonSmall,
  },
});
