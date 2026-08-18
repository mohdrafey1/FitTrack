import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  /** Optional action button (already-styled element). */
  action?: React.ReactNode;
  /** Tighter variant for empty states nested inside a card. */
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, message, action, compact = false }: EmptyStateProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.iconCircle}>
        <Icon size={22} color={colors.textFaint} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  containerCompact: {
    paddingVertical: spacing.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  message: {
    ...typography.caption,
    textAlign: 'center',
  },
});
