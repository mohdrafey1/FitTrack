import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { colors, palette, spacing, type Gradient } from '@/constants/theme';
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

const CHART_HEIGHT = 132;

/** Lightweight dependency-free bar chart matching the web app's trend charts. */
export function BarChart({ title, icon: Icon, gradient, data, unit, target }: BarChartProps) {
  const chartData = data.slice(-7);
  const values = chartData.map((d) => d.value);
  const maxValue = Math.max(...values, target ?? 0, 1);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Icon size={16} color={palette.gray600} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <TrendingUp size={16} color={palette.gray400} />
      </View>

      {chartData.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      ) : (
        <View>
          <View style={styles.plotArea}>
            {target !== undefined && target > 0 && target <= maxValue && (
              <View
                style={[
                  styles.targetLine,
                  { bottom: (target / maxValue) * CHART_HEIGHT },
                ]}
              />
            )}
            {chartData.map((item, index) => {
              const barHeight = Math.max((item.value / maxValue) * CHART_HEIGHT, 4);
              return (
                <View key={`${item.date}-${index}`} style={styles.barColumn}>
                  <Text style={styles.barValue} numberOfLines={1}>
                    {item.value >= 1000
                      ? `${(item.value / 1000).toFixed(1)}k`
                      : Math.round(item.value * 10) / 10}
                  </Text>
                  <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[styles.bar, { height: barHeight }]}
                  />
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
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  empty: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textFaint,
  },
  plotArea: {
    height: CHART_HEIGHT + 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderColor: palette.gray400,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  barValue: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  bar: {
    width: '68%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minWidth: 14,
  },
  axis: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  axisLabel: {
    flex: 1,
    fontSize: 9.5,
    color: colors.textFaint,
    textAlign: 'center',
  },
  unitHint: {
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 2,
  },
});
