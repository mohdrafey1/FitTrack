import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { colors, gradients, layout, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { enter } from '@/utils/motion';

export default function LoginScreen() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      showToast('Welcome back!');
    } else {
      setErrors({ general: result.error });
    }
  };

  return (
    <Screen keyboardAvoiding padBottom={spacing.xl}>
      {/* Brand hero */}
      <Animated.View entering={enter(0)} style={styles.hero}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}>
          <Text style={styles.logoText}>FT</Text>
        </LinearGradient>
        <Text style={styles.appName}>FitTrack</Text>
        <Text style={styles.tagline}>Track calories, protein & hydration</Text>
      </Animated.View>

      {/* Form card */}
      <Animated.View entering={enter(1)} style={styles.card}>
        <Text style={styles.cardTitle}>Welcome back</Text>
        <Text style={styles.cardSubtitle}>Sign in to continue your progress</Text>

        {!!errors.general && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errors.general}</Text>
          </View>
        )}

        <View style={styles.fields}>
          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            icon={Mail}
            error={errors.email}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            placeholder="Your password"
            password
            autoCapitalize="none"
            autoCorrect={false}
            icon={Lock}
            error={errors.password}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />
        </View>

        <GradientButton
          label="Sign In"
          icon={ArrowRight}
          onPress={handleSubmit}
          loading={submitting}
          gradient={gradients.brand}
        />
      </Animated.View>

      {/* Footer */}
      <Animated.View entering={enter(2)} style={styles.footer}>
        <Text style={styles.footerText}>New to FitTrack?</Text>
        <PressableScale
          onPress={() => router.push('/signup')}
          hitSlop={layout.hitSlop}
          haptic="selection"
          accessibilityLabel="Create an account">
          <Text style={styles.footerLink}>Create an account</Text>
        </PressableScale>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
    marginBottom: spacing.xl,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.raised,
  },
  logoText: {
    ...typography.numberXl,
    fontWeight: '800',
    color: colors.onGradient,
    letterSpacing: 1,
  },
  appName: {
    ...typography.brand,
    marginTop: spacing.md,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: layout.border,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.display,
  },
  cardSubtitle: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  fields: {
    gap: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderWidth: layout.border,
    borderColor: colors.dangerBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  errorBannerText: {
    ...typography.label,
    color: colors.danger,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.body,
    color: colors.textMuted,
  },
  footerLink: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.primary,
  },
});
