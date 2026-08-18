import { useFocusEffect, useRouter } from 'expo-router';
import {
  Activity,
  Beef,
  Bell,
  Droplets,
  Flame,
  Plus,
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { foodApi } from '@/api/food';
import { getApiErrorMessage } from '@/api/client';
import { BrandMark } from '@/components/BrandMark';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { GoalRing } from '@/components/GoalRing';
import { GradientButton } from '@/components/GradientButton';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { StatCard } from '@/components/StatCard';
import {
  colors,
  gradients,
  layout,
  motion,
  palette,
  radius,
  spacing,
  typography,
} from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { FoodEntry, LoggedFood } from '@/types/api';
import { formatLongDate, formatTime } from '@/utils/date';
import { bmiCategory, progressPercent } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { enter } from '@/utils/motion';

export default function DashboardScreen() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [todayEntry, setTodayEntry] = useState<FoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);

  const fetchToday = useCallback(async () => {
    try {
      const entry = await foodApi.getToday();
      setTodayEntry(entry);
    } catch {
      // Keep the last known data; pull-to-refresh retries.
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh silently whenever the tab regains focus (e.g. after logging food).
  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnce.current) {
        hasLoadedOnce.current = true;
        setLoading(true);
      }
      void fetchToday();
    }, [fetchToday])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchToday(), refreshUser()]);
    setRefreshing(false);
  }, [fetchToday, refreshUser]);

  const confirmDeleteFood = (food: LoggedFood) => {
    Alert.alert('Remove food', `Remove ${food.foodName} from today's log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          haptics.warning();
          try {
            const entry = await foodApi.removeFood(food._id);
            setTodayEntry(entry);
            showToast(`${food.foodName} removed`);
          } catch (error) {
            showToast(getApiErrorMessage(error, 'Failed to remove food'), 'error');
          }
        },
      },
    ]);
  };

  const goals = [
    {
      key: 'calories',
      title: 'Calories',
      icon: Flame,
      consumed: todayEntry?.totalCalories ?? 0,
      target: user?.targetDailyCalories ?? 2000,
      unit: 'cal',
      gradient: gradients.calories,
    },
    {
      key: 'protein',
      title: 'Protein',
      icon: Beef,
      consumed: todayEntry?.totalProtein ?? 0,
      target: user?.targetDailyProteins ?? 150,
      unit: 'g',
      gradient: gradients.protein,
    },
    {
      key: 'water',
      title: 'Water',
      icon: Droplets,
      consumed: todayEntry?.water ?? 0,
      target: user?.targetDailyWater ?? 2500,
      unit: 'ml',
      gradient: gradients.water,
    },
  ] as const;

  const metKeys = goals
    .filter((g) => progressPercent(g.consumed, g.target) >= 100)
    .map((g) => g.key)
    .join(',');
  const metCount = metKeys ? metKeys.split(',').length : 0;

  // Celebrate a goal that flips to complete while the screen is open — never on
  // the first load, so opening the app on an already-met goal stays silent.
  const metKeysRef = useRef<string | null>(null);
  useEffect(() => {
    if (loading) return;
    const previous = metKeysRef.current;
    metKeysRef.current = metKeys;
    const newlyMet = metKeys
      .split(',')
      .filter(Boolean)
      .some((key) => previous !== null && !previous.includes(key));
    if (previous !== null && newlyMet) {
      haptics.success();
    }
  }, [loading, metKeys]);

  const weightDiff =
    user?.targetWeight && user?.currentWeight ? user.targetWeight - user.currentWeight : null;
  const bmi = user?.bmi ? parseFloat(user.bmi) : null;
  const bmiInfo = bmi ? bmiCategory(bmi) : null;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {/* Header: brand, greeting and reminders — one row instead of three. */}
      <Animated.View entering={enter(0)} style={styles.header}>
        <BrandMark size={34} />
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle} numberOfLines={1}>
            Hey, {user?.username}
          </Text>
          <Text style={styles.greetingDate} numberOfLines={1}>
            {formatLongDate()}
          </Text>
        </View>
        <PressableScale
          onPress={() => router.push('/reminders')}
          hitSlop={layout.hitSlop}
          haptic="selection"
          accessibilityLabel="Reminders and notifications"
          style={styles.bellButton}>
          <Bell size={layout.icon.lg} color={colors.textSecondary} />
        </PressableScale>
      </Animated.View>

      {/* Today's progress — three gradient rings in one card. */}
      <Animated.View entering={enter(1)}>
        <SectionHeader
          title="Today's Progress"
          icon={Activity}
          right={
            !loading ? (
              <Text style={styles.goalCount}>
                {metCount}/{goals.length} goals
              </Text>
            ) : undefined
          }
        />
        <Card style={styles.goalsCard}>
          {loading ? (
            <View style={styles.goalsRow}>
              {goals.map((goal) => (
                <View key={goal.key} style={styles.goalSkeleton}>
                  <Skeleton height={72} width={72} borderRadius={radius.full} />
                  <Skeleton height={12} width="60%" />
                  <Skeleton height={16} width="45%" />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.goalsRow}>
              {goals.map((goal) => (
                <GoalRing
                  key={goal.key}
                  title={goal.title}
                  icon={goal.icon}
                  consumed={goal.consumed}
                  target={goal.target}
                  unit={goal.unit}
                  gradient={goal.gradient}
                />
              ))}
            </View>
          )}
        </Card>
      </Animated.View>

      {/* Quick actions */}
      <Animated.View entering={enter(2)} style={styles.quickActions}>
        <GradientButton
          label="Add Food"
          icon={UtensilsCrossed}
          gradient={gradients.calories}
          onPress={() => router.push('/log-food')}
          style={styles.quickAction}
        />
        <GradientButton
          label="Add Water"
          icon={Droplets}
          gradient={gradients.water}
          onPress={() => router.push('/log-water')}
          style={styles.quickAction}
        />
      </Animated.View>

      {/* Today's meals */}
      <Animated.View entering={enter(3)}>
        <SectionHeader
          title="Today's Meals"
          icon={UtensilsCrossed}
          right={
            <PressableScale
              onPress={() => router.push('/log-food')}
              hitSlop={layout.hitSlop}
              accessibilityLabel="Add food"
              style={styles.addButton}>
              <Plus size={layout.icon.md} color={colors.primary} strokeWidth={layout.strokeWidth} />
            </PressableScale>
          }
        />
        <Card flush style={styles.mealsCard}>
          {loading ? (
            <View style={styles.mealsLoading}>
              <Skeleton height={40} />
              <Skeleton height={40} />
            </View>
          ) : todayEntry?.foods?.length ? (
            todayEntry.foods.map((food, index) => (
              <Animated.View
                key={food._id}
                entering={FadeIn.duration(motion.duration.base)}
                exiting={FadeOut.duration(motion.duration.fast)}
                layout={LinearTransition.duration(motion.duration.base)}
                style={[styles.mealRow, index > 0 && styles.mealRowBorder]}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName} numberOfLines={1}>
                    {food.foodName}
                  </Text>
                  <Text style={styles.mealMeta} numberOfLines={1}>
                    {formatTime(food.timestamp)} · {food.servingSize || `${food.quantity}g`} · P{' '}
                    {food.protein}g · C {food.carbs}g · F {food.fat}g
                  </Text>
                </View>
                <View style={styles.mealCalories}>
                  <Flame size={layout.icon.sm} color={palette.orange500} />
                  <Text style={styles.mealCaloriesValue}>{food.calories}</Text>
                </View>
                <PressableScale
                  onPress={() => confirmDeleteFood(food)}
                  hitSlop={layout.hitSlop}
                  haptic="none"
                  accessibilityLabel={`Remove ${food.foodName}`}
                  style={styles.deleteButton}>
                  <Trash2 size={layout.icon.md} color={colors.textFaint} />
                </PressableScale>
              </Animated.View>
            ))
          ) : (
            <EmptyState
              compact
              icon={UtensilsCrossed}
              title="No meals logged yet"
              message="Tap “Add Food” to log your first meal of the day."
            />
          )}
        </Card>
      </Animated.View>

      {/* Body stats */}
      <Animated.View entering={enter(4)}>
        <SectionHeader title="Your Stats" icon={Scale} />
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              title="Current Weight"
              value={user?.currentWeight ? `${user.currentWeight} kg` : 'N/A'}
              icon={Scale}
              color={palette.blue600}
              bgColor={palette.blue100}
            />
            <StatCard
              title="Target Weight"
              value={user?.targetWeight ? `${user.targetWeight} kg` : 'N/A'}
              icon={Target}
              color={palette.emerald600}
              bgColor={palette.emerald100}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title="Weight Goal"
              value={weightDiff !== null ? `${Math.abs(weightDiff).toFixed(1)} kg` : 'N/A'}
              subtitle={weightDiff !== null ? (weightDiff < 0 ? 'to lose' : 'to gain') : undefined}
              icon={weightDiff !== null && weightDiff < 0 ? TrendingDown : TrendingUp}
              color={weightDiff !== null && weightDiff < 0 ? palette.red600 : palette.amber600}
              bgColor={weightDiff !== null && weightDiff < 0 ? palette.red100 : palette.amber100}
            />
            <StatCard
              title="BMI"
              value={user?.bmi ?? 'N/A'}
              subtitle={bmiInfo?.text}
              icon={Activity}
              color={palette.purple600}
              bgColor={palette.purple100}
            />
          </View>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  greeting: {
    flex: 1,
  },
  greetingTitle: {
    ...typography.title,
  },
  greetingDate: {
    ...typography.caption,
  },
  bellButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: layout.border,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCount: {
    ...typography.captionStrong,
  },
  goalsCard: {
    marginBottom: spacing.lg,
  },
  goalsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  goalSkeleton: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickAction: {
    flex: 1,
  },
  addButton: {
    width: layout.iconTile.md,
    height: layout.iconTile.md,
    borderRadius: radius.full,
    backgroundColor: colors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealsCard: {
    marginBottom: spacing.lg,
    paddingHorizontal: layout.cardPadding,
  },
  mealsLoading: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    minHeight: layout.tapTarget,
  },
  mealRowBorder: {
    borderTopWidth: layout.hairline,
    borderTopColor: colors.divider,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    ...typography.bodyStrong,
  },
  mealMeta: {
    ...typography.caption,
  },
  mealCalories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mealCaloriesValue: {
    ...typography.numberSm,
  },
  deleteButton: {
    width: layout.iconTile.sm,
    height: layout.iconTile.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
