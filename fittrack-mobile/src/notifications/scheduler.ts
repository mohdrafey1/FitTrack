import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { ProteinReminder, WaterSchedule } from '@/types/reminders';
import { MAX_WATER_SLOTS_PER_DAY } from '@/types/reminders';
import { CHANNELS } from './notifications';

/**
 * Local-notification scheduling for FitTrack reminders.
 *
 * Every reminder is a repeating DAILY trigger. Water schedules expand into one
 * DAILY trigger per time slot (e.g. every 2h between 8:00 and 22:00 → 8 slots).
 * Tapping a notification deep-links via `data.url` (handled in the root layout).
 */

function dailyTrigger(hour: number, minute: number, channelId: string) {
  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
    ...(Platform.OS === 'android' ? { channelId } : {}),
  };
  return trigger;
}

async function cancelSafely(ids: (string | undefined)[]) {
  await Promise.all(
    ids
      .filter((id): id is string => !!id)
      .map((id) =>
        Notifications.cancelScheduledNotificationAsync(id).catch(() => {
          // Already fired/cancelled — nothing to do.
        })
      )
  );
}

/**
 * Reconcile one protein reminder with the OS scheduler.
 * Returns the reminder with its new `notificationId` (or none when disabled).
 */
export async function syncProteinReminder(reminder: ProteinReminder): Promise<ProteinReminder> {
  await cancelSafely([reminder.notificationId]);

  if (!reminder.enabled) {
    return { ...reminder, notificationId: undefined };
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Protein reminder',
      body: reminder.message,
      sound: true,
      data: { url: '/log-food', kind: 'protein', reminderId: reminder.id },
    },
    trigger: dailyTrigger(reminder.hour, reminder.minute, CHANNELS.protein),
  });

  return { ...reminder, notificationId };
}

export async function cancelProteinReminder(reminder: ProteinReminder) {
  await cancelSafely([reminder.notificationId]);
}

/** All daily time slots a water schedule expands to. */
export function computeWaterSlots(
  schedule: Pick<
    WaterSchedule,
    'intervalMinutes' | 'startHour' | 'startMinute' | 'endHour' | 'endMinute'
  >
): { hour: number; minute: number }[] {
  const start = schedule.startHour * 60 + schedule.startMinute;
  const end = schedule.endHour * 60 + schedule.endMinute;
  const interval = Math.max(1, schedule.intervalMinutes);

  const slots: { hour: number; minute: number }[] = [];
  for (
    let t = start;
    t <= end && slots.length < MAX_WATER_SLOTS_PER_DAY;
    t += interval
  ) {
    slots.push({ hour: Math.floor(t / 60) % 24, minute: t % 60 });
  }
  return slots;
}

/**
 * Reconcile the water schedule with the OS scheduler.
 * Returns the schedule with the freshly scheduled notification ids.
 */
export async function syncWaterSchedule(schedule: WaterSchedule): Promise<WaterSchedule> {
  await cancelSafely(schedule.notificationIds);

  if (!schedule.enabled) {
    return { ...schedule, notificationIds: [] };
  }

  const slots = computeWaterSlots(schedule);
  const notificationIds = await Promise.all(
    slots.map((slot) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Water reminder',
          body: schedule.message,
          sound: true,
          data: { url: '/log-water', kind: 'water' },
        },
        trigger: dailyTrigger(slot.hour, slot.minute, CHANNELS.water),
      })
    )
  );

  return { ...schedule, notificationIds };
}
