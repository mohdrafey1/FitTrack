import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { colors, palette, radius, spacing, type Gradient } from '@/constants/theme';
import { formatNumber, progressPercent } from '@/utils/format';

interface ProgressCardProps {
  title: string;
  icon: LucideIcon;
  consumed: number;
  target: number;
  unit: string;
  gradient: Gradient;
}

/** Daily goal card (calories / protein / water) — mirrors the web dashboard. */
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
            <Icon size={18} color={palette.white} strokeWidth={2.2} />
          </LinearGradient>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.valueGroup}>
          <Text style={styles.consumed}>{formatNumber(consumed)}</Text>
          <Text style={styles.target}>
            of {formatNumber(target)} {unit}
          </Text>
        </View>
      </View>

      <ProgressBar percentage={percentage} />

      <View style={styles.footerRow}>
        <Text style={styles.percent}>{percentage.toFixed(1)}%</Text>
        {achieved ? (
          <View style={styles.achieved}>
            <Trophy size={14} color={palette.emerald500} />
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
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  valueGroup: {
    alignItems: 'flex-end',
  },
  consumed: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  target: {
    fontSize: 12,
    color: colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percent: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  achieved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  achievedText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.emerald600,
  },
  remaining: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
