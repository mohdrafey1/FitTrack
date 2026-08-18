import React from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { motion } from '@/constants/theme';
import { playHaptic, type HapticStyle } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Scale while held. Defaults to `motion.press.scale`; use
   * `motion.press.scaleSubtle` for full-width surfaces where 0.97 reads as a
   * jump.
   */
  scaleTo?: number;
  /** Haptic fired on a completed press. Defaults to `'light'`. */
  haptic?: HapticStyle;
}

/**
 * The app's single press affordance: a spring scale-down plus a slight opacity
 * dip, with an optional haptic. Used for cards, buttons, list rows and icon
 * buttons so pressing anything feels the same.
 *
 * The haptic fires on `onPress` rather than `onPressIn` so a touch that turns
 * into a scroll never buzzes.
 *
 * Handlers are deliberately plain functions, not `useCallback`: React Compiler
 * forbids mutating a shared value that was passed into a memo hook's dependency
 * list, and the compiler already memoizes these for us.
 */
export function PressableScale({
  children,
  style,
  scaleTo = motion.press.scale,
  haptic = 'light',
  onPress,
  onPressIn,
  onPressOut,
  accessibilityRole = 'button',
  ...rest
}: PressableScaleProps) {
  const pressed = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotion ? 1 : 1 + (scaleTo - 1) * pressed.value }],
    opacity: 1 - (1 - motion.press.opacity) * pressed.value,
  }));

  function handlePressIn(event: GestureResponderEvent) {
    pressed.value = withSpring(1, motion.spring.press);
    onPressIn?.(event);
  }

  function handlePressOut(event: GestureResponderEvent) {
    pressed.value = withSpring(0, motion.spring.press);
    onPressOut?.(event);
  }

  function handlePress(event: GestureResponderEvent) {
    playHaptic(haptic);
    onPress?.(event);
  }

  return (
    <AnimatedPressable
      {...rest}
      accessibilityRole={accessibilityRole}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
}
