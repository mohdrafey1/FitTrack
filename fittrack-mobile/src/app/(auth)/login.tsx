import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { colors, gradients, palette, radius, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

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
      <View style={styles.hero}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}>
          <Text style={styles.logoText}>FT</Text>
        </LinearGradient>
        <Text style={styles.appName}>FitTrack</Text>
        <Text style={styles.tagline}>Track calories, protein & hydration</Text>
      </View>

      {/* Form card */}
      <View style={styles.card}>
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
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>New to FitTrack?</Text>
        <Pressable
          onPress={() => router.push('/signup')}
          hitSlop={8}
          accessibilityRole="button"
          style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Text style={styles.footerLink}>Create an account</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginTop: spacing.xxxl * 1.4,
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  logoText: {
    color: palette.white,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: palette.indigo700,
    marginTop: spacing.lg,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14.5,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xxl,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  fields: {
    gap: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  errorBannerText: {
    color: palette.red600,
    fontSize: 13.5,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  footerLink: {
    color: palette.blue600,
    fontSize: 15,
    fontWeight: '700',
  },
});
