import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedNumber } from '@/components/AnimatedNumber';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { colors, layout, radius, spacing, typography, type Gradient } from '@/constants/theme';
import { formatNumber, progressPercent } from '@/utils/format';

interface ProgressCardProps {
  title: string;
  icon: LucideIcon;
  consumed: number;
  target: number;
  unit: string;
  gradient: Gradient;
}

/** Wide daily-goal row: gradient icon chip, running total and a progress bar. */
export function ProgressCard({
  title,
  icon: Icon,
  consumed,
  target,
  unit,
  gradient,
}: ProgressCardProps) {
  const percentage = progressPercent(consumed, target);
  const remaining = Math.max((target || 0) - (consumed || 0), 0);
  const achieved = percentage >= 100;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBox}>
            <Icon size={layout.icon.md} color={colors.onGradient} strokeWidth={layout.strokeWidth} />
          </LinearGradient>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.valueGroup}>
          <AnimatedNumber value={consumed} style={styles.consumed} />
          <Text style={styles.target}>
            of {formatNumber(target)} {unit}
          </Text>
        </View>
      </View>

      <ProgressBar percentage={percentage} />

      <View style={styles.footerRow}>
        <Text style={styles.percent}>{percentage.toFixed(0)}%</Text>
        {achieved ? (
          <View style={styles.achieved}>
            <Trophy size={layout.icon.sm} color={colors.success} strokeWidth={layout.strokeWidth} />
            <Text style={styles.achievedText}>Goal achieved!</Text>
          </View>
        ) : (
          <Text style={styles.remaining}>
            {formatNumber(remaining)} {unit} left
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: layout.iconTile.md,
    height: layout.iconTile.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.subheading,
  },
  valueGroup: {
    alignItems: 'flex-end',
  },
  consumed: {
    ...typography.numberLg,
  },
  target: {
    ...typography.caption,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percent: {
    ...typography.labelStrong,
  },
  achieved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  achievedText: {
    ...typography.label,
    color: colors.success,
    fontWeight: '600',
  },
  remaining: {
    ...typography.label,
    color: colors.textMuted,
  },
});
