import { Droplets, GlassWater, Minus, Plus } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/client';
import { foodApi } from '@/api/food';
import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { colors, gradients, palette, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { FoodEntry } from '@/types/api';
import { formatWater, progressPercent } from '@/utils/format';

const QUICK_AMOUNTS = [250, 500, 750, 1000] as const;

export default function LogWaterScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const target = user?.targetDailyWater ?? 2500;
  const consumed = entry?.water ?? 0;
  const percentage = progressPercent(consumed, target);

  useEffect(() => {
    let cancelled = false;
    foodApi
      .getToday()
      .then((data) => {
        if (!cancelled) setEntry(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const changeWater = async (amount: number) => {
    if (busy || amount === 0) return;
    setBusy(true);
    try {
      const updated = await foodApi.updateWater(amount);
      setEntry(updated);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Failed to update water'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCustomAdd = async () => {
    const amount = parseFloat(customAmount);
    if (!amount || amount <= 0) return;
    await changeWater(amount);
    setCustomAmount('');
  };

  const glasses = useMemo(() => Math.floor(consumed / 250), [consumed]);

  return (
    <Screen keyboardAvoiding padTop={Platform.OS === 'android'}>
      <View style={styles.topSpacer} />
      <ModalHeader title="Water Tracker" subtitle="Stay hydrated through the day" />

      {/* Progress */}
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View style={styles.progressIconBox}>
            <Droplets size={22} color={palette.white} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.progressValueRow}>
              {loading ? (
                <ActivityIndicator color={palette.blue600} />
              ) : (
                <>
                  <Text style={styles.progressValue}>{formatWater(consumed)}</Text>
                  <Text style={styles.progressTarget}> / {formatWater(target)}</Text>
                </>
              )}
            </View>
            <Text style={styles.progressMeta}>
              {glasses} glasses • {Math.max(0, target - consumed)}ml remaining
            </Text>
          </View>
          <Text style={styles.progressPercent}>{percentage.toFixed(0)}%</Text>
        </View>
        <ProgressBar percentage={percentage} height={12} gradient={gradients.water} />
        {percentage >= 100 && (
          <Text style={styles.goalAchieved}>🎉 Daily hydration goal achieved!</Text>
        )}
      </Card>

      {/* Quick add */}
      <Text style={styles.sectionLabel}>Quick add</Text>
      <View style={styles.quickGrid}>
        {QUICK_AMOUNTS.map((amount) => (
          <Pressable
            key={amount}
            onPress={() => changeWater(amount)}
            disabled={busy || loading}
            accessibilityRole="button"
            accessibilityLabel={`Add ${amount} millilitres`}
            style={({ pressed }) => [
              styles.quickButton,
              (pressed || busy) && { opacity: 0.75 },
            ]}>
            <GlassWater size={18} color={palette.blue600} />
            <Text style={styles.quickButtonText}>+{amount}ml</Text>
          </Pressable>
        ))}
      </View>

      {/* Stepper */}
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => changeWater(-250)}
          disabled={busy || loading || consumed < 250}
          accessibilityRole="button"
          accessibilityLabel="Remove 250 millilitres"
          style={({ pressed }) => [
            styles.stepper,
            styles.stepperMinus,
            (consumed < 250 || busy || loading) && { opacity: 0.4 },
            pressed && { opacity: 0.7 },
          ]}>
          <Minus size={16} color={palette.red600} />
          <Text style={styles.stepperMinusText}>250ml</Text>
        </Pressable>
        <Pressable
          onPress={() => changeWater(250)}
          disabled={busy || loading}
          accessibilityRole="button"
          accessibilityLabel="Add 250 millilitres"
          style={({ pressed }) => [
            styles.stepper,
            styles.stepperPlus,
            (busy || loading) && { opacity: 0.6 },
            pressed && { opacity: 0.7 },
          ]}>
          <Plus size={16} color={palette.emerald600} />
          <Text style={styles.stepperPlusText}>250ml</Text>
        </Pressable>
      </View>

      {/* Custom amount */}
      <Text style={styles.sectionLabel}>Custom amount</Text>
      <View style={styles.customRow}>
        <Input
          value={customAmount}
          onChangeText={setCustomAmount}
          placeholder="Amount in ml"
          keyboardType="numeric"
          containerStyle={{ flex: 1 }}
        />
        <GradientButton
          label="Add"
          gradient={gradients.water}
          onPress={handleCustomAdd}
          disabled={!customAmount || parseFloat(customAmount) <= 0}
          loading={busy}
          style={styles.customAddButton}
        />
      </View>

      <Text style={styles.hint}>
        {"Changes are saved instantly — close this screen whenever you're done."}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topSpacer: {
    height: spacing.md,
  },
  progressCard: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressIconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: palette.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.blue600,
  },
  progressTarget: {
    fontSize: 14,
    color: colors.textMuted,
  },
  progressMeta: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  goalAchieved: {
    textAlign: 'center',
    fontSize: 13.5,
    fontWeight: '600',
    color: palette.emerald600,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickButton: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.blue100,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.blue600,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  stepper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    paddingVertical: 12,
    borderWidth: 1,
  },
  stepperMinus: {
    backgroundColor: colors.dangerBg,
    borderColor: '#FECACA',
  },
  stepperMinusText: {
    color: palette.red600,
    fontWeight: '700',
  },
  stepperPlus: {
    backgroundColor: palette.emerald100,
    borderColor: '#A7F3D0',
  },
  stepperPlusText: {
    color: palette.emerald600,
    fontWeight: '700',
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  customAddButton: {
    minWidth: 96,
  },
  hint: {
    fontSize: 12.5,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
