import { Link } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { colors, gradients, palette, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>(
    {}
  );
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
    <Screen keyboardAvoiding>
      <View style={styles.hero}>
        <BrandMark size={64} />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue tracking your nutrition</Text>
      </View>

      <Card style={styles.form}>
        {!!errors.general && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errors.general}</Text>
          </View>
        )}

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
          autoComplete="email"
          textContentType="emailAddress"
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
          autoComplete="password"
          textContentType="password"
          error={errors.password}
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
        />

        <GradientButton
          label="Sign In"
          icon={LogIn}
          onPress={handleSubmit}
          loading={submitting}
          gradient={gradients.brand}
        />
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{"Don't have an account? "}</Text>
        <Link href="/signup" style={styles.footerLink}>
          Create one
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxxl * 1.5,
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: spacing.md,
  },
  errorBannerText: {
    color: palette.red600,
    fontSize: 13.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14.5,
  },
  footerLink: {
    color: palette.blue600,
    fontSize: 14.5,
    fontWeight: '600',
  },
});
