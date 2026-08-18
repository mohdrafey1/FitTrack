import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, motion, progressGradient, radius, type Gradient } from '@/constants/theme';

interface ProgressBarProps {
  /** 0–100 (values above 100 are clamped). */
  percentage: number;
  height?: number;
  /** Fixed gradient; defaults to the web app's tiered progress colors. */
  gradient?: Gradient;
}

export function ProgressBar({ percentage, height = 8, gradient }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(percentage, 100));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped, {
      duration: motion.duration.slow,
      easing: motion.easing.standard,
      reduceMotion: ReduceMotion.System,
    });
  }, [clamped, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const fill = gradient ?? progressGradient(percentage);

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View style={[styles.fill, fillStyle]}>
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
    backgroundColor: colors.track,
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
