import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { palette, radius, shadows, spacing, type Gradient } from '@/constants/theme';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  gradient?: Gradient;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  /** Compact height for inline placement. */
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GradientButton({
  label,
  onPress,
  gradient = [palette.blue600, palette.indigo700],
  icon: Icon,
  disabled = false,
  loading = false,
  small = false,
  style,
}: GradientButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.pressable,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, small && styles.gradientSmall]}>
        {loading ? (
          <ActivityIndicator color={palette.white} size="small" />
        ) : (
          <>
            {Icon && <Icon size={small ? 16 : 19} color={palette.white} strokeWidth={2.2} />}
            <Text style={[styles.label, small && styles.labelSmall]}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.md,
    ...shadows.button,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
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
    paddingVertical: 15,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  gradientSmall: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    minHeight: 40,
  },
  label: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '600',
  },
  labelSmall: {
    fontSize: 14,
  },
});
