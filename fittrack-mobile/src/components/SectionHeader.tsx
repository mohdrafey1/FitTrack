import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, palette, spacing } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  /** Right-aligned accessory (filter, action link…). */
  right?: React.ReactNode;
}

export function SectionHeader({
  title,
  icon: Icon,
  iconColor = palette.indigo600,
  right,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleGroup}>
        {Icon && <Icon size={20} color={iconColor} strokeWidth={2.2} />}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
});
