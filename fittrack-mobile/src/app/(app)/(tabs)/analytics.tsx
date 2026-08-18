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
import Animated from 'react-native-reanimated';

import { foodApi } from '@/api/food';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { BarChart } from '@/components/BarChart';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import {
  colors,
  gradients,
  layout,
  palette,
  radius,
  spacing,
  typography,
  type Gradient,
} from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { AnalyticsData } from '@/types/api';
import { formatShortDate } from '@/utils/date';
import { formatNumber, progressPercent, rawPercent } from '@/utils/format';
import { enter } from '@/utils/motion';

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
      <Animated.View entering={enter(0)}>
        <ScreenTitle title="Analytics" subtitle="Insights from your nutrition history" />

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
      </Animated.View>

      {loading ? (
        <View style={styles.loadingList}>
          <View style={styles.grid2}>
            <Skeleton height={86} borderRadius={radius.lg} width="48.4%" />
            <Skeleton height={86} borderRadius={radius.lg} width="48.4%" />
            <Skeleton height={86} borderRadius={radius.lg} width="48.4%" />
            <Skeleton height={86} borderRadius={radius.lg} width="48.4%" />
          </View>
          <Skeleton height={104} borderRadius={radius.lg} />
          <Skeleton height={168} borderRadius={radius.lg} />
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
            <Animated.View entering={enter(1)} style={styles.grid2}>
              <AverageCard
                title="Avg Calories"
                value={analytics.summary.avgCalories}
                unit="cal"
                percent={rawPercent(analytics.summary.avgCalories, user?.targetDailyCalories ?? 0)}
                icon={Flame}
                color={palette.orange600}
                bg={palette.orange100}
              />
              <AverageCard
                title="Avg Protein"
                value={analytics.summary.avgProtein}
                unit="g"
                percent={rawPercent(analytics.summary.avgProtein, user?.targetDailyProteins ?? 0)}
                icon={Heart}
                color={palette.red600}
                bg={palette.red100}
              />
              <AverageCard
                title="Avg Water"
                value={analytics.summary.avgWater}
                unit="ml"
                percent={rawPercent(analytics.summary.avgWater, user?.targetDailyWater ?? 0)}
                icon={Droplets}
                color={palette.blue600}
                bg={palette.blue100}
              />
              <AverageCard
                title="Active Days"
                value={analytics.summary.totalEntries}
                unit={`/ ${analytics.period.days}`}
                icon={CalendarDays}
                color={palette.emerald600}
                bg={palette.emerald100}
              />
            </Animated.View>

            {/* Streaks */}
            <Animated.View entering={enter(2)}>
              <Card style={styles.streakCard}>
                <SectionHeader title="Tracking Streaks" icon={Zap} iconColor={palette.orange500} />
                <View style={styles.streakRow}>
                  <View style={[styles.streakTile, { backgroundColor: palette.orange100 }]}>
                    <View style={styles.streakValueRow}>
                      <Activity size={layout.icon.sm} color={palette.orange500} />
                      <AnimatedNumber
                        value={streaks.current}
                        style={[styles.streakValue, { color: palette.orange600 }]}
                      />
                    </View>
                    <Text style={styles.streakLabel}>Current</Text>
                    <Text style={styles.streakUnit}>days</Text>
                  </View>
                  <View style={[styles.streakTile, { backgroundColor: palette.emerald100 }]}>
                    <View style={styles.streakValueRow}>
                      <Trophy size={layout.icon.sm} color={palette.emerald500} />
                      <AnimatedNumber
                        value={streaks.best}
                        style={[styles.streakValue, { color: palette.emerald600 }]}
                      />
                    </View>
                    <Text style={styles.streakLabel}>Best</Text>
                    <Text style={styles.streakUnit}>days</Text>
                  </View>
                </View>
              </Card>
            </Animated.View>

            {/* Best days */}
            <Animated.View entering={enter(3)}>
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
            </Animated.View>

            {/* Trend charts */}
            <Animated.View entering={enter(4)}>
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
            </Animated.View>

            {/* Key insights */}
            <Animated.View entering={enter(5)}>
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
                    <Target size={layout.icon.sm} color={colors.textMuted} />
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
                    percent={progressPercent(
                      analytics.summary.avgWater,
                      user?.targetDailyWater ?? 0
                    )}
                    raw={rawPercent(analytics.summary.avgWater, user?.targetDailyWater ?? 0)}
                    gradient={gradients.water}
                  />
                </View>
              </Card>
            </Animated.View>
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
  value: number;
  unit: string;
  percent?: number;
  icon: typeof Flame;
  color: string;
  bg: string;
}) {
  return (
    <Card compact style={avgStyles.card}>
      <View style={avgStyles.header}>
        <View style={[avgStyles.iconBox, { backgroundColor: bg }]}>
          <Icon size={layout.icon.sm} color={color} strokeWidth={layout.strokeWidth} />
        </View>
        <Text style={avgStyles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={avgStyles.valueRow}>
        <AnimatedNumber value={value} style={[avgStyles.value, { color }]} numberOfLines={1} />
        <Text style={avgStyles.unit} numberOfLines={1}>
          {unit}
        </Text>
        {percent !== undefined && percent > 0 && (
          <Text style={avgStyles.percentText} numberOfLines={1}>
            {percent}% of goal
          </Text>
        )}
      </View>
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
    <Card compact style={bestStyles.card}>
      <Text style={bestStyles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={bestStyles.valueRow}>
        <Text style={[bestStyles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={bestStyles.unit}>{unit}</Text>
      </View>
      <Text style={bestStyles.date} numberOfLines={1}>
        {formatShortDate(date)}
      </Text>
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
  gradient: Gradient;
}) {
  return (
    <View style={goalStyles.container}>
      <View style={goalStyles.labelRow}>
        <Text style={goalStyles.label}>{label}</Text>
        <Text style={goalStyles.percent}>{raw}%</Text>
      </View>
      <ProgressBar percentage={percent} height={6} gradient={gradient} />
    </View>
  );
}

const avgStyles = StyleSheet.create({
  card: {
    width: '48.4%',
    gap: spacing.sm,
  },
  header: {
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
  },
  unit: {
    ...typography.caption,
  },
  percentText: {
    ...typography.micro,
    marginLeft: 'auto',
  },
});

const bestStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textMuted,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xxs,
  },
  value: {
    ...typography.numberMd,
  },
  unit: {
    ...typography.micro,
  },
  date: {
    ...typography.micro,
  },
});

const insightStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.label,
  },
  value: {
    ...typography.labelStrong,
    color: colors.text,
  },
});

const goalStyles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  percent: {
    ...typography.captionStrong,
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  periodChip: {
    flex: 1,
  },
  loadingList: {
    gap: spacing.md,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  streakCard: {
    marginBottom: spacing.lg,
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
  },
  streakValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakValue: {
    ...typography.numberLg,
  },
  streakLabel: {
    ...typography.captionStrong,
  },
  streakUnit: {
    ...typography.micro,
  },
  bestRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  chartList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  insightsCard: {
    marginBottom: spacing.lg,
  },
  insightRows: {
    marginBottom: spacing.sm,
  },
  goalBlock: {
    borderTopWidth: layout.hairline,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  goalTitle: {
    ...typography.labelStrong,
  },
});
