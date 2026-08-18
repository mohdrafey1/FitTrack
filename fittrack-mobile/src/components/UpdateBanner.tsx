import { LinearGradient } from 'expo-linear-gradient';
import * as Updates from 'expo-updates';
import { RefreshCw, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/PressableScale';
import { colors, gradients, layout, motion, radius, shadows, spacing, typography } from '@/constants/theme';

const HIDDEN_OFFSET = -160;

/**
 * OTA update banner (EAS Update).
 *
 * Checks for a published update on launch and whenever the app returns to the
 * foreground, downloads it silently, then slides in a top bar:
 * "New update ready — tap to restart". Tapping reloads the app onto the new
 * bundle. Inert in development and Expo Go (Updates.isEnabled is false there).
 */
export function UpdateBanner() {
  const { isUpdatePending, isRestarting } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(HIDDEN_OFFSET);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    let inFlight = false;
    const checkAndFetch = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          // A fresh update supersedes any earlier dismissal this session.
          setDismissed(false);
        }
      } catch {
        // Offline or update server unreachable — retry on next foreground.
      } finally {
        inFlight = false;
      }
    };

    void checkAndFetch();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void checkAndFetch();
    });
    return () => subscription.remove();
  }, []);

  const visible = isUpdatePending && !dismissed;

  useEffect(() => {
    translateY.value = withSpring(visible ? 0 : HIDDEN_OFFSET, motion.spring.entrance);
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isUpdatePending) return null;

  const handleRestart = () => {
    // On success the app reloads immediately; isRestarting covers the gap.
    Updates.reloadAsync().catch(() => {});
  };

  return (
    <Animated.View
      style={[styles.container, { top: insets.top + spacing.sm }, animatedStyle]}
      pointerEvents={visible ? 'auto' : 'none'}>
      <PressableScale
        onPress={handleRestart}
        disabled={isRestarting}
        scaleTo={motion.press.scaleSubtle}
        accessibilityLabel="A new update is ready. Tap to restart the app and apply it.">
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}>
          {isRestarting ? (
            <ActivityIndicator size="small" color={colors.onGradient} />
          ) : (
            <View style={styles.iconCircle}>
              <RefreshCw
                size={layout.icon.sm}
                color={colors.onGradient}
                strokeWidth={layout.strokeWidth}
              />
            </View>
          )}
          <View style={styles.textGroup}>
            <Text style={styles.title}>{isRestarting ? 'Restarting…' : 'New update ready'}</Text>
            {!isRestarting && <Text style={styles.subtitle}>Tap to restart and apply</Text>}
          </View>
          {!isRestarting && (
            <PressableScale
              onPress={() => setDismissed(true)}
              hitSlop={layout.hitSlop}
              haptic="none"
              accessibilityLabel="Dismiss update banner"
              style={styles.dismiss}>
              <X size={layout.icon.md} color={colors.onGradientMuted} />
            </PressableScale>
          )}
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.raised,
  },
  iconCircle: {
    width: layout.iconTile.sm,
    height: layout.iconTile.sm,
    borderRadius: radius.full,
    backgroundColor: colors.onGradientFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.onGradient,
  },
  subtitle: {
    ...typography.caption,
    color: colors.onGradientMuted,
  },
  dismiss: {
    width: layout.iconTile.sm,
    height: layout.iconTile.sm,
    borderRadius: radius.full,
    backgroundColor: colors.onGradientFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
