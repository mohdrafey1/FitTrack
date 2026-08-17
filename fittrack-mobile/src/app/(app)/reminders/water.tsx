import { useRouter } from 'expo-router';
import { Droplets, Save } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { Screen } from '@/components/Screen';
import { TimePickerField } from '@/components/TimePickerField';
import { colors, gradients, palette, radius, spacing } from '@/constants/theme';
import { useReminders } from '@/context/RemindersContext';
import { useToast } from '@/context/ToastContext';
import { computeWaterSlots } from '@/notifications/scheduler';
import {
  DEFAULT_WATER_MESSAGE,
  MAX_WATER_INTERVAL_MINUTES,
  MIN_WATER_INTERVAL_MINUTES,
} from '@/types/reminders';
import { formatClockTime } from '@/utils/date';

const PRESET_INTERVALS = [60, 120, 180, 240] as const;

export default function WaterReminderScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { water, permission, requestPermission, setWaterSchedule } = useReminders();

  const [enabled, setEnabled] = useState(water.enabled);
  const [interval, setIntervalMinutes] = useState(water.intervalMinutes);
  const [customInterval, setCustomInterval] = useState(
    PRESET_INTERVALS.includes(water.intervalMinutes as (typeof PRESET_INTERVALS)[number])
      ? ''
      : String(water.intervalMinutes)
  );
  const [useCustom, setUseCustom] = useState(
    !PRESET_INTERVALS.includes(water.intervalMinutes as (typeof PRESET_INTERVALS)[number])
  );
  const [startHour, setStartHour] = useState(water.startHour);
  const [startMinute, setStartMinute] = useState(water.startMinute);
  const [endHour, setEndHour] = useState(water.endHour);
  const [endMinute, setEndMinute] = useState(water.endMinute);
  const [message, setMessage] = useState(water.message);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveInterval = useCustom ? parseInt(customInterval, 10) || 0 : interval;

  const slots = useMemo(() => {
    if (effectiveInterval < MIN_WATER_INTERVAL_MINUTES) return [];
    return computeWaterSlots({
      intervalMinutes: effectiveInterval,
      startHour,
      startMinute,
      endHour,
      endMinute,
    });
  }, [effectiveInterval, startHour, startMinute, endHour, endMinute]);

  const validate = (): boolean => {
    if (
      effectiveInterval < MIN_WATER_INTERVAL_MINUTES ||
      effectiveInterval > MAX_WATER_INTERVAL_MINUTES
    ) {
      setError(
        `Interval must be between ${MIN_WATER_INTERVAL_MINUTES} minutes and ${MAX_WATER_INTERVAL_MINUTES / 60} hours.`
      );
      return false;
    }
    if (startHour * 60 + startMinute >= endHour * 60 + endMinute) {
      setError('Start time must be before end time.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSave = async () => {
    if (saving || !validate()) return;
    setSaving(true);
    try {
      if (enabled && permission !== 'granted') {
        const result = await requestPermission();
        if (result !== 'granted' && result !== 'unavailable') {
          showToast('Enable notifications to receive water reminders', 'info');
        }
      }

      await setWaterSchedule({
        enabled,
        intervalMinutes: effectiveInterval,
        startHour,
        startMinute,
        endHour,
        endMinute,
        message: message.trim() || DEFAULT_WATER_MESSAGE,
      });
      showToast(
        enabled
          ? `${slots.length} daily water reminders scheduled`
          : 'Water reminders turned off'
      );
      router.back();
    } catch {
      showToast('Failed to save schedule', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboardAvoiding padTop={Platform.OS === 'android'}>
      <View style={styles.topSpacer} />
      <ModalHeader
        title="Water Reminders"
        subtitle="e.g. every 2 hours between 8:00 AM and 10:00 PM"
      />

      <Card style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabelGroup}>
            <View style={styles.waterIcon}>
              <Droplets size={17} color={palette.white} />
            </View>
            <Text style={styles.switchLabel}>Water reminders</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: palette.gray200, true: palette.blue500 }}
            thumbColor={palette.white}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Remind me every</Text>
        <View style={styles.intervalRow}>
          {PRESET_INTERVALS.map((preset) => (
            <Chip
              key={preset}
              label={`${preset / 60}h`}
              selected={!useCustom && interval === preset}
              onPress={() => {
                setUseCustom(false);
                setIntervalMinutes(preset);
              }}
              selectedColor={palette.blue600}
              style={styles.intervalChip}
            />
          ))}
          <Chip
            label="Custom"
            selected={useCustom}
            onPress={() => setUseCustom(true)}
            selectedColor={palette.blue600}
            style={styles.intervalChip}
          />
        </View>
        {useCustom && (
          <Input
            value={customInterval}
            onChangeText={setCustomInterval}
            placeholder="Minutes (e.g. 90)"
            keyboardType="number-pad"
            hint={`Between ${MIN_WATER_INTERVAL_MINUTES} and ${MAX_WATER_INTERVAL_MINUTES} minutes`}
          />
        )}

        <View style={styles.divider} />

        <TimePickerField
          label="Start time"
          hour={startHour}
          minute={startMinute}
          onChange={(h, m) => {
            setStartHour(h);
            setStartMinute(m);
          }}
        />
        <TimePickerField
          label="End time"
          hour={endHour}
          minute={endMinute}
          onChange={(h, m) => {
            setEndHour(h);
            setEndMinute(m);
          }}
        />

        <Input
          label="Notification message"
          value={message}
          onChangeText={setMessage}
          placeholder={DEFAULT_WATER_MESSAGE}
          maxLength={120}
          hint="Tapping the notification opens the water tracker."
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </Card>

      {/* Schedule preview */}
      {slots.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            Daily schedule · {slots.length} reminder{slots.length === 1 ? '' : 's'}
          </Text>
          <View style={styles.slotWrap}>
            {slots.map((slot) => (
              <View key={`${slot.hour}-${slot.minute}`} style={styles.slotChip}>
                <Text style={styles.slotText}>{formatClockTime(slot.hour, slot.minute)}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <GradientButton
        label="Save Schedule"
        icon={Save}
        gradient={gradients.water}
        onPress={handleSave}
        loading={saving}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topSpacer: {
    height: spacing.md,
  },
  section: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  waterIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm + 2,
    backgroundColor: palette.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: 15.5,
    fontWeight: '600',
    color: colors.text,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  intervalChip: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  errorText: {
    fontSize: 13,
    color: palette.red600,
  },
  slotWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotChip: {
    backgroundColor: palette.blue50,
    borderWidth: 1,
    borderColor: palette.blue100,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  slotText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: palette.blue700,
  },
});
