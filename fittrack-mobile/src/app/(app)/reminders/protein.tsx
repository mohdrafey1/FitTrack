import { useLocalSearchParams, useRouter } from 'expo-router';
import { Beef, Save, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { TimePickerField } from '@/components/TimePickerField';
import { colors, gradients, layout, palette, radius, spacing, typography } from '@/constants/theme';
import { useReminders } from '@/context/RemindersContext';
import { useToast } from '@/context/ToastContext';
import { DEFAULT_PROTEIN_MESSAGE } from '@/types/reminders';
import { formatClockTime } from '@/utils/date';

export default function ProteinReminderScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    protein,
    permission,
    requestPermission,
    addProteinReminder,
    updateProteinReminder,
    deleteProteinReminder,
  } = useReminders();

  const existing = useMemo(() => protein.find((r) => r.id === id), [protein, id]);
  const isEditing = !!existing;

  const [hour, setHour] = useState(existing?.hour ?? 10);
  const [minute, setMinute] = useState(existing?.minute ?? 0);
  const [message, setMessage] = useState(existing?.message ?? DEFAULT_PROTEIN_MESSAGE);
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Make sure notifications can actually fire before arming the reminder.
      if (enabled && permission !== 'granted') {
        const result = await requestPermission();
        if (result !== 'granted' && result !== 'unavailable') {
          showToast('Enable notifications to receive this reminder', 'info');
        }
      }

      const payload = {
        hour,
        minute,
        message: message.trim() || DEFAULT_PROTEIN_MESSAGE,
        enabled,
      };

      if (isEditing && existing) {
        await updateProteinReminder(existing.id, payload);
        showToast('Reminder updated');
      } else {
        const result = await addProteinReminder(payload);
        if (!result.ok) {
          showToast(result.error ?? 'Could not add reminder', 'error');
          setSaving(false);
          return;
        }
        showToast(`Daily reminder set for ${formatClockTime(hour, minute)}`);
      }
      router.back();
    } catch {
      showToast('Failed to save reminder', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('Delete reminder', 'Remove this protein reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteProteinReminder(existing.id);
          showToast('Reminder deleted');
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen keyboardAvoiding padTop={Platform.OS === 'android'}>
      <View style={styles.topSpacer} />
      <ModalHeader
        title={isEditing ? 'Edit Protein Reminder' : 'New Protein Reminder'}
        subtitle="Repeats every day at the chosen time"
      />

      <Card style={styles.section}>
        <View style={styles.previewRow}>
          <View style={styles.previewIcon}>
            <Beef size={layout.icon.lg} color={colors.onGradient} />
          </View>
          <View style={styles.flexOne}>
            <Text style={styles.previewTitle}>Protein reminder</Text>
            <Text style={styles.previewBody} numberOfLines={2}>
              {message.trim() || DEFAULT_PROTEIN_MESSAGE}
            </Text>
          </View>
          <Text style={styles.previewTime}>{formatClockTime(hour, minute)}</Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <TimePickerField
          label="Reminder time"
          hour={hour}
          minute={minute}
          onChange={(h, m) => {
            setHour(h);
            setMinute(m);
          }}
        />

        <Input
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder={DEFAULT_PROTEIN_MESSAGE}
          maxLength={120}
          hint="Shown in the notification. Tapping it opens the food logging screen."
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Enabled</Text>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: colors.divider, true: palette.red400 }}
            thumbColor={colors.card}
          />
        </View>
      </Card>

      <GradientButton
        label={isEditing ? 'Save Changes' : 'Add Reminder'}
        icon={Save}
        gradient={gradients.protein}
        onPress={handleSave}
        loading={saving}
      />

      {isEditing && (
        <PressableScale
          onPress={handleDelete}
          haptic="none"
          accessibilityLabel="Delete reminder"
          style={styles.deleteButton}>
          <Trash2 size={layout.icon.md} color={colors.danger} />
          <Text style={styles.deleteText}>Delete Reminder</Text>
        </PressableScale>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topSpacer: {
    height: spacing.md,
  },
  flexOne: {
    flex: 1,
  },
  section: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewIcon: {
    width: layout.iconTile.lg,
    height: layout.iconTile.lg,
    borderRadius: radius.md,
    backgroundColor: palette.red500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    ...typography.captionStrong,
    fontWeight: '700',
    color: colors.text,
  },
  previewBody: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  previewTime: {
    ...typography.captionStrong,
    color: colors.textMuted,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.tapTarget,
  },
  switchLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    minHeight: layout.tapTarget,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    borderWidth: layout.border,
    borderColor: colors.dangerBorder,
  },
  deleteText: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.danger,
  },
});
