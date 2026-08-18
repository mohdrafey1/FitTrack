import { Droplets, GlassWater, Minus, Plus } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { getApiErrorMessage } from '@/api/client';
import { foodApi } from '@/api/food';
import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { PressableScale } from '@/components/PressableScale';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { colors, gradients, layout, palette, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { FoodEntry } from '@/types/api';
import { useCountUp } from '@/components/AnimatedNumber';
import { formatWater, progressPercent } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { enter } from '@/utils/motion';

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
  // Counts up as water is logged, so the headline number reacts to each tap.
  const displayedConsumed = useCountUp(consumed);

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
      const reachedGoal =
        progressPercent(updated.water ?? 0, target) >= 100 && percentage < 100;
      setEntry(updated);
      if (reachedGoal) haptics.success();
      else haptics.light();
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
      <Animated.View entering={enter(0)}>
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIconBox}>
              <Droplets
                size={layout.icon.xl}
                color={colors.onGradient}
                strokeWidth={layout.strokeWidth}
              />
            </View>
            <View style={styles.progressText}>
              <View style={styles.progressValueRow}>
                {loading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Text style={styles.progressValue}>
                      {formatWater(Math.round(displayedConsumed))}
                    </Text>
                    <Text style={styles.progressTarget}> / {formatWater(target)}</Text>
                  </>
                )}
              </View>
              <Text style={styles.progressMeta} numberOfLines={1}>
                {glasses} glasses · {Math.max(0, target - consumed)}ml remaining
              </Text>
            </View>
            <Text style={styles.progressPercent}>{percentage.toFixed(0)}%</Text>
          </View>
          <ProgressBar percentage={percentage} height={10} gradient={gradients.water} />
          {percentage >= 100 && (
            <Text style={styles.goalAchieved}>🎉 Daily hydration goal achieved!</Text>
          )}
        </Card>
      </Animated.View>

      {/* Quick add */}
      <Animated.View entering={enter(1)}>
        <Text style={styles.sectionLabel}>Quick add</Text>
        <View style={styles.quickGrid}>
          {QUICK_AMOUNTS.map((amount) => (
            <PressableScale
              key={amount}
              onPress={() => changeWater(amount)}
              disabled={busy || loading}
              haptic="none"
              accessibilityLabel={`Add ${amount} millilitres`}
              style={[styles.quickButton, busy && styles.busy]}>
              <GlassWater size={layout.icon.lg} color={colors.primary} />
              <Text style={styles.quickButtonText}>+{amount}ml</Text>
            </PressableScale>
          ))}
        </View>

        {/* Stepper */}
        <View style={styles.stepperRow}>
          <PressableScale
            onPress={() => changeWater(-250)}
            disabled={busy || loading || consumed < 250}
            haptic="none"
            accessibilityLabel="Remove 250 millilitres"
            style={[
              styles.stepper,
              styles.stepperMinus,
              (consumed < 250 || busy || loading) && styles.disabled,
            ]}>
            <Minus size={layout.icon.md} color={colors.danger} />
            <Text style={styles.stepperMinusText}>250ml</Text>
          </PressableScale>
          <PressableScale
            onPress={() => changeWater(250)}
            disabled={busy || loading}
            haptic="none"
            accessibilityLabel="Add 250 millilitres"
            style={[styles.stepper, styles.stepperPlus, (busy || loading) && styles.busy]}>
            <Plus size={layout.icon.md} color={colors.success} />
            <Text style={styles.stepperPlusText}>250ml</Text>
          </PressableScale>
        </View>
      </Animated.View>

      {/* Custom amount */}
      <Animated.View entering={enter(2)}>
        <Text style={styles.sectionLabel}>Custom amount</Text>
        <View style={styles.customRow}>
          <Input
            value={customAmount}
            onChangeText={setCustomAmount}
            placeholder="Amount in ml"
            keyboardType="numeric"
            containerStyle={styles.customField}
          />
          <GradientButton
            label="Add"
            gradient={gradients.water}
            onPress={handleCustomAdd}
            haptic="none"
            disabled={!customAmount || parseFloat(customAmount) <= 0}
            loading={busy}
            style={styles.customAddButton}
          />
        </View>

        <Text style={styles.hint}>
          {"Changes are saved instantly — close this screen whenever you're done."}
        </Text>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topSpacer: {
    height: spacing.md,
  },
  progressCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressIconBox: {
    width: layout.iconTile.lg,
    height: layout.iconTile.lg,
    borderRadius: radius.md,
    backgroundColor: palette.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    flex: 1,
  },
  progressValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressValue: {
    ...typography.numberLg,
    color: colors.primary,
  },
  progressTarget: {
    ...typography.caption,
  },
  progressMeta: {
    ...typography.caption,
  },
  progressPercent: {
    ...typography.numberMd,
  },
  goalAchieved: {
    ...typography.labelStrong,
    color: colors.success,
    textAlign: 'center',
  },
  sectionLabel: {
    ...typography.labelStrong,
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
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderWidth: layout.border,
    borderColor: palette.blue100,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    minHeight: layout.tapTarget,
  },
  quickButtonText: {
    ...typography.captionStrong,
    color: colors.primary,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stepper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: layout.border,
    minHeight: layout.tapTarget,
  },
  disabled: {
    opacity: 0.4,
  },
  busy: {
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
  customRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  customField: {
    flex: 1,
  },
  customAddButton: {
    minWidth: 88,
  },
  hint: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
