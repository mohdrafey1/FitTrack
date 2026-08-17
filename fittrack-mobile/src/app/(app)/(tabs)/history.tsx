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
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getApiErrorMessage } from '@/api/client';
import { foodApi } from '@/api/food';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import {
  colors,
  gradients,
  palette,
  progressGradient,
  radius,
  spacing,
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
      <View style={styles.header}>
        <Text style={styles.title}>Food History</Text>
        <Text style={styles.subtitle}>Track your nutrition journey</Text>
      </View>

      {/* Recent days strip */}
      <SectionHeader
        title="Recent Days"
        icon={CalendarDays}
        right={
          <View style={styles.rangeRow}>
            {RANGE_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setRange(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: range === option }}
                style={[styles.rangePill, range === option && styles.rangePillActive]}>
                <Text
                  style={[styles.rangeText, range === option && styles.rangeTextActive]}>
                  {option}d
                </Text>
              </Pressable>
            ))}
          </View>
        }
      />

      {entriesLoading ? (
        <View style={styles.dayStripSkeleton}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={92} width={132} borderRadius={radius.lg} />
          ))}
        </View>
      ) : entries.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayStripScroll}
          contentContainerStyle={styles.dayStrip}>
          {entries.map((entry) => {
            const dateKey = entry.date.split('T')[0];
            const selected = dateKey === selectedDate;
            return (
              <Pressable
                key={entry._id}
                onPress={() => selectDate(dateKey)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.dayCard, selected && styles.dayCardSelected]}>
                <View style={styles.dayCardHeader}>
                  <Text style={[styles.dayCardDate, selected && { color: palette.indigo600 }]}>
                    {formatDisplayDate(dateKey)}
                  </Text>
                  <View style={styles.dayCardCount}>
                    <UtensilsCrossed size={11} color={palette.gray500} />
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
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <Card style={{ marginBottom: spacing.xl }}>
          <EmptyState
            icon={CalendarDays}
            title="No entries found"
            message="Days you log food or water will appear here."
          />
        </Card>
      )}

      {/* Selected day */}
      <Card style={styles.selectedDayCard}>
        <View style={styles.dateNav}>
          <Pressable
            onPress={() => selectDate(shiftUTCDate(selectedDate, -1))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Previous day"
            style={styles.dateNavButton}>
            <ChevronLeft size={20} color={palette.gray600} />
          </Pressable>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Pick a date"
            style={styles.dateNavLabel}>
            <CalendarDays size={16} color={palette.indigo600} />
            <Text style={styles.dateNavText}>
              {isToday ? 'Today' : formatDisplayDate(selectedDate)}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => selectDate(shiftUTCDate(selectedDate, 1))}
            disabled={isToday}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Next day"
            style={[styles.dateNavButton, isToday && { opacity: 0.3 }]}>
            <ChevronRight size={20} color={palette.gray600} />
          </Pressable>
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
              <Skeleton key={i} height={96} width="31%" borderRadius={radius.md} />
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

      {/* Water tracker (today only — backend only mutates today's entry) */}
      {isToday && selectedEntry && (
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
            <Pressable
              onPress={() => handleWaterChange(-250)}
              disabled={waterBusy || (selectedEntry.water ?? 0) < 250}
              accessibilityRole="button"
              accessibilityLabel="Remove 250 ml"
              style={[
                styles.stepperButton,
                styles.stepperMinus,
                ((selectedEntry.water ?? 0) < 250 || waterBusy) && { opacity: 0.4 },
              ]}>
              <Text style={styles.stepperMinusText}>−250ml</Text>
            </Pressable>
            <Pressable
              onPress={() => handleWaterChange(250)}
              disabled={waterBusy}
              accessibilityRole="button"
              accessibilityLabel="Add 250 ml"
              style={[styles.stepperButton, styles.stepperPlus, waterBusy && { opacity: 0.6 }]}>
              <Text style={styles.stepperPlusText}>+250ml</Text>
            </Pressable>
          </View>
        </Card>
      )}

      {/* Food list */}
      <Card style={styles.foodsCard}>
        <SectionHeader title="Food Items" icon={UtensilsCrossed} />
        {!!selectedEntry?.foods.length && (
          <Input
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search foods..."
            containerStyle={{ marginBottom: spacing.md }}
          />
        )}

        {entryLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={56} />
            <Skeleton height={56} />
          </View>
        ) : filteredFoods.length > 0 ? (
          filteredFoods.map((food, index) => (
            <View key={food._id} style={[styles.foodRow, index > 0 && styles.foodRowBorder]}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={1}>
                  {food.foodName}
                </Text>
                <View style={styles.foodMetaRow}>
                  <Clock size={12} color={palette.gray400} />
                  <Text style={styles.foodMeta}>
                    {formatTime(food.timestamp)} • {food.servingSize || `${food.quantity}g`}
                  </Text>
                </View>
                <View style={styles.foodMacros}>
                  <Text style={styles.foodMacro}>
                    <Text style={{ color: palette.orange500 }}>●</Text> {food.calories} cal
                  </Text>
                  <Text style={styles.foodMacro}>
                    <Text style={{ color: palette.red500 }}>●</Text> {food.protein}g protein
                  </Text>
                  <Text style={styles.foodMacroFaint}>C {food.carbs}g</Text>
                  <Text style={styles.foodMacroFaint}>F {food.fat}g</Text>
                </View>
              </View>
              {isToday && (
                <Pressable
                  onPress={() => confirmDeleteFood(food)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${food.foodName}`}
                  style={({ pressed }) => [styles.foodDelete, pressed && { opacity: 0.6 }]}>
                  <Trash2 size={17} color={palette.red500} />
                </Pressable>
              )}
            </View>
          ))
        ) : (
          <EmptyState
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
      <Icon size={20} color={palette.white} />
      <Text style={summaryStyles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={summaryStyles.percent}>{percentLabel}</Text>
    </LinearGradient>
  );
}

const miniBadgeStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  badge: {
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: 6,
    minWidth: 38,
    alignItems: 'center',
  },
  value: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    fontSize: 10.5,
    color: palette.gray500,
  },
});

const summaryStyles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    color: palette.white,
    fontSize: 19,
    fontWeight: '800',
  },
  label: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  percent: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10.5,
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
  rangeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  rangePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  rangePillActive: {
    backgroundColor: palette.indigo600,
    borderColor: palette.indigo600,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rangeTextActive: {
    color: palette.white,
  },
  dayStripSkeleton: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  dayStripScroll: {
    marginBottom: spacing.lg,
  },
  dayStrip: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  dayCard: {
    width: 148,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderWidth: 2,
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
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  dayCardCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dayCardCountText: {
    fontSize: 11.5,
    color: palette.gray500,
  },
  dayCardBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  selectedDayCard: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: palette.indigo50,
  },
  dateNavText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.indigo700,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  errorText: {
    fontSize: 13.5,
    color: colors.textMuted,
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
    paddingVertical: 11,
    borderRadius: radius.md,
  },
  stepperMinus: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  stepperMinusText: {
    color: palette.red600,
    fontWeight: '700',
    fontSize: 14,
  },
  stepperPlus: {
    backgroundColor: palette.emerald100,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  stepperPlusText: {
    color: palette.emerald600,
    fontWeight: '700',
    fontSize: 14,
  },
  foodsCard: {
    marginBottom: spacing.lg,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  foodRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  foodInfo: {
    flex: 1,
    gap: 3,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  foodMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  foodMeta: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  foodMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: 2,
  },
  foodMacro: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  foodMacroFaint: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  foodDelete: {
    padding: spacing.sm,
  },
});
