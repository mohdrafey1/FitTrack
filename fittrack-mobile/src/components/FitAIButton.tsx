import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/PressableScale';
import { colors, gradients, layout, motion, radius, shadows, spacing, typography } from '@/constants/theme';

/** Height of the bottom tab bar the button has to clear. */
const TAB_BAR_HEIGHT = 56;

/**
 * Extra bottom padding a tab screen should add so its last row is never hidden
 * behind the floating button.
 */
export const FITAI_CLEARANCE = 60;

/**
 * Floating entry point to FitAI, layered above the tab screens.
 *
 * Rendered once by the tabs layout rather than per screen, so it never
 * re-mounts when the user switches tab.
 */
export function FitAIButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeIn.duration(motion.duration.slow)}
      pointerEvents="box-none"
      style={[styles.container, { bottom: TAB_BAR_HEIGHT + insets.bottom + spacing.md }]}>
      <PressableScale
        onPress={() => router.push('/fitai')}
        accessibilityLabel="Ask FitAI about your progress"
        style={styles.button}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          <Sparkles
            size={layout.icon.lg}
            color={colors.onGradient}
            strokeWidth={layout.strokeWidth}
          />
          <Text style={styles.label}>FitAI</Text>
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 20,
  },
  button: {
    borderRadius: radius.full,
    ...shadows.raised,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: layout.tapTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  label: {
    ...typography.button,
    fontWeight: '700',
  },
});
