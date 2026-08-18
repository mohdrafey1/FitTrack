import { Trophy, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedNumber } from '@/components/AnimatedNumber';
import { ProgressRing } from '@/components/ProgressRing';
import { colors, layout, spacing, typography, type Gradient } from '@/constants/theme';
import { formatNumber, progressPercent, rawPercent } from '@/utils/format';

interface GoalRingProps {
  title: string;
  icon: LucideIcon;
  consumed: number;
  target: number;
  unit: string;
  gradient: Gradient;
  size?: number;
}

/**
 * One daily goal as a gradient ring: icon in the centre, the running total and
 * the target underneath. Three of these replace the three stacked full-width
 * progress bars the dashboard used to show.
 */
export function GoalRing({
  title,
  icon: Icon,
  consumed,
  target,
  unit,
  gradient,
  size = 72,
}: GoalRingProps) {
  const percentage = progressPercent(consumed, target);
  const achieved = percentage >= 100;

  return (
    <View
      style={styles.column}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${title}: ${formatNumber(consumed)} of ${formatNumber(target)} ${unit}, ${rawPercent(consumed, target)} percent`}>
      <ProgressRing percentage={percentage} gradient={gradient} size={size} strokeWidth={7}>
        <Icon size={layout.icon.lg} color={gradient[0]} strokeWidth={layout.strokeWidth} />
      </ProgressRing>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <AnimatedNumber
        value={consumed}
        style={styles.value}
        numberOfLines={1}
        format={(n) => Math.round(n).toLocaleString()}
      />

      {achieved ? (
        <View style={styles.achievedRow}>
          <Trophy size={layout.icon.xs} color={colors.success} strokeWidth={layout.strokeWidth} />
          <Text style={styles.achievedText} numberOfLines={1}>
            Goal met
          </Text>
        </View>
      ) : (
        <Text style={styles.target} numberOfLines={1}>
          of {formatNumber(target)} {unit}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  title: {
    ...typography.captionStrong,
    marginTop: spacing.sm,
  },
  value: {
    ...typography.numberMd,
  },
  target: {
    ...typography.caption,
  },
  achievedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  achievedText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
});
