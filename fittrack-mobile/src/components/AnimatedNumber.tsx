import React, { useEffect, useRef, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { motion } from '@/constants/theme';

/** easeOutCubic — fast start, settles gently, no overshoot. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Counts from the previously displayed value to `value`.
 *
 * Driven on the JS thread rather than with Reanimated because the animated
 * quantity is *text content*, not a style prop — Reanimated can only animate
 * text through a non-editable `TextInput`, which brings its own layout and
 * Android focus quirks. Updates stop as soon as the target is reached and each
 * step is a single small `<Text>` re-render, so the cost is negligible.
 *
 * Returns `value` unchanged when the OS "reduce motion" setting is on.
 */
export function useCountUp(value: number, duration: number = motion.duration.slow): number {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    const from = displayRef.current;
    if (from === value) return;

    if (reduceMotion || duration <= 0) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }

    const start = Date.now();
    let frame = requestAnimationFrame(function tick() {
      const t = Math.min((Date.now() - start) / duration, 1);
      const next = t >= 1 ? value : from + (value - from) * easeOut(t);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduceMotion]);

  return display;
}

interface AnimatedNumberProps {
  value: number;
  /** Formats the interpolated value; defaults to a rounded integer. */
  format?: (value: number) => string;
  duration?: number;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  /** Screen readers announce the final value, not each interpolation step. */
  accessibilityLabel?: string;
}

/** A `<Text>` whose numeric content counts up when it changes. */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  duration,
  style,
  numberOfLines,
  accessibilityLabel,
}: AnimatedNumberProps) {
  const current = useCountUp(value, duration);

  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      accessibilityLabel={accessibilityLabel ?? format(value)}>
      {format(current)}
    </Text>
  );
}
