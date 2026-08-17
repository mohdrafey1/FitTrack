import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Clock } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, palette, radius, spacing } from '@/constants/theme';
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
        <Clock size={17} color={palette.gray500} />
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
          <Pressable
            onPress={() => setShowAndroidPicker(true)}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${formatClockTime(hour, minute)}`}
            style={({ pressed }) => [styles.timeButton, pressed && { opacity: 0.8 }]}>
            <Text style={styles.timeText}>{formatClockTime(hour, minute)}</Text>
          </Pressable>
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
    minHeight: 44,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  timeButton: {
    backgroundColor: palette.gray100,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
