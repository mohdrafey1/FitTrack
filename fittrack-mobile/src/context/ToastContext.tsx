import { CheckCircle2, Info, XCircle } from 'lucide-react-native';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, motion, radius, shadows, spacing, typography } from '@/constants/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

const TOAST_COLORS: Record<ToastType, string> = {
  success: colors.success,
  error: colors.danger,
  info: colors.info,
};

const TOAST_ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const OFFSCREEN = -20;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType; key: number } | null>(
    null
  );
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(OFFSCREEN);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;

    if (hideTimer.current) clearTimeout(hideTimer.current);
    opacity.value = 0;
    translateY.value = OFFSCREEN;
    opacity.value = withTiming(1, {
      duration: motion.duration.base,
      easing: motion.easing.standard,
      reduceMotion: ReduceMotion.System,
    });
    translateY.value = withSpring(0, motion.spring.entrance);

    hideTimer.current = setTimeout(
      () => {
        opacity.value = withTiming(0, {
          duration: motion.duration.slow,
          easing: motion.easing.out,
          reduceMotion: ReduceMotion.System,
        });
        // Unmount slightly after the fade so the view is gone, not just clear.
        hideTimer.current = setTimeout(() => setToast(null), motion.duration.slow);
      },
      toast.type === 'error' ? 4000 : 2600
    );

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [toast, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const value = useMemo(() => ({ showToast }), [showToast]);
  const Icon = toast ? TOAST_ICONS[toast.type] : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && Icon && (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[
            styles.toast,
            { top: insets.top + (Platform.OS === 'android' ? spacing.md : spacing.sm) },
            animatedStyle,
          ]}>
          <Icon size={layout.icon.lg} color={TOAST_COLORS[toast.type]} />
          <Text style={styles.text} numberOfLines={3}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.inverseSurface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.raised,
  },
  text: {
    ...typography.body,
    flex: 1,
    color: colors.inverseText,
    fontWeight: '500',
  },
});
