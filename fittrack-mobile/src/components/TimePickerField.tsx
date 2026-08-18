import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Clock } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';
import { formatClockTime } from '@/utils/date';

interface TimePickerFieldProps {
  label: string;
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

/**
 * Cross-platform time field: opens the native clock dialog on Android and an
 * inline compact picker on iOS.
 */
export function TimePickerField({ label, hour, minute, onChange }: TimePickerFieldProps) {
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  const value = new Date();
  value.setHours(hour, minute, 0, 0);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowAndroidPicker(false);
    if (event.type === 'set' && date) {
      onChange(date.getHours(), date.getMinutes());
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.labelGroup}>
        <Clock size={layout.icon.md} color={colors.textMuted} />
        <Text style={styles.label}>{label}</Text>
      </View>

      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={value}
          mode="time"
          display="compact"
          onChange={handleChange}
          themeVariant="light"
        />
      ) : (
        <>
          <PressableScale
            onPress={() => setShowAndroidPicker(true)}
            haptic="selection"
            accessibilityLabel={`${label}: ${formatClockTime(hour, minute)}`}
            style={styles.timeButton}>
            <Text style={styles.timeText}>{formatClockTime(hour, minute)}</Text>
          </PressableScale>
          {showAndroidPicker && (
            <DateTimePicker value={value} mode="time" display="default" onChange={handleChange} />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.tapTarget,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
  },
  timeButton: {
    backgroundColor: colors.fill,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  timeText: {
    ...typography.bodyStrong,
  },
});
