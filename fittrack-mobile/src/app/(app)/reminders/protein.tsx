import { useLocalSearchParams, useRouter } from 'expo-router';
import { Beef, Save, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { Screen } from '@/components/Screen';
import { TimePickerField } from '@/components/TimePickerField';
import { colors, gradients, palette, radius, spacing } from '@/constants/theme';
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
            <Beef size={18} color={palette.white} />
          </View>
          <View style={{ flex: 1 }}>
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
            trackColor={{ false: palette.gray200, true: palette.red400 }}
            thumbColor={palette.white}
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
        <Pressable
          onPress={handleDelete}
          accessibilityRole="button"
          style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.8 }]}>
          <Trash2 size={16} color={palette.red600} />
          <Text style={styles.deleteText}>Delete Reminder</Text>
        </Pressable>
      )}
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
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: palette.red500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  previewBody: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  previewTime: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: palette.red600,
  },
});
