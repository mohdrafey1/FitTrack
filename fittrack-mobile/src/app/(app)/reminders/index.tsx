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
import { StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { GradientButton } from '@/components/GradientButton';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
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
        <PressableScale
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={layout.hitSlop}
          haptic="selection"
          accessibilityLabel="Go back"
          style={styles.backButton}>
          <ArrowLeft size={layout.icon.lg} color={colors.textSecondary} />
        </PressableScale>
        <View>
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.subtitle}>Protein & hydration notifications</Text>
        </View>
      </View>

      {/* Permission banner */}
      {permission === 'unavailable' ? (
        <Card style={styles.permissionCard}>
          <View style={styles.permissionRow}>
            <View style={[styles.permissionIcon, { backgroundColor: colors.fill }]}>
              <Info size={layout.icon.lg} color={colors.textMuted} />
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
              <BellOff size={layout.icon.lg} color={colors.warning} />
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
          <Bell size={layout.icon.sm} color={colors.success} />
          <Text style={styles.grantedText}>Notifications are enabled</Text>
        </View>
      )}

      {/* Protein reminders */}
      <SectionHeader
        title="Protein Reminders"
        icon={Beef}
        iconColor={palette.red500}
        right={
          <PressableScale
            onPress={() => router.push('/reminders/protein')}
            disabled={!ready || protein.length >= MAX_PROTEIN_REMINDERS}
            hitSlop={layout.hitSlop}
            accessibilityLabel="Add protein reminder"
            style={[
              styles.addButton,
              protein.length >= MAX_PROTEIN_REMINDERS && styles.addButtonDisabled,
            ]}>
            <Plus size={layout.icon.md} color={colors.onGradient} />
          </PressableScale>
        }
      />
      <Card style={styles.listCard}>
        {sortedProtein.length === 0 ? (
          <EmptyState
            compact
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
            <Animated.View
              key={reminder.id}
              entering={FadeIn.duration(motion.duration.base)}
              exiting={FadeOut.duration(motion.duration.fast)}
              layout={LinearTransition.duration(motion.duration.base)}>
              <PressableScale
                onPress={() =>
                  router.push({ pathname: '/reminders/protein', params: { id: reminder.id } })
                }
                scaleTo={motion.press.scaleSubtle}
                haptic="selection"
                accessibilityLabel={`Edit reminder at ${formatClockTime(reminder.hour, reminder.minute)}`}
                style={[styles.reminderRow, index > 0 && styles.reminderRowBorder]}>
                <View style={styles.reminderInfo}>
                  <Text style={[styles.reminderTime, !reminder.enabled && styles.dimmed]}>
                    {formatClockTime(reminder.hour, reminder.minute)}
                  </Text>
                  <Text
                    style={[styles.reminderMessage, !reminder.enabled && styles.dimmed]}
                    numberOfLines={1}>
                    {reminder.message}
                  </Text>
                  <Text style={styles.reminderMeta}>{reminder.enabled ? 'Every day' : 'Paused'}</Text>
                </View>
                <Switch
                  value={reminder.enabled}
                  onValueChange={(value) => toggleProtein(reminder.id, value)}
                  trackColor={{ false: colors.divider, true: palette.red400 }}
                  thumbColor={colors.card}
                />
                <ChevronRight size={layout.icon.md} color={colors.textFaint} />
              </PressableScale>
            </Animated.View>
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
            trackColor={{ false: colors.divider, true: palette.blue500 }}
            thumbColor={colors.card}
          />
        </View>
        <PressableScale
          onPress={() => router.push('/reminders/water')}
          haptic="selection"
          accessibilityLabel="Configure water reminder schedule and message"
          style={styles.configureRow}>
          <Text style={styles.configureText}>Configure schedule & message</Text>
          <ChevronRight size={layout.icon.md} color={colors.primary} />
        </PressableScale>
      </Card>

      <View style={styles.footnote}>
        <Info size={layout.icon.sm} color={colors.textFaint} />
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
    marginBottom: spacing.lg,
  },
  backButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: layout.border,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.display,
  },
  subtitle: {
    ...typography.caption,
  },
  permissionCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  permissionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  permissionIcon: {
    width: layout.iconTile.lg,
    height: layout.iconTile.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTextGroup: {
    flex: 1,
  },
  permissionTitle: {
    ...typography.bodyStrong,
    fontWeight: '700',
  },
  permissionMessage: {
    ...typography.label,
  },
  grantedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  grantedText: {
    ...typography.label,
    color: colors.success,
  },
  addButton: {
    width: layout.iconTile.md,
    height: layout.iconTile.md,
    borderRadius: radius.full,
    backgroundColor: palette.red500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  listCard: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    minHeight: layout.tapTarget,
  },
  reminderRowBorder: {
    borderTopWidth: layout.hairline,
    borderTopColor: colors.divider,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTime: {
    ...typography.numberMd,
  },
  reminderMessage: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  reminderMeta: {
    ...typography.micro,
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
    borderTopWidth: layout.hairline,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
    minHeight: layout.tapTarget,
  },
  configureText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  footnote: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  footnoteText: {
    ...typography.caption,
    flex: 1,
    color: colors.textFaint,
  },
});
