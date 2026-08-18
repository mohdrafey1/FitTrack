import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Card } from '@/components/Card';
import { colors, layout, motion, radius, spacing, typography, type Gradient } from '@/constants/theme';
import { formatShortDate } from '@/utils/date';

interface BarChartProps {
  title: string;
  icon: LucideIcon;
  gradient: Gradient;
  /** Chronological entries; the last 7 are shown. */
  data: { date: string; value: number }[];
  unit: string;
  /** Dashed goal line drawn at this value when it fits the scale. */
  target?: number;
}

const CHART_HEIGHT = 104;

/** Lightweight dependency-free bar chart matching the web app's trend charts. */
export function BarChart({ title, icon: Icon, gradient, data, unit, target }: BarChartProps) {
  const chartData = data.slice(-7);
  const values = chartData.map((d) => d.value);
  const maxValue = Math.max(...values, target ?? 0, 1);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Icon size={layout.icon.md} color={colors.textMuted} strokeWidth={layout.strokeWidth} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <TrendingUp size={layout.icon.sm} color={colors.textFaint} />
      </View>

      {chartData.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      ) : (
        <View>
          <View style={styles.plotArea}>
            {target !== undefined && target > 0 && target <= maxValue && (
              <View style={[styles.targetLine, { bottom: (target / maxValue) * CHART_HEIGHT }]} />
            )}
            {chartData.map((item, index) => {
              const barHeight = Math.max((item.value / maxValue) * CHART_HEIGHT, 3);
              return (
                <View key={`${item.date}-${index}`} style={styles.barColumn}>
                  <Text style={styles.barValue} numberOfLines={1}>
                    {item.value >= 1000
                      ? `${(item.value / 1000).toFixed(1)}k`
                      : Math.round(item.value * 10) / 10}
                  </Text>
                  <Animated.View
                    entering={FadeIn.duration(motion.duration.base).delay(index * motion.stagger)}
                    style={styles.barWrapper}>
                    <LinearGradient
                      colors={gradient}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={[styles.bar, { height: barHeight }]}
                    />
                  </Animated.View>
                </View>
              );
            })}
          </View>
          <View style={styles.axis}>
            {chartData.map((item, index) => (
              <Text key={`${item.date}-${index}`} style={styles.axisLabel} numberOfLines={1}>
                {formatShortDate(item.date)}
              </Text>
            ))}
          </View>
          <Text style={styles.unitHint}>
            {unit}
            {target ? ` · dashed line = daily goal` : ''}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.subheading,
  },
  empty: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textFaint,
  },
  plotArea: {
    height: CHART_HEIGHT + 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: colors.textFaint,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  barValue: {
    ...typography.micro,
    color: colors.textMuted,
  },
  barWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    minWidth: 12,
    borderTopLeftRadius: radius.xs,
    borderTopRightRadius: radius.xs,
  },
  axis: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  axisLabel: {
    ...typography.micro,
    flex: 1,
    textAlign: 'center',
  },
  unitHint: {
    ...typography.micro,
    marginTop: spacing.xxs,
  },
});
