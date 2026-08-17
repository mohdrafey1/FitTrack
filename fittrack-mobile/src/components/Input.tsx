import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, palette, radius, spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  /** Renders a show/hide toggle and secures the field. */
  password?: boolean;
  /** Optional leading icon shown inside the field. */
  icon?: LucideIcon;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  hint,
  password = false,
  icon: Icon,
  containerStyle,
  style,
  ...rest
}: InputProps) {
  const [hidden, setHidden] = useState(password);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
        ]}>
        {Icon && (
          <View style={styles.leadingIcon}>
            <Icon size={18} color={focused ? palette.blue500 : palette.gray400} />
          </View>
        )}
        <TextInput
          // Autofill is opt-out by default: Android's autofill service
          // highlights every field of a recognized form at once and its overlay
          // can swallow keystrokes. Screens opt in per-field where it's safe.
          autoComplete="off"
          importantForAutofill="no"
          {...rest}
          style={[styles.input, style]}
          secureTextEntry={hidden}
          placeholderTextColor={palette.gray400}
          // `underlineColorAndroid` avoids the stock Android underline showing
          // through our own bordered wrapper.
          underlineColorAndroid="transparent"
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />
        {password && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            style={styles.eyeButton}>
            {hidden ? (
              <Eye size={19} color={palette.gray400} />
            ) : (
              <EyeOff size={19} color={palette.gray400} />
            )}
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!error && !!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
  },
  /**
   * Focus must only change *existing* properties. Adding shadow/elevation props
   * on focus makes Android recreate the native view, which detaches the child
   * TextInput — the keyboard closes mid-tap and onBlur never fires, so fields
   * get stuck looking focused. Border colour alone is a cheap prop update.
   */
  inputWrapperFocused: {
    borderColor: palette.blue500,
  },
  inputWrapperError: {
    borderColor: palette.red500,
  },
  leadingIcon: {
    paddingLeft: spacing.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    fontSize: 15.5,
    color: colors.text,
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
  },
  error: {
    fontSize: 12.5,
    color: palette.red600,
  },
  hint: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
});
