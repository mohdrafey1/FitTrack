import { Tabs } from 'expo-router';
import { BarChart3, CalendarDays, LayoutDashboard, User } from 'lucide-react-native';
import React from 'react';

import { colors, layout, typography } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

/** Light selection tick whenever the user moves between tabs. */
const tabListeners = {
  tabPress: () => haptics.selection(),
};

export default function TabsLayout() {
  return (
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
  );
}
