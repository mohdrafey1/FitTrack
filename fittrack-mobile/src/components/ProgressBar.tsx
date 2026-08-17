import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Animated, StyleSheet, useAnimatedValue, View } from 'react-native';

import { palette, progressGradient, radius, type Gradient } from '@/constants/theme';

interface ProgressBarProps {
  /** 0–100 (values above 100 are clamped). */
  percentage: number;
  height?: number;
  /** Fixed gradient; defaults to the web app's tiered progress colors. */
  gradient?: Gradient;
}

export function ProgressBar({ percentage, height = 10, gradient }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(percentage, 100));
  const widthAnim = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [clamped, widthAnim]);

  const fill = gradient ?? progressGradient(percentage);

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}>
        <LinearGradient
          colors={fill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { borderRadius: height / 2 }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: palette.gray100,
    borderRadius: radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
});
