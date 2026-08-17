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
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { foodApi } from '@/api/food';
import { getApiErrorMessage } from '@/api/client';
import { BrandMark } from '@/components/BrandMark';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { GradientButton } from '@/components/GradientButton';
import { ProgressCard } from '@/components/ProgressCard';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { StatCard } from '@/components/StatCard';
import { colors, gradients, palette, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { FoodEntry, LoggedFood } from '@/types/api';
import { formatLongDate, formatTime } from '@/utils/date';
import { bmiCategory } from '@/utils/format';

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

  const weightDiff =
    user?.targetWeight && user?.currentWeight ? user.targetWeight - user.currentWeight : null;
  const bmi = user?.bmi ? parseFloat(user.bmi) : null;
  const bmiInfo = bmi ? bmiCategory(bmi) : null;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {/* Header */}
      <View style={styles.header}>
        <BrandMark withWordmark />
        <Pressable
          onPress={() => router.push('/reminders')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Reminders and notifications"
          style={({ pressed }) => [styles.bellButton, pressed && { opacity: 0.7 }]}>
          <Bell size={20} color={palette.gray600} />
        </Pressable>
      </View>

      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>Welcome back, {user?.username}</Text>
        <Text style={styles.greetingDate}>{formatLongDate()}</Text>
      </View>

      {/* Today's progress */}
      <SectionHeader title="Today's Progress" icon={Activity} />
      {loading ? (
        <View style={styles.progressList}>
          {[0, 1, 2].map((i) => (
            <Card key={i} style={{ gap: spacing.md }}>
              <Skeleton height={20} width="55%" />
              <Skeleton height={10} />
              <Skeleton height={12} width="35%" />
            </Card>
          ))}
        </View>
      ) : (
        <View style={styles.progressList}>
          <ProgressCard
            title="Calories"
            icon={Flame}
            consumed={todayEntry?.totalCalories ?? 0}
            target={user?.targetDailyCalories ?? 2000}
            unit="cal"
            gradient={gradients.calories}
          />
          <ProgressCard
            title="Protein"
            icon={Beef}
            consumed={todayEntry?.totalProtein ?? 0}
            target={user?.targetDailyProteins ?? 150}
            unit="g"
            gradient={gradients.protein}
          />
          <ProgressCard
            title="Water"
            icon={Droplets}
            consumed={todayEntry?.water ?? 0}
            target={user?.targetDailyWater ?? 2500}
            unit="ml"
            gradient={gradients.water}
          />
        </View>
      )}

      {/* Quick actions */}
      <View style={styles.quickActions}>
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
      </View>

      {/* Today's meals */}
      <SectionHeader
        title="Today's Meals"
        icon={UtensilsCrossed}
        right={
          <Pressable
            onPress={() => router.push('/log-food')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add food">
            <Plus size={20} color={palette.blue600} />
          </Pressable>
        }
      />
      <Card style={styles.mealsCard}>
        {loading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={48} />
            <Skeleton height={48} />
          </View>
        ) : todayEntry?.foods?.length ? (
          todayEntry.foods.map((food, index) => (
            <View
              key={food._id}
              style={[styles.mealRow, index > 0 && styles.mealRowBorder]}>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName} numberOfLines={1}>
                  {food.foodName}
                </Text>
                <Text style={styles.mealMeta}>
                  {formatTime(food.timestamp)} • {food.servingSize || `${food.quantity}g`}
                </Text>
                <View style={styles.mealMacros}>
                  <View style={styles.macroChip}>
                    <Flame size={12} color={palette.orange500} />
                    <Text style={styles.macroText}>{food.calories} cal</Text>
                  </View>
                  <View style={styles.macroChip}>
                    <Beef size={12} color={palette.red500} />
                    <Text style={styles.macroText}>{food.protein}g</Text>
                  </View>
                  <Text style={styles.macroFaint}>C {food.carbs}g</Text>
                  <Text style={styles.macroFaint}>F {food.fat}g</Text>
                </View>
              </View>
              <Pressable
                onPress={() => confirmDeleteFood(food)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${food.foodName}`}
                style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.6 }]}>
                <Trash2 size={17} color={palette.red500} />
              </Pressable>
            </View>
          ))
        ) : (
          <EmptyState
            icon={UtensilsCrossed}
            title="No meals logged yet"
            message="Tap “Add Food” to log your first meal of the day."
          />
        )}
      </Card>

      {/* Body stats */}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    marginBottom: spacing.xl,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  greetingDate: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickAction: {
    flex: 1,
  },
  mealsCard: {
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  mealRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  mealInfo: {
    flex: 1,
    gap: 3,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  mealMeta: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  mealMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 2,
  },
  macroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  macroText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  macroFaint: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  statsGrid: {
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
