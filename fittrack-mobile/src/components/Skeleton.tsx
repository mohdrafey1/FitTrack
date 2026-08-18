import React, { useEffect } from 'react';
import { StyleSheet, type DimensionValue } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, motion, radius } from '@/constants/theme';

interface SkeletonProps {
  height?: number;
  width?: DimensionValue;
  borderRadius?: number;
}

/** Pulsing placeholder block for loading states. */
export function Skeleton({ height = 14, width = '100%', borderRadius = radius.sm }: SkeletonProps) {
  const pulse = useSharedValue(0.45);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 0.7;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, {
        duration: motion.duration.pulse,
        easing: motion.easing.inOut,
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      true
    );
  }, [pulse, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[styles.base, { height, width, borderRadius }, animatedStyle]}
      accessibilityElementsHidden
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.skeleton,
  },
});
