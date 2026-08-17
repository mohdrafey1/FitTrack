import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Beef,
  Bell,
  BellOff,
  BellRing,
  ChevronRight,
  Droplets,
  Info,
  Plus,
} from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { GradientButton } from '@/components/GradientButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, gradients, palette, radius, spacing } from '@/constants/theme';
import { useReminders } from '@/context/RemindersContext';
import { useToast } from '@/context/ToastContext';
import { openSystemNotificationSettings } from '@/notifications/notifications';
import { computeWaterSlots } from '@/notifications/scheduler';
import { MAX_PROTEIN_REMINDERS } from '@/types/reminders';
import { formatClockTime } from '@/utils/date';

export default function RemindersScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    ready,
    protein,
    water,
    permission,
    requestPermission,
    updateProteinReminder,
    setWaterSchedule,
  } = useReminders();

  const notificationsBlocked = permission !== 'granted';

  const handleEnableNotifications = async () => {
    if (permission === 'denied') {
      openSystemNotificationSettings();
      return;
    }
    const result = await requestPermission();
    if (result === 'granted') {
      showToast('Notifications enabled');
    } else if (result === 'denied') {
      showToast('Enable notifications in system settings', 'info');
    }
  };

  const toggleProtein = async (id: string, enabled: boolean) => {
    if (enabled && notificationsBlocked) {
      await handleEnableNotifications();
      return;
    }
    await updateProteinReminder(id, { enabled });
  };

  const toggleWater = async (enabled: boolean) => {
    if (enabled && notificationsBlocked) {
      await handleEnableNotifications();
      return;
    }
    await setWaterSchedule({ enabled });
    if (enabled) showToast('Water reminders on');
  };

  const waterSlots = computeWaterSlots(water);
  const sortedProtein = [...protein].sort(
    (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)
  );

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}>
          <ArrowLeft size={20} color={palette.gray600} />
        </Pressable>
        <View>
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.subtitle}>Protein & hydration notifications</Text>
        </View>
      </View>

      {/* Permission banner */}
      {permission === 'unavailable' ? (
        <Card style={styles.permissionCard}>
          <View style={styles.permissionRow}>
            <View style={[styles.permissionIcon, { backgroundColor: palette.gray100 }]}>
              <Info size={18} color={palette.gray500} />
            </View>
            <View style={styles.permissionTextGroup}>
              <Text style={styles.permissionTitle}>Simulator detected</Text>
              <Text style={styles.permissionMessage}>
                Notifications need a physical device. Settings still save and will work on your
                phone.
              </Text>
            </View>
          </View>
        </Card>
      ) : notificationsBlocked ? (
        <Card style={styles.permissionCard}>
          <View style={styles.permissionRow}>
            <View style={[styles.permissionIcon, { backgroundColor: palette.amber100 }]}>
              <BellOff size={18} color={palette.amber600} />
            </View>
            <View style={styles.permissionTextGroup}>
              <Text style={styles.permissionTitle}>Notifications are off</Text>
              <Text style={styles.permissionMessage}>
                {permission === 'denied'
                  ? 'FitTrack is blocked from sending notifications. Allow them in system settings.'
                  : 'Allow notifications so your reminders can reach you.'}
              </Text>
            </View>
          </View>
          <GradientButton
            label={permission === 'denied' ? 'Open System Settings' : 'Enable Notifications'}
            icon={BellRing}
            small
            gradient={gradients.brand}
            onPress={handleEnableNotifications}
          />
        </Card>
      ) : (
        <View style={styles.grantedBanner}>
          <Bell size={14} color={palette.emerald600} />
          <Text style={styles.grantedText}>Notifications are enabled</Text>
        </View>
      )}

      {/* Protein reminders */}
      <SectionHeader
        title="Protein Reminders"
        icon={Beef}
        iconColor={palette.red500}
        right={
          <Pressable
            onPress={() => router.push('/reminders/protein')}
            disabled={!ready || protein.length >= MAX_PROTEIN_REMINDERS}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add protein reminder"
            style={({ pressed }) => [
              styles.addButton,
              (pressed || protein.length >= MAX_PROTEIN_REMINDERS) && { opacity: 0.5 },
            ]}>
            <Plus size={16} color={palette.white} />
          </Pressable>
        }
      />
      <Card style={styles.listCard}>
        {sortedProtein.length === 0 ? (
          <EmptyState
            icon={Beef}
            title="No protein reminders yet"
            message={'Add one like:\n“Remind me to add my protein at 10:00 AM every day.”'}
            action={
              <GradientButton
                label="Add Reminder"
                icon={Plus}
                small
                gradient={gradients.protein}
                onPress={() => router.push('/reminders/protein')}
              />
            }
          />
        ) : (
          sortedProtein.map((reminder, index) => (
            <Pressable
              key={reminder.id}
              onPress={() =>
                router.push({ pathname: '/reminders/protein', params: { id: reminder.id } })
              }
              accessibilityRole="button"
              accessibilityLabel={`Edit reminder at ${formatClockTime(reminder.hour, reminder.minute)}`}
              style={({ pressed }) => [
                styles.reminderRow,
                index > 0 && styles.reminderRowBorder,
                pressed && { backgroundColor: palette.gray50 },
              ]}>
              <View style={styles.reminderInfo}>
                <Text style={[styles.reminderTime, !reminder.enabled && styles.dimmed]}>
                  {formatClockTime(reminder.hour, reminder.minute)}
                </Text>
                <Text
                  style={[styles.reminderMessage, !reminder.enabled && styles.dimmed]}
                  numberOfLines={1}>
                  {reminder.message}
                </Text>
                <Text style={styles.reminderMeta}>
                  {reminder.enabled ? 'Every day' : 'Paused'}
                </Text>
              </View>
              <Switch
                value={reminder.enabled}
                onValueChange={(value) => toggleProtein(reminder.id, value)}
                trackColor={{ false: palette.gray200, true: palette.red400 }}
                thumbColor={palette.white}
              />
              <ChevronRight size={17} color={palette.gray400} />
            </Pressable>
          ))
        )}
      </Card>

      {/* Water reminders */}
      <SectionHeader title="Water Reminders" icon={Droplets} iconColor={palette.blue600} />
      <Card style={styles.listCard}>
        <View style={styles.waterHeaderRow}>
          <View style={styles.reminderInfo}>
            <Text style={[styles.reminderTime, !water.enabled && styles.dimmed]}>
              Every{' '}
              {water.intervalMinutes % 60 === 0
                ? `${water.intervalMinutes / 60} hour${water.intervalMinutes > 60 ? 's' : ''}`
                : `${water.intervalMinutes} min`}
            </Text>
            <Text style={[styles.reminderMessage, !water.enabled && styles.dimmed]}>
              {formatClockTime(water.startHour, water.startMinute)} –{' '}
              {formatClockTime(water.endHour, water.endMinute)}
            </Text>
            <Text style={styles.reminderMeta}>
              {water.enabled
                ? `${waterSlots.length} reminder${waterSlots.length === 1 ? '' : 's'} per day`
                : 'Off'}
            </Text>
          </View>
          <Switch
            value={water.enabled}
            onValueChange={toggleWater}
            trackColor={{ false: palette.gray200, true: palette.blue500 }}
            thumbColor={palette.white}
          />
        </View>
        <Pressable
          onPress={() => router.push('/reminders/water')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.configureRow, pressed && { opacity: 0.7 }]}>
          <Text style={styles.configureText}>Configure schedule & message</Text>
          <ChevronRight size={16} color={palette.blue600} />
        </Pressable>
      </Card>

      <View style={styles.footnote}>
        <Info size={13} color={palette.gray400} />
        <Text style={styles.footnoteText}>
          Reminders are scheduled locally on this device — they fire even without an internet
          connection. Tapping one opens the matching logging screen.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  permissionCard: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  permissionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  permissionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTextGroup: {
    flex: 1,
    gap: 2,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  permissionMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  grantedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.xl,
  },
  grantedText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.emerald600,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.red500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCard: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  reminderRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  reminderInfo: {
    flex: 1,
    gap: 1,
  },
  reminderTime: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  reminderMessage: {
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  reminderMeta: {
    fontSize: 12,
    color: colors.textFaint,
  },
  dimmed: {
    opacity: 0.45,
  },
  waterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  configureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  configureText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.blue600,
  },
  footnote: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  footnoteText: {
    flex: 1,
    fontSize: 12,
    color: colors.textFaint,
    lineHeight: 17,
  },
});
