import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';

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
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.actions}>
        {right}
        <PressableScale
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={layout.hitSlop}
          accessibilityLabel="Close"
          style={styles.closeButton}>
          <X size={layout.icon.lg} color={colors.textSecondary} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  titleGroup: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.caption,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  closeButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: radius.full,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
