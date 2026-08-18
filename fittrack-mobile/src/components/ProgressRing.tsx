import React, { useEffect, useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { colors, motion, progressGradient, type Gradient } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** 0–100; values above 100 are clamped for the arc. */
  percentage: number;
  size?: number;
  strokeWidth?: number;
  /** Fixed gradient; defaults to the tiered `progressGradient` colors. */
  gradient?: Gradient;
  /** Centered content (value, percent, icon). */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Circular progress arc with a gradient stroke, drawn with react-native-svg and
 * animated on the UI thread through `strokeDashoffset`.
 *
 * The arc starts at 12 o'clock (the circle is rotated -90°) and the gradient
 * runs corner-to-corner so the brand colors stay legible at any fill level.
 */
export function ProgressRing({
  percentage,
  size = 74,
  strokeWidth = 7,
  gradient,
  children,
  style,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(percentage, 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // `useId` output contains characters that are invalid in an SVG url(#id)
  // reference, so keep only id-safe ones.
  const gradientId = `ring-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped / 100, {
      duration: motion.duration.slow,
      easing: motion.easing.standard,
      reduceMotion: ReduceMotion.System,
    });
  }, [clamped, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const [from, to] = gradient ?? progressGradient(percentage);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          originX={center}
          originY={center}
          rotation={-90}
        />
      </Svg>
      {!!children && <View style={styles.center}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
