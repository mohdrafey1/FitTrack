import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Linking, Platform } from 'react-native';

import { palette } from '@/constants/theme';

/** Android notification channels (required on Android 8+). */
export const CHANNELS = {
  protein: 'protein-reminders',
  water: 'water-reminders',
} as const;

/** How incoming notifications behave while the app is foregrounded. */
export function configureNotificationHandling() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNELS.protein, {
    name: 'Protein reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: palette.red500,
  });
  await Notifications.setNotificationChannelAsync(CHANNELS.water, {
    name: 'Water reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: palette.blue500,
  });
}

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export async function getNotificationPermissionState(): Promise<PermissionState> {
  if (!Device.isDevice) return 'unavailable';
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return 'granted';
  return settings.canAskAgain ? 'undetermined' : 'denied';
}

/**
 * Request notification permission from the OS.
 * Returns the resulting permission state.
 */
export async function requestNotificationPermission(): Promise<PermissionState> {
  if (!Device.isDevice) return 'unavailable';

  await ensureAndroidChannels();
  const settings = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  if (settings.granted) return 'granted';
  return settings.canAskAgain ? 'undetermined' : 'denied';
}

/** Open the OS notification settings for this app (for a "denied" state). */
export function openSystemNotificationSettings() {
  Linking.openSettings().catch(() => {
    // Nothing sensible to do if the OS refuses; the settings screen explains manually.
  });
}
