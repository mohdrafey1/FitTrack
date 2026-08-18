import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/constants/theme';

interface ScreenTitleProps {
  title: string;
  subtitle?: string;
  /** Right-aligned accessory (action button, count…). */
  right?: React.ReactNode;
}

/** Top-of-screen title block for the tab screens. */
export function ScreenTitle({ title, subtitle, right }: ScreenTitleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textGroup}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    ...typography.display,
  },
  subtitle: {
    ...typography.caption,
  },
});
