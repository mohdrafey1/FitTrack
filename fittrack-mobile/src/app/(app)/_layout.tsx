import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="log-food" options={{ presentation: 'modal' }} />
      <Stack.Screen name="log-water" options={{ presentation: 'modal' }} />
      <Stack.Screen name="create-food" options={{ presentation: 'modal' }} />
      <Stack.Screen name="fitai" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reminders/index" />
      <Stack.Screen name="reminders/protein" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reminders/water" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
