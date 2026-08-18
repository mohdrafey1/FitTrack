import { Tabs } from 'expo-router';
import { BarChart3, CalendarDays, LayoutDashboard, User } from 'lucide-react-native';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { FitAIButton } from '@/components/FitAIButton';
import { colors, layout, typography } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

/** Light selection tick whenever the user moves between tabs. */
const tabListeners = {
  tabPress: () => haptics.selection(),
};

export default function TabsLayout() {
  return (
    // box-none lets touches through to the tabs except on the button itself.
    <View style={styles.container} pointerEvents="box-none">
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.divider,
        },
        tabBarLabelStyle: {
          fontSize: typography.micro.fontSize,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        listeners={tabListeners}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={layout.icon.xl} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        listeners={tabListeners}
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <CalendarDays size={layout.icon.xl} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        listeners={tabListeners}
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <BarChart3 size={layout.icon.xl} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={tabListeners}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={layout.icon.xl} color={color} />,
        }}
      />
      </Tabs>
      <FitAIButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
