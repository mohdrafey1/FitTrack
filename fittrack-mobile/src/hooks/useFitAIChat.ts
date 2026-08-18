import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { CoachRange, CoachTurn } from '@/types/api';

const STORAGE_KEY = 'fittrack.fitai.v1';

/** Turns kept locally. The server only ever receives the most recent few. */
const MAX_STORED_MESSAGES = 60;

/** How many turns of context travel with each question. */
const HISTORY_TURNS = 10;

export interface ChatMessage extends CoachTurn {
  id: string;
  /** Set on an assistant turn that failed, so the bubble can show as an error. */
  failed?: boolean;
}

interface StoredThread {
  range: CoachRange;
  messages: ChatMessage[];
}

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const turn = value as Partial<ChatMessage>;
  return (
    typeof turn.id === 'string' &&
    typeof turn.content === 'string' &&
    (turn.role === 'user' || turn.role === 'assistant')
  );
}

/**
 * The FitAI thread, persisted on this device.
 *
 * Local by design: conversations never reach the backend beyond the few turns
 * sent as context for the current question, so there is nothing to delete
 * server-side and nothing to sync.
 */
export function useFitAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [range, setRangeState] = useState<CoachRange>('week');
  const [ready, setReady] = useState(false);
  // Ids only have to be unique within a thread, and Date.now() collides when
  // two messages land in the same millisecond.
  const counter = useRef(0);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as Partial<StoredThread>;
        if (Array.isArray(parsed?.messages)) {
          setMessages(parsed.messages.filter(isMessage));
        }
        if (parsed?.range === 'today' || parsed?.range === 'week' || parsed?.range === 'month') {
          setRangeState(parsed.range);
        }
      })
      .catch(() => {
        // Corrupt or unreadable — start a fresh thread.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((thread: StoredThread) => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...thread, messages: thread.messages.slice(-MAX_STORED_MESSAGES) })
    ).catch(() => {
      // Best effort — the thread still works for this session.
    });
  }, []);

  const nextId = useCallback((role: ChatMessage['role']) => {
    counter.current += 1;
    return `${role}-${counter.current}-${Date.now()}`;
  }, []);

  const append = useCallback(
    (message: ChatMessage) => {
      setMessages((previous) => {
        const next = [...previous, message];
        persist({ range, messages: next });
        return next;
      });
    },
    [persist, range]
  );

  const setRange = useCallback(
    (next: CoachRange) => {
      setRangeState(next);
      setMessages((current) => {
        persist({ range: next, messages: current });
        return current;
      });
    },
    [persist]
  );

  const clear = useCallback(() => {
    setMessages([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  /** The turns sent up as context, oldest first, failures excluded. */
  const historyForRequest = useCallback(
    (): CoachTurn[] =>
      messages
        .filter((message) => !message.failed)
        .slice(-HISTORY_TURNS)
        .map(({ role, content }) => ({ role, content })),
    [messages]
  );

  return {
    messages,
    range,
    ready,
    setRange,
    append,
    clear,
    nextId,
    historyForRequest,
  };
}
