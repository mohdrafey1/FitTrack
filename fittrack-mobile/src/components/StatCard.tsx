import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { layout, radius, spacing, typography } from '@/constants/theme';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  /** Icon foreground color. */
  color: string;
  /** Icon container background (soft tint). */
  bgColor: string;
}

/**
 * Compact metric tile: a small tinted icon chip sits inline with the label so
 * the value gets the visual weight instead of the icon.
 */
export function StatCard({ title, value, subtitle, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <Card compact style={styles.card}>
      <View style={styles.labelRow}>
        <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
          <Icon size={layout.icon.sm} color={color} strokeWidth={layout.strokeWidth} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBox: {
    width: layout.iconTile.sm,
    height: layout.iconTile.sm,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.caption,
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  value: {
    ...typography.numberMd,
    flexShrink: 1,
  },
  subtitle: {
    ...typography.caption,
  },
});
