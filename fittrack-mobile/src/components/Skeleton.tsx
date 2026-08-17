import React, { useEffect } from 'react';
import { Animated, StyleSheet, useAnimatedValue, type DimensionValue } from 'react-native';

import { palette, radius } from '@/constants/theme';

interface SkeletonProps {
  height?: number;
  width?: DimensionValue;
  borderRadius?: number;
}

/** Pulsing placeholder block for loading states. */
export function Skeleton({ height = 16, width = '100%', borderRadius = radius.sm }: SkeletonProps) {
  const pulse = useAnimatedValue(0.4);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[styles.base, { height, width, borderRadius, opacity: pulse }]}
      accessibilityElementsHidden
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: palette.gray200,
  },
});
