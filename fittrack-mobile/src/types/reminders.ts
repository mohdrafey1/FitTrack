/**
 * Reminder settings persisted on-device (AsyncStorage). Reminders are
 * delivered as local scheduled notifications — no backend involvement.
 */

export interface ProteinReminder {
  id: string;
  hour: number;
  minute: number;
  message: string;
  enabled: boolean;
  /** OS notification identifier currently scheduled for this reminder. */
  notificationId?: string;
}

export interface WaterSchedule {
  enabled: boolean;
  /** Interval between reminders, in minutes (60, 120, 180, 240 or custom). */
  intervalMinutes: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  message: string;
  /** OS notification identifiers currently scheduled for this schedule. */
  notificationIds: string[];
}

export interface RemindersState {
  protein: ProteinReminder[];
  water: WaterSchedule;
}

export const DEFAULT_PROTEIN_MESSAGE = 'Time to log your protein! 💪';
export const DEFAULT_WATER_MESSAGE = 'Time to drink some water! 💧';

export const DEFAULT_WATER_SCHEDULE: WaterSchedule = {
  enabled: false,
  intervalMinutes: 120,
  startHour: 8,
  startMinute: 0,
  endHour: 22,
  endMinute: 0,
  message: DEFAULT_WATER_MESSAGE,
  notificationIds: [],
};

export const DEFAULT_REMINDERS_STATE: RemindersState = {
  protein: [],
  water: DEFAULT_WATER_SCHEDULE,
};

/** Bounds that keep us well inside iOS's 64-pending-notification limit. */
export const MAX_PROTEIN_REMINDERS = 10;
export const MAX_WATER_SLOTS_PER_DAY = 24;
export const MIN_WATER_INTERVAL_MINUTES = 30;
export const MAX_WATER_INTERVAL_MINUTES = 12 * 60;
