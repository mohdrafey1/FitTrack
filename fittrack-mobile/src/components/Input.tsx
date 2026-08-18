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

import { colors, layout, radius, spacing, typography } from '@/constants/theme';

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
            <Icon
              size={layout.icon.lg}
              color={focused ? colors.inputBorderFocused : colors.textFaint}
            />
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
          placeholderTextColor={colors.textFaint}
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
            hitSlop={layout.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            style={styles.eyeButton}>
            {hidden ? (
              <Eye size={layout.icon.lg} color={colors.textFaint} />
            ) : (
              <EyeOff size={layout.icon.lg} color={colors.textFaint} />
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
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: layout.border,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    minHeight: layout.tapTarget,
  },
  /**
   * Focus must only change *existing* properties. Adding shadow/elevation props
   * on focus makes Android recreate the native view, which detaches the child
   * TextInput — the keyboard closes mid-tap and onBlur never fires, so fields
   * get stuck looking focused. Border colour alone is a cheap prop update, and
   * the same rule is why this wrapper is not a `PressableScale`.
   */
  inputWrapperFocused: {
    borderColor: colors.inputBorderFocused,
  },
  inputWrapperError: {
    borderColor: colors.danger,
  },
  leadingIcon: {
    paddingLeft: spacing.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  hint: {
    ...typography.caption,
  },
});
