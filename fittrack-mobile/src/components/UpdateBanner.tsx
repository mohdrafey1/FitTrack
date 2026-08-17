import { LinearGradient } from 'expo-linear-gradient';
import * as Updates from 'expo-updates';
import { RefreshCw, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  useAnimatedValue,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gradients, palette, radius, spacing } from '@/constants/theme';

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
  const translateY = useAnimatedValue(-160);

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
    Animated.spring(translateY, {
      toValue: visible ? 0 : -160,
      useNativeDriver: true,
      friction: 9,
    }).start();
  }, [visible, translateY]);

  if (!isUpdatePending) return null;

  const handleRestart = () => {
    // On success the app reloads immediately; isRestarting covers the gap.
    Updates.reloadAsync().catch(() => {});
  };

  return (
    <Animated.View
      style={[styles.container, { top: insets.top + spacing.sm, transform: [{ translateY }] }]}
      pointerEvents={visible ? 'auto' : 'none'}>
      <Pressable
        onPress={handleRestart}
        disabled={isRestarting}
        accessibilityRole="button"
        accessibilityLabel="A new update is ready. Tap to restart the app and apply it."
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}>
          {isRestarting ? (
            <ActivityIndicator size="small" color={palette.white} />
          ) : (
            <View style={styles.iconCircle}>
              <RefreshCw size={15} color={palette.white} strokeWidth={2.4} />
            </View>
          )}
          <View style={styles.textGroup}>
            <Text style={styles.title}>{isRestarting ? 'Restarting…' : 'New update ready'}</Text>
            {!isRestarting && <Text style={styles.subtitle}>Tap to restart and apply</Text>}
          </View>
          {!isRestarting && (
            <Pressable
              onPress={() => setDismissed(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Dismiss update banner"
              style={({ pressed }) => [styles.dismiss, pressed && { opacity: 0.6 }]}>
              <X size={16} color="rgba(255,255,255,0.85)" />
            </Pressable>
          )}
        </LinearGradient>
      </Pressable>
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
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 1,
  },
  title: {
    color: palette.white,
    fontSize: 14.5,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
  },
  dismiss: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
