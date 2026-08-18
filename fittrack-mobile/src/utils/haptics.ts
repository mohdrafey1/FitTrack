import * as Haptics from 'expo-haptics';

/**
 * Thin wrapper around expo-haptics.
 *
 * Every call is fire-and-forget and swallows rejections: haptics are a nicety,
 * and a device without a taptic engine (or with system haptics disabled) must
 * never surface an unhandled rejection. Light impact only — the app never
 * buzzes on scroll or on passive state changes.
 */
function fire(run: () => Promise<void>): void {
  run().catch(() => {
    // No haptics engine / disabled by the user — nothing to do.
  });
}

export const haptics = {
  /** Confirmed a tap: logging food/water, opening a modal action. */
  light: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Changed a selection: tab switch, chip/segment change. */
  selection: () => fire(() => Haptics.selectionAsync()),
  /** A goal was reached, or a save completed. */
  success: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Destructive confirm (delete). */
  warning: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** A request failed. */
  error: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
} as const;

export type HapticStyle = keyof typeof haptics | 'none';

/** Fires the named haptic; `'none'` is a no-op. */
export function playHaptic(style: HapticStyle): void {
  if (style === 'none') return;
  haptics[style]();
}
