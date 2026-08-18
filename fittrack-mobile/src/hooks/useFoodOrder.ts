import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'fittrack.foodOrder.v1';

/**
 * The user's preferred order for the food picker.
 *
 * Device-local by design: it is a browsing preference, not data, so it never
 * touches the backend and never syncs with the web app. Stored as a flat list
 * of food keys covering built-in and custom foods alike.
 */
export function useFoodOrder() {
  const [order, setOrder] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((key) => typeof key === 'string')) {
          setOrder(parsed as string[]);
        }
      })
      .catch(() => {
        // Unreadable or corrupt — fall back to the natural order.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveOrder = useCallback((keys: string[]) => {
    setOrder(keys);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(keys)).catch(() => {
      // Best effort: the order stays applied for this session either way.
    });
  }, []);

  const resetOrder = useCallback(() => {
    setOrder([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  return { order, ready, saveOrder, resetOrder };
}

/**
 * Sort `items` by a saved key order.
 *
 * Anything not in the saved order keeps its natural position at the end, so a
 * newly created custom food — or a built-in added in an app update — appears
 * without invalidating the order the user arranged.
 */
export function applyFoodOrder<T>(
  items: T[],
  keyOf: (item: T) => string,
  order: string[]
): T[] {
  if (order.length === 0) return items;

  const rank = new Map(order.map((key, index) => [key, index]));
  const known: T[] = [];
  const unknown: T[] = [];

  for (const item of items) {
    (rank.has(keyOf(item)) ? known : unknown).push(item);
  }

  known.sort((a, b) => (rank.get(keyOf(a)) ?? 0) - (rank.get(keyOf(b)) ?? 0));
  return [...known, ...unknown];
}
