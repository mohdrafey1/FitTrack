import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import {
  ensureAndroidChannels,
  getNotificationPermissionState,
  requestNotificationPermission,
  type PermissionState,
} from '@/notifications/notifications';
import {
  cancelProteinReminder,
  syncProteinReminder,
  syncWaterSchedule,
} from '@/notifications/scheduler';
import {
  DEFAULT_REMINDERS_STATE,
  MAX_PROTEIN_REMINDERS,
  type ProteinReminder,
  type RemindersState,
  type WaterSchedule,
} from '@/types/reminders';

const STORAGE_KEY = 'fittrack.reminders.v1';

interface RemindersContextValue {
  /** True once settings have been loaded from storage. */
  ready: boolean;
  protein: ProteinReminder[];
  water: WaterSchedule;
  permission: PermissionState;
  requestPermission: () => Promise<PermissionState>;
  refreshPermission: () => Promise<void>;
  addProteinReminder: (
    reminder: Omit<ProteinReminder, 'id' | 'notificationId'>
  ) => Promise<{ ok: boolean; error?: string }>;
  updateProteinReminder: (
    id: string,
    changes: Partial<Omit<ProteinReminder, 'id' | 'notificationId'>>
  ) => Promise<void>;
  deleteProteinReminder: (id: string) => Promise<void>;
  setWaterSchedule: (
    changes: Partial<Omit<WaterSchedule, 'notificationIds'>>
  ) => Promise<void>;
}

const RemindersContext = createContext<RemindersContextValue | null>(null);

export function useReminders(): RemindersContextValue {
  const context = useContext(RemindersContext);
  if (!context) throw new Error('useReminders must be used within a RemindersProvider');
  return context;
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function loadStoredState(): Promise<RemindersState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_REMINDERS_STATE;
    const parsed = JSON.parse(raw) as Partial<RemindersState>;
    return {
      protein: Array.isArray(parsed.protein) ? parsed.protein : [],
      water: { ...DEFAULT_REMINDERS_STATE.water, ...(parsed.water ?? {}) },
    };
  } catch {
    return DEFAULT_REMINDERS_STATE;
  }
}

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RemindersState>(DEFAULT_REMINDERS_STATE);
  const [ready, setReady] = useState(false);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const persist = useCallback(async (next: RemindersState) => {
    stateRef.current = next;
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  // Load settings, then re-sync every scheduled notification once per launch.
  // Syncing is idempotent (cancel + reschedule) and protects against the OS
  // dropping schedules (reboots, app updates, permission changes).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await loadStoredState();
      const permState = await getNotificationPermissionState();
      if (cancelled) return;
      setPermission(permState);

      if (permState === 'granted') {
        await ensureAndroidChannels();
        try {
          const protein = await Promise.all(stored.protein.map(syncProteinReminder));
          const water = await syncWaterSchedule(stored.water);
          if (cancelled) return;
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ protein, water })).catch(
            () => {}
          );
          setState({ protein, water });
        } catch {
          setState(stored);
        }
      } else {
        setState(stored);
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Re-check permission when the app returns from Settings.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        void getNotificationPermissionState().then(setPermission);
      }
    });
    return () => subscription.remove();
  }, []);

  const refreshPermission = useCallback(async () => {
    setPermission(await getNotificationPermissionState());
  }, []);

  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    const result = await requestNotificationPermission();
    setPermission(result);

    // Permission may have just been granted — arm anything already enabled.
    if (result === 'granted') {
      const current = stateRef.current;
      const protein = await Promise.all(current.protein.map(syncProteinReminder));
      const water = await syncWaterSchedule(current.water);
      await persist({ protein, water });
    }
    return result;
  }, [persist]);

  const addProteinReminder = useCallback(
    async (reminder: Omit<ProteinReminder, 'id' | 'notificationId'>) => {
      const current = stateRef.current;
      if (current.protein.length >= MAX_PROTEIN_REMINDERS) {
        return { ok: false, error: `You can have up to ${MAX_PROTEIN_REMINDERS} protein reminders.` };
      }
      const synced = await syncProteinReminder({ ...reminder, id: makeId() });
      await persist({ ...current, protein: [...current.protein, synced] });
      return { ok: true };
    },
    [persist]
  );

  const updateProteinReminder = useCallback(
    async (id: string, changes: Partial<Omit<ProteinReminder, 'id' | 'notificationId'>>) => {
      const current = stateRef.current;
      const existing = current.protein.find((r) => r.id === id);
      if (!existing) return;
      const synced = await syncProteinReminder({ ...existing, ...changes });
      await persist({
        ...current,
        protein: current.protein.map((r) => (r.id === id ? synced : r)),
      });
    },
    [persist]
  );

  const deleteProteinReminder = useCallback(
    async (id: string) => {
      const current = stateRef.current;
      const existing = current.protein.find((r) => r.id === id);
      if (!existing) return;
      await cancelProteinReminder(existing);
      await persist({ ...current, protein: current.protein.filter((r) => r.id !== id) });
    },
    [persist]
  );

  const setWaterSchedule = useCallback(
    async (changes: Partial<Omit<WaterSchedule, 'notificationIds'>>) => {
      const current = stateRef.current;
      const water = await syncWaterSchedule({ ...current.water, ...changes });
      await persist({ ...current, water });
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      ready,
      protein: state.protein,
      water: state.water,
      permission,
      requestPermission,
      refreshPermission,
      addProteinReminder,
      updateProteinReminder,
      deleteProteinReminder,
      setWaterSchedule,
    }),
    [
      ready,
      state,
      permission,
      requestPermission,
      refreshPermission,
      addProteinReminder,
      updateProteinReminder,
      deleteProteinReminder,
      setWaterSchedule,
    ]
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}
