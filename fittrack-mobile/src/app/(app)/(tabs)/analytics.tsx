import {
  Activity,
  Award,
  BarChart3,
  CalendarDays,
  Droplets,
  Flame,
  Heart,
  Target,
  Trophy,
  UtensilsCrossed,
  Zap,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { foodApi } from '@/api/food';
import { BarChart } from '@/components/BarChart';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { colors, gradients, palette, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { AnalyticsData } from '@/types/api';
import { formatShortDate } from '@/utils/date';
import { formatNumber, progressPercent, rawPercent } from '@/utils/format';

const PERIODS = [7, 14, 30] as const;

interface AnalyticsResult {
  days: number;
  data: AnalyticsData | null;
}

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<number>(7);
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Loading state is derived: we're loading until we hold data for the
  // currently selected period (avoids sync setState inside effects).
  const loading = result?.days !== period;
  const analytics = result?.days === period ? result.data : null;

  const fetchAnalytics = useCallback(async (days: number) => {
    try {
      const data = await foodApi.getAnalytics(days);
      setResult({ days, data });
    } catch {
      // Mark the period as loaded so the empty state shows; refresh retries.
      setResult((prev) => (prev?.days === days ? prev : { days, data: null }));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- all setState calls happen after an await, never synchronously
    void fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalytics(period);
    setRefreshing(false);
  }, [fetchAnalytics, period]);

  /** Chart entries oldest → newest (API returns newest first). */
  const chronological = useMemo(
    () => (analytics ? [...analytics.entries].reverse() : []),
    [analytics]
  );

  const streaks = useMemo(() => {
    if (!analytics) return { current: 0, best: 0 };
    // Newest → oldest, counting consecutive days with any food logged.
    let current = 0;
    let best = 0;
    let run = 0;
    const sorted = [...analytics.entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    sorted.forEach((entry, index) => {
      if (entry.foodCount > 0) {
        run += 1;
        if (index === run - 1) current = run;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    });
    return { current, best };
  }, [analytics]);

  const hasData = !!analytics && analytics.summary.totalEntries > 0;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Insights from your nutrition history</Text>
      </View>

      <View style={styles.periodRow}>
        {PERIODS.map((option) => (
          <Chip
            key={option}
            label={`${option} days`}
            selected={period === option}
            onPress={() => setPeriod(option)}
            selectedColor={palette.indigo600}
            style={styles.periodChip}
          />
        ))}
      </View>

      {loading ? (
        <View style={{ gap: spacing.md }}>
          <View style={styles.grid2}>
            <Skeleton height={110} borderRadius={radius.lg} width="48%" />
            <Skeleton height={110} borderRadius={radius.lg} width="48%" />
          </View>
          <Skeleton height={110} borderRadius={radius.lg} />
          <Skeleton height={180} borderRadius={radius.lg} />
        </View>
      ) : !hasData ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="No analytics data yet"
            message="Start logging meals and water to unlock charts, goal insights and streaks."
          />
        </Card>
      ) : (
        analytics && (
          <>
            {/* Averages */}
            <View style={styles.grid2}>
              <AverageCard
                title="Avg Calories"
                value={formatNumber(analytics.summary.avgCalories)}
                unit="cal"
                percent={rawPercent(analytics.summary.avgCalories, user?.targetDailyCalories ?? 0)}
                icon={Flame}
                color={palette.orange600}
                bg={palette.orange100}
              />
              <AverageCard
                title="Avg Protein"
                value={`${analytics.summary.avgProtein}`}
                unit="g"
                percent={rawPercent(analytics.summary.avgProtein, user?.targetDailyProteins ?? 0)}
                icon={Heart}
                color={palette.red600}
                bg={palette.red100}
              />
              <AverageCard
                title="Avg Water"
                value={formatNumber(analytics.summary.avgWater)}
                unit="ml"
                percent={rawPercent(analytics.summary.avgWater, user?.targetDailyWater ?? 0)}
                icon={Droplets}
                color={palette.blue600}
                bg={palette.blue100}
              />
              <AverageCard
                title="Active Days"
                value={`${analytics.summary.totalEntries}`}
                unit={`/ ${analytics.period.days}`}
                icon={CalendarDays}
                color={palette.emerald600}
                bg={palette.emerald100}
              />
            </View>

            {/* Streaks */}
            <Card style={styles.streakCard}>
              <SectionHeader title="Tracking Streaks" icon={Zap} iconColor={palette.orange500} />
              <View style={styles.streakRow}>
                <View style={[styles.streakTile, { backgroundColor: '#FFF7ED' }]}>
                  <View style={styles.streakValueRow}>
                    <Activity size={16} color={palette.orange500} />
                    <Text style={[styles.streakValue, { color: palette.orange600 }]}>
                      {streaks.current}
                    </Text>
                  </View>
                  <Text style={styles.streakLabel}>Current</Text>
                  <Text style={styles.streakUnit}>days</Text>
                </View>
                <View style={[styles.streakTile, { backgroundColor: '#ECFDF5' }]}>
                  <View style={styles.streakValueRow}>
                    <Trophy size={16} color={palette.emerald500} />
                    <Text style={[styles.streakValue, { color: palette.emerald600 }]}>
                      {streaks.best}
                    </Text>
                  </View>
                  <Text style={styles.streakLabel}>Best</Text>
                  <Text style={styles.streakUnit}>days</Text>
                </View>
              </View>
            </Card>

            {/* Best days */}
            <SectionHeader title="Best Days" icon={Award} iconColor={palette.amber600} />
            <View style={styles.bestRow}>
              {analytics.bestDays.calories && (
                <BestDayCard
                  label="Calories"
                  value={`${analytics.bestDays.calories.value}`}
                  unit="cal"
                  date={analytics.bestDays.calories.date}
                  color={palette.orange600}
                />
              )}
              {analytics.bestDays.protein && (
                <BestDayCard
                  label="Protein"
                  value={`${analytics.bestDays.protein.value}`}
                  unit="g"
                  date={analytics.bestDays.protein.date}
                  color={palette.red600}
                />
              )}
              {analytics.bestDays.water && (
                <BestDayCard
                  label="Hydration"
                  value={`${analytics.bestDays.water.value}`}
                  unit="ml"
                  date={analytics.bestDays.water.date}
                  color={palette.blue600}
                />
              )}
            </View>

            {/* Trend charts */}
            <SectionHeader title="Trends" icon={BarChart3} />
            <View style={styles.chartList}>
              <BarChart
                title="Calories"
                icon={Flame}
                gradient={gradients.calories}
                unit="cal / day"
                target={user?.targetDailyCalories}
                data={chronological.map((e) => ({ date: e.date, value: e.calories }))}
              />
              <BarChart
                title="Protein"
                icon={Heart}
                gradient={gradients.protein}
                unit="g / day"
                target={user?.targetDailyProteins}
                data={chronological.map((e) => ({ date: e.date, value: e.protein }))}
              />
              <BarChart
                title="Water Intake"
                icon={Droplets}
                gradient={gradients.water}
                unit="ml / day"
                target={user?.targetDailyWater}
                data={chronological.map((e) => ({ date: e.date, value: e.water }))}
              />
              <BarChart
                title="Food Items"
                icon={UtensilsCrossed}
                gradient={gradients.history}
                unit="items / day"
                data={chronological.map((e) => ({ date: e.date, value: e.foodCount }))}
              />
            </View>

            {/* Key insights */}
            <Card style={styles.insightsCard}>
              <SectionHeader title="Key Insights" icon={BarChart3} />
              <View style={styles.insightRows}>
                <InsightRow
                  label="Total calories"
                  value={formatNumber(analytics.summary.totalCalories)}
                />
                <InsightRow
                  label="Total protein"
                  value={`${formatNumber(Math.round(analytics.summary.totalProtein))}g`}
                />
                <InsightRow
                  label="Total water"
                  value={`${formatNumber(analytics.summary.totalWater)}ml`}
                />
                <InsightRow
                  label="Active days"
                  value={`${analytics.summary.totalEntries}/${analytics.period.days}`}
                />
              </View>

              <View style={styles.goalBlock}>
                <View style={styles.goalHeader}>
                  <Target size={15} color={palette.gray600} />
                  <Text style={styles.goalTitle}>Goal Achievement (averages)</Text>
                </View>
                <GoalBar
                  label="Calories"
                  percent={progressPercent(
                    analytics.summary.avgCalories,
                    user?.targetDailyCalories ?? 0
                  )}
                  raw={rawPercent(analytics.summary.avgCalories, user?.targetDailyCalories ?? 0)}
                  gradient={gradients.calories}
                />
                <GoalBar
                  label="Protein"
                  percent={progressPercent(
                    analytics.summary.avgProtein,
                    user?.targetDailyProteins ?? 0
                  )}
                  raw={rawPercent(analytics.summary.avgProtein, user?.targetDailyProteins ?? 0)}
                  gradient={gradients.protein}
                />
                <GoalBar
                  label="Water"
                  percent={progressPercent(analytics.summary.avgWater, user?.targetDailyWater ?? 0)}
                  raw={rawPercent(analytics.summary.avgWater, user?.targetDailyWater ?? 0)}
                  gradient={gradients.water}
                />
              </View>
            </Card>
          </>
        )
      )}
    </Screen>
  );
}

function AverageCard({
  title,
  value,
  unit,
  percent,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string;
  unit: string;
  percent?: number;
  icon: typeof Flame;
  color: string;
  bg: string;
}) {
  return (
    <Card style={avgStyles.card}>
      <View style={avgStyles.header}>
        <Text style={avgStyles.title}>{title}</Text>
        <View style={[avgStyles.iconBox, { backgroundColor: bg }]}>
          <Icon size={15} color={color} />
        </View>
      </View>
      <View style={avgStyles.valueRow}>
        <Text style={[avgStyles.value, { color }]}>{value}</Text>
        <Text style={avgStyles.unit}>{unit}</Text>
      </View>
      {percent !== undefined && percent > 0 && (
        <View style={avgStyles.percentBadge}>
          <Target size={11} color={palette.gray600} />
          <Text style={avgStyles.percentText}>{percent}% of goal</Text>
        </View>
      )}
    </Card>
  );
}

function BestDayCard({
  label,
  value,
  unit,
  date,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  date: string;
  color: string;
}) {
  return (
    <Card style={bestStyles.card}>
      <Text style={bestStyles.label}>{label}</Text>
      <View style={bestStyles.valueRow}>
        <Text style={[bestStyles.value, { color }]}>{value}</Text>
        <Text style={bestStyles.unit}>{unit}</Text>
      </View>
      <Text style={bestStyles.date}>{formatShortDate(date)}</Text>
    </Card>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={insightStyles.row}>
      <Text style={insightStyles.label}>{label}</Text>
      <Text style={insightStyles.value}>{value}</Text>
    </View>
  );
}

function GoalBar({
  label,
  percent,
  raw,
  gradient,
}: {
  label: string;
  percent: number;
  raw: number;
  gradient: readonly [string, string];
}) {
  return (
    <View style={goalStyles.container}>
      <View style={goalStyles.labelRow}>
        <Text style={goalStyles.label}>{label}</Text>
        <Text style={goalStyles.percent}>{raw}%</Text>
      </View>
      <ProgressBar percentage={percent} height={7} gradient={gradient} />
    </View>
  );
}

const avgStyles = StyleSheet.create({
  card: {
    width: '48.4%',
    gap: spacing.sm,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    flex: 1,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 21,
    fontWeight: '800',
  },
  unit: {
    fontSize: 12,
    color: colors.textMuted,
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.gray100,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

const bestStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    gap: 2,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
  },
  unit: {
    fontSize: 11,
    color: colors.textMuted,
  },
  date: {
    fontSize: 11,
    color: colors.textFaint,
  },
});

const insightStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
});

const goalStyles = StyleSheet.create({
  container: {
    gap: 5,
    marginTop: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  percent: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  periodChip: {
    flex: 1,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  streakCard: {
    marginBottom: spacing.xl,
  },
  streakRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  streakTile: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    gap: 1,
  },
  streakValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  streakValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  streakUnit: {
    fontSize: 11,
    color: colors.textMuted,
  },
  bestRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  chartList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  insightsCard: {
    marginBottom: spacing.lg,
  },
  insightRows: {
    marginBottom: spacing.md,
  },
  goalBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.md,
    gap: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
