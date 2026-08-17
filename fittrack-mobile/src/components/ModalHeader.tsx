import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, palette, spacing } from '@/constants/theme';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  /** Extra element rendered left of the close button. */
  right?: React.ReactNode;
}

/** Header row for modal screens: title + close button. */
export function ModalHeader({ title, subtitle, right }: ModalHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <View style={styles.titleGroup}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.actions}>
        {right}
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}>
          <X size={20} color={palette.gray600} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
