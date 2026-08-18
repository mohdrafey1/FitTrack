import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UpdateBanner } from '@/components/UpdateBanner';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RemindersProvider } from '@/context/RemindersContext';
import { ToastProvider } from '@/context/ToastContext';
import { configureNotificationHandling } from '@/notifications/notifications';

SplashScreen.preventAutoHideAsync();

configureNotificationHandling();

/**
 * Navigate to the screen a tapped reminder points at (`data.url`), both when
 * the app is cold-started from a notification and when it is already running.
 *
 * `enabled` must stay false until the navigator is mounted (auth restored),
 * otherwise a cold-start tap would navigate before navigation exists.
 */
function useNotificationObserver(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;

    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url as never);
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (isMounted && response?.notification) {
        redirect(response.notification);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [enabled]);
}

function RootNavigator() {
  const { loading } = useAuth();
  useNotificationObserver(!loading);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    // Keep the native splash visible while the stored session restores.
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    // Required by react-native-gesture-handler: every gesture must be inside
    // this view. It wraps the whole tree so modal screens are covered too.
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <RemindersProvider>
            <ToastProvider>
              <StatusBar style="dark" />
              <RootNavigator />
              <UpdateBanner />
            </ToastProvider>
          </RemindersProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
