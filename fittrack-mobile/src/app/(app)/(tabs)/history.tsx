import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import {
  Beef,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  Flame,
  Search,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { getApiErrorMessage } from '@/api/client';
import { foodApi } from '@/api/food';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import {
  colors,
  gradients,
  layout,
  motion,
  palette,
  progressGradient,
  radius,
  spacing,
  typography,
  type Gradient,
} from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { FoodEntry, LoggedFood } from '@/types/api';
import {
  formatDisplayDate,
  formatTime,
  getUTCDateString,
  isTodayUTC,
  shiftUTCDate,
} from '@/utils/date';
import { formatWater, progressPercent, rawPercent } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { enter } from '@/utils/motion';

const RANGE_OPTIONS = [3, 7, 14, 30] as const;
const QUICK_WATER = [250, 500, 750, 1000] as const;

export default function HistoryScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [range, setRange] = useState<number>(7);
  const [entriesResult, setEntriesResult] = useState<{ range: number; list: FoodEntry[] } | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState(getUTCDateString());
  const [entryResult, setEntryResult] = useState<{ date: string; entry: FoodEntry | null } | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [waterBusy, setWaterBusy] = useState(false);

  // Loading states are derived from whether the held data matches the current
  // selection (avoids sync setState inside effects).
  const entriesLoading = entriesResult?.range !== range;
  const entries = entriesResult?.range === range ? entriesResult.list : [];
  const entryLoading = entryResult?.date !== selectedDate;
  const selectedEntry = entryResult?.date === selectedDate ? entryResult.entry : null;

  const fetchEntries = useCallback(async (days: number) => {
    try {
      const data = await foodApi.getHistory(days);
      // De-duplicate by date (defensive — mirrors the web app).
      const seen = new Set<string>();
      const unique = data.filter((entry) => {
        const key = entry.date.split('T')[0];
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setEntriesResult({ range: days, list: unique });
    } catch {
      // Mark as loaded (empty) so the UI settles; pull-to-refresh retries.
      setEntriesResult((prev) => (prev?.range === days ? prev : { range: days, list: [] }));
    }
  }, []);

  const fetchSelectedEntry = useCallback(async (date: string) => {
    try {
      const entry = await foodApi.getByDate(date);
      setEntryResult({ date, entry });
    } catch {
      setEntryResult((prev) => (prev?.date === date ? prev : { date, entry: null }));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- all setState calls happen after an await, never synchronously
    void fetchEntries(range);
  }, [range, fetchEntries]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- all setState calls happen after an await, never synchronously
    void fetchSelectedEntry(selectedDate);
  }, [selectedDate, fetchSelectedEntry]);

  /** Select a day and reset the food search. */
  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setSearchTerm('');
  }, []);

  // Silent refresh when the tab regains focus (food logged from dashboard, etc.)
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void fetchEntries(range);
      void fetchSelectedEntry(selectedDate);
    }, [fetchEntries, fetchSelectedEntry, range, selectedDate])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchEntries(range), fetchSelectedEntry(selectedDate)]);
    setRefreshing(false);
  }, [fetchEntries, fetchSelectedEntry, range, selectedDate]);

  const applyUpdatedEntry = useCallback((entry: FoodEntry) => {
    setEntryResult((prev) => (prev ? { ...prev, entry } : prev));
    setEntriesResult((prev) =>
      prev ? { ...prev, list: prev.list.map((e) => (e._id === entry._id ? entry : e)) } : prev
    );
  }, []);

  const handleWaterChange = async (amount: number) => {
    if (waterBusy) return;
    setWaterBusy(true);
    try {
      const entry = await foodApi.updateWater(amount);
      applyUpdatedEntry(entry);
      haptics.light();
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Failed to update water'), 'error');
    } finally {
      setWaterBusy(false);
    }
  };

  const confirmDeleteFood = (food: LoggedFood) => {
    Alert.alert('Remove food', `Remove ${food.foodName}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          haptics.warning();
          try {
            const entry = await foodApi.removeFood(food._id);
            applyUpdatedEntry(entry);
            showToast(`${food.foodName} removed`);
          } catch (error) {
            showToast(getApiErrorMessage(error, 'Failed to remove food'), 'error');
          }
        },
      },
    ]);
  };

  const handleDatePicked = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && date) {
      // The picker returns a local date — read its local Y/M/D as the intended day.
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      selectDate(`${y}-${m}-${d}`);
    }
  };

  const isToday = isTodayUTC(selectedDate);
  const filteredFoods = useMemo(
    () =>
      selectedEntry?.foods.filter((f) =>
        f.foodName.toLowerCase().includes(searchTerm.toLowerCase())
      ) ?? [],
    [selectedEntry, searchTerm]
  );

  const targets = {
    calories: user?.targetDailyCalories ?? 2000,
    protein: user?.targetDailyProteins ?? 150,
    water: user?.targetDailyWater ?? 2500,
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Animated.View entering={enter(0)}>
        <ScreenTitle title="Food History" subtitle="Track your nutrition journey" />

        {/* Recent days strip */}
        <SectionHeader
          title="Recent Days"
          icon={CalendarDays}
          right={
            <View style={styles.rangeRow}>
              {RANGE_OPTIONS.map((option) => (
                <PressableScale
                  key={option}
                  onPress={() => setRange(option)}
                  haptic="selection"
                  hitSlop={spacing.sm}
                  accessibilityLabel={`Show last ${option} days`}
                  accessibilityState={{ selected: range === option }}
                  style={[styles.rangePill, range === option && styles.rangePillActive]}>
                  <Text style={[styles.rangeText, range === option && styles.rangeTextActive]}>
                    {option}d
                  </Text>
                </PressableScale>
              ))}
            </View>
          }
        />
      </Animated.View>

      {entriesLoading ? (
        <View style={styles.dayStripSkeleton}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={78} width={124} borderRadius={radius.lg} />
          ))}
        </View>
      ) : entries.length > 0 ? (
        <Animated.View entering={enter(1)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayStripScroll}
            contentContainerStyle={styles.dayStrip}>
            {entries.map((entry) => {
              const dateKey = entry.date.split('T')[0];
              const selected = dateKey === selectedDate;
              return (
                <PressableScale
                  key={entry._id}
                  onPress={() => selectDate(dateKey)}
                  haptic="selection"
                  accessibilityLabel={`Show ${formatDisplayDate(dateKey)}`}
                  accessibilityState={{ selected }}
                  style={[styles.dayCard, selected && styles.dayCardSelected]}>
                  <View style={styles.dayCardHeader}>
                    <Text style={[styles.dayCardDate, selected && styles.dayCardDateSelected]}>
                      {formatDisplayDate(dateKey)}
                    </Text>
                    <View style={styles.dayCardCount}>
                      <UtensilsCrossed size={layout.icon.xs} color={colors.textFaint} />
                      <Text style={styles.dayCardCountText}>{entry.foods.length}</Text>
                    </View>
                  </View>
                  <View style={styles.dayCardBadges}>
                    <MiniBadge
                      label="Cal"
                      percent={progressPercent(entry.totalCalories, targets.calories)}
                    />
                    <MiniBadge
                      label="Pro"
                      percent={progressPercent(entry.totalProtein, targets.protein)}
                    />
                    <MiniBadge label="H₂O" percent={progressPercent(entry.water, targets.water)} />
                  </View>
                </PressableScale>
              );
            })}
          </ScrollView>
        </Animated.View>
      ) : (
        <Card style={styles.emptyDaysCard}>
          <EmptyState
            compact
            icon={CalendarDays}
            title="No entries found"
            message="Days you log food or water will appear here."
          />
        </Card>
      )}

      {/* Selected day */}
      <Animated.View entering={enter(2)}>
        <Card style={styles.selectedDayCard}>
          <View style={styles.dateNav}>
            <PressableScale
              onPress={() => selectDate(shiftUTCDate(selectedDate, -1))}
              haptic="selection"
              hitSlop={layout.hitSlop}
              accessibilityLabel="Previous day"
              style={styles.dateNavButton}>
              <ChevronLeft size={layout.icon.lg} color={colors.textSecondary} />
            </PressableScale>
            <PressableScale
              onPress={() => setShowDatePicker(true)}
              haptic="selection"
              accessibilityLabel="Pick a date"
              style={styles.dateNavLabel}>
              <CalendarDays size={layout.icon.md} color={palette.indigo600} />
              <Text style={styles.dateNavText}>
                {isToday ? 'Today' : formatDisplayDate(selectedDate)}
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => selectDate(shiftUTCDate(selectedDate, 1))}
              disabled={isToday}
              haptic="selection"
              hitSlop={layout.hitSlop}
              accessibilityLabel="Next day"
              style={[styles.dateNavButton, isToday && styles.dateNavButtonDisabled]}>
              <ChevronRight size={layout.icon.lg} color={colors.textSecondary} />
            </PressableScale>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(`${selectedDate}T12:00:00`)}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              maximumDate={new Date()}
              onChange={(event, date) => {
                if (Platform.OS === 'ios') setShowDatePicker(false);
                handleDatePicked(event, date);
              }}
              themeVariant="light"
            />
          )}

          {entryLoading ? (
            <View style={styles.summaryRow}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={78} width="31%" borderRadius={radius.md} />
              ))}
            </View>
          ) : selectedEntry ? (
            <View style={styles.summaryRow}>
              <SummaryTile
                icon={Flame}
                gradient={gradients.calories}
                value={`${selectedEntry.totalCalories}`}
                label="Calories"
                percentLabel={`${rawPercent(selectedEntry.totalCalories, targets.calories)}% of goal`}
              />
              <SummaryTile
                icon={Beef}
                gradient={gradients.protein}
                value={`${selectedEntry.totalProtein}g`}
                label="Protein"
                percentLabel={`${rawPercent(selectedEntry.totalProtein, targets.protein)}% of goal`}
              />
              <SummaryTile
                icon={Droplets}
                gradient={gradients.water}
                value={formatWater(selectedEntry.water)}
                label="Water"
                percentLabel={`${rawPercent(selectedEntry.water, targets.water)}% of goal`}
              />
            </View>
          ) : (
            <Text style={styles.errorText}>{"Couldn't load this day. Pull to refresh."}</Text>
          )}
        </Card>
      </Animated.View>

      {/* Water tracker (today only — backend only mutates today's entry) */}
      {isToday && selectedEntry && (
        <Animated.View entering={enter(3)}>
          <Card style={styles.waterCard}>
            <SectionHeader title="Water Tracker" icon={Droplets} iconColor={palette.blue600} />
            <View style={styles.waterQuickRow}>
              {QUICK_WATER.map((amount) => (
                <Chip
                  key={amount}
                  label={`+${amount}`}
                  sublabel="ml"
                  selected={false}
                  onPress={() => handleWaterChange(amount)}
                  style={styles.waterChip}
                />
              ))}
            </View>
            <View style={styles.waterStepperRow}>
              <PressableScale
                onPress={() => handleWaterChange(-250)}
                disabled={waterBusy || (selectedEntry.water ?? 0) < 250}
                haptic="none"
                accessibilityLabel="Remove 250 ml"
                style={[
                  styles.stepperButton,
                  styles.stepperMinus,
                  ((selectedEntry.water ?? 0) < 250 || waterBusy) && styles.stepperDisabled,
                ]}>
                <Text style={styles.stepperMinusText}>−250ml</Text>
              </PressableScale>
              <PressableScale
                onPress={() => handleWaterChange(250)}
                disabled={waterBusy}
                haptic="none"
                accessibilityLabel="Add 250 ml"
                style={[styles.stepperButton, styles.stepperPlus, waterBusy && styles.stepperBusy]}>
                <Text style={styles.stepperPlusText}>+250ml</Text>
              </PressableScale>
            </View>
          </Card>
        </Animated.View>
      )}

      {/* Food list */}
      <Animated.View entering={enter(4)}>
        <Card style={styles.foodsCard}>
          <SectionHeader title="Food Items" icon={UtensilsCrossed} />
          {!!selectedEntry?.foods.length && (
            <Input
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search foods..."
              containerStyle={styles.searchField}
            />
          )}

          {entryLoading ? (
            <View style={styles.foodsLoading}>
              <Skeleton height={44} />
              <Skeleton height={44} />
            </View>
          ) : filteredFoods.length > 0 ? (
            filteredFoods.map((food, index) => (
              <Animated.View
                key={food._id}
                entering={FadeIn.duration(motion.duration.base)}
                exiting={FadeOut.duration(motion.duration.fast)}
                layout={LinearTransition.duration(motion.duration.base)}
                style={[styles.foodRow, index > 0 && styles.foodRowBorder]}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {food.foodName}
                  </Text>
                  <View style={styles.foodMetaRow}>
                    <Clock size={layout.icon.xs} color={colors.textFaint} />
                    <Text style={styles.foodMeta} numberOfLines={1}>
                      {formatTime(food.timestamp)} · {food.servingSize || `${food.quantity}g`} · P{' '}
                      {food.protein}g · C {food.carbs}g · F {food.fat}g
                    </Text>
                  </View>
                </View>
                <View style={styles.foodCalories}>
                  <Flame size={layout.icon.sm} color={palette.orange500} />
                  <Text style={styles.foodCaloriesValue}>{food.calories}</Text>
                </View>
                {isToday && (
                  <PressableScale
                    onPress={() => confirmDeleteFood(food)}
                    hitSlop={layout.hitSlop}
                    haptic="none"
                    accessibilityLabel={`Remove ${food.foodName}`}
                    style={styles.foodDelete}>
                    <Trash2 size={layout.icon.md} color={colors.textFaint} />
                  </PressableScale>
                )}
              </Animated.View>
            ))
          ) : (
            <EmptyState
              compact
              icon={searchTerm ? Search : CalendarDays}
              title={searchTerm ? 'No foods match your search' : 'Nothing logged this day'}
              message={
                searchTerm
                  ? 'Try a different search term.'
                  : isToday
                    ? 'Use “Add Food” on the dashboard to log a meal.'
                    : 'No food items were recorded on this date.'
              }
            />
          )}
        </Card>
      </Animated.View>
    </Screen>
  );
}

function MiniBadge({ label, percent }: { label: string; percent: number }) {
  const [start, end] = progressGradient(percent);
  return (
    <View style={miniBadgeStyles.container}>
      <LinearGradient
        colors={[start, end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={miniBadgeStyles.badge}>
        <Text style={miniBadgeStyles.value}>{percent.toFixed(0)}%</Text>
      </LinearGradient>
      <Text style={miniBadgeStyles.label}>{label}</Text>
    </View>
  );
}

function SummaryTile({
  icon: Icon,
  gradient,
  value,
  label,
  percentLabel,
}: {
  icon: typeof Flame;
  gradient: Gradient;
  value: string;
  label: string;
  percentLabel: string;
}) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={summaryStyles.tile}>
      <Icon size={layout.icon.md} color={colors.onGradient} strokeWidth={layout.strokeWidth} />
      <Text style={summaryStyles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={summaryStyles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={summaryStyles.percent} numberOfLines={1}>
        {percentLabel}
      </Text>
    </LinearGradient>
  );
}

const miniBadgeStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  badge: {
    borderRadius: radius.xs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    minWidth: 34,
    alignItems: 'center',
  },
  value: {
    ...typography.micro,
    fontWeight: '700',
    color: colors.onGradient,
  },
  label: {
    ...typography.micro,
  },
});

const summaryStyles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  value: {
    ...typography.numberMd,
    color: colors.onGradient,
  },
  label: {
    ...typography.caption,
    color: colors.onGradientMuted,
  },
  percent: {
    ...typography.micro,
    color: colors.onGradientFaint,
  },
});

const styles = StyleSheet.create({
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  rangePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: layout.border,
    borderColor: colors.divider,
  },
  rangePillActive: {
    backgroundColor: palette.indigo600,
    borderColor: palette.indigo600,
  },
  rangeText: {
    ...typography.captionStrong,
  },
  rangeTextActive: {
    color: colors.onGradient,
  },
  dayStripSkeleton: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dayStripScroll: {
    marginBottom: spacing.lg,
  },
  dayStrip: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  dayCard: {
    width: 132,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: layout.border,
    borderColor: colors.divider,
    padding: spacing.md,
    gap: spacing.sm,
  },
  dayCardSelected: {
    borderColor: palette.indigo500,
    backgroundColor: palette.indigo50,
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCardDate: {
    ...typography.captionStrong,
    color: colors.text,
    fontWeight: '700',
  },
  dayCardDateSelected: {
    color: palette.indigo600,
  },
  dayCardCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  dayCardCountText: {
    ...typography.micro,
    color: colors.textMuted,
  },
  dayCardBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  emptyDaysCard: {
    marginBottom: spacing.lg,
  },
  selectedDayCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateNavButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: radius.full,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavButtonDisabled: {
    opacity: 0.3,
  },
  dateNavLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: palette.indigo50,
    minHeight: layout.iconButton,
  },
  dateNavText: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: palette.indigo700,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  errorText: {
    ...typography.caption,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  waterCard: {
    marginBottom: spacing.lg,
  },
  waterQuickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  waterChip: {
    flex: 1,
  },
  waterStepperRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepperButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.tapTarget,
    borderRadius: radius.md,
    borderWidth: layout.border,
  },
  stepperDisabled: {
    opacity: 0.4,
  },
  stepperBusy: {
    opacity: 0.6,
  },
  stepperMinus: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  stepperMinusText: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.danger,
  },
  stepperPlus: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  stepperPlusText: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.success,
  },
  foodsCard: {
    marginBottom: spacing.lg,
  },
  searchField: {
    marginBottom: spacing.md,
  },
  foodsLoading: {
    gap: spacing.md,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    minHeight: layout.tapTarget,
  },
  foodRowBorder: {
    borderTopWidth: layout.hairline,
    borderTopColor: colors.divider,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    ...typography.bodyStrong,
  },
  foodMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  foodMeta: {
    ...typography.caption,
    flex: 1,
  },
  foodCalories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  foodCaloriesValue: {
    ...typography.numberSm,
  },
  foodDelete: {
    width: layout.iconTile.sm,
    height: layout.iconTile.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
