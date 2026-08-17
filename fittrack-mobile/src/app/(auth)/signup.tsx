import { Link } from 'expo-router';
import { Ruler, Target, User as UserIcon, UserPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { colors, gradients, palette, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { ActivityLevel, FitnessGoal, Gender } from '@/types/api';
import { ACTIVITY_LEVEL_LABELS, FITNESS_GOAL_LABELS, GENDER_LABELS } from '@/utils/format';

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  currentWeight: string;
  targetWeight: string;
  targetDailyCalories: string;
  targetDailyProteins: string;
  targetDailyWater: string;
  age: string;
  height: string;
  gender: Gender;
  activityLevel: ActivityLevel;
  fitnessGoal: FitnessGoal;
}

const INITIAL_FORM: FormState = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  currentWeight: '',
  targetWeight: '',
  targetDailyCalories: '2000',
  targetDailyProteins: '150',
  targetDailyWater: '2500',
  age: '',
  height: '',
  gender: 'other',
  activityLevel: 'moderately_active',
  fitnessGoal: 'general_fitness',
};

type Errors = Partial<Record<keyof FormState | 'general', string>>;

export default function SignupScreen() {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] || e.general ? { ...e, [key]: undefined, general: undefined } : e));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    const numberIn = (raw: string, min: number, max: number) => {
      const value = parseFloat(raw);
      return !Number.isNaN(value) && value >= min && value <= max;
    };

    if (form.username.trim().length < 3) next.username = 'At least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim()))
      next.username = 'Only letters, numbers and underscores';
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) next.email = 'Enter a valid email';
    if (form.password.length < 6) next.password = 'At least 6 characters';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    if (!numberIn(form.currentWeight, 20, 300)) next.currentWeight = 'Between 20 and 300 kg';
    if (!numberIn(form.targetWeight, 20, 300)) next.targetWeight = 'Between 20 and 300 kg';
    if (!numberIn(form.targetDailyCalories, 800, 5000))
      next.targetDailyCalories = 'Between 800 and 5000';
    if (!numberIn(form.targetDailyProteins, 20, 500)) next.targetDailyProteins = 'Between 20 and 500 g';
    if (!numberIn(form.targetDailyWater, 500, 10000)) next.targetDailyWater = 'Between 500 and 10000 ml';
    if (form.age && !numberIn(form.age, 13, 120)) next.age = 'Between 13 and 120';
    if (form.height && !numberIn(form.height, 100, 250)) next.height = 'Between 100 and 250 cm';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    const result = await signup({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      currentWeight: parseFloat(form.currentWeight),
      targetWeight: parseFloat(form.targetWeight),
      targetDailyCalories: parseInt(form.targetDailyCalories, 10),
      targetDailyProteins: parseInt(form.targetDailyProteins, 10),
      targetDailyWater: parseInt(form.targetDailyWater, 10),
      age: form.age ? parseInt(form.age, 10) : undefined,
      height: form.height ? parseInt(form.height, 10) : undefined,
      gender: form.gender,
      activityLevel: form.activityLevel,
      fitnessGoal: form.fitnessGoal,
    });
    setSubmitting(false);
    if (result.success) {
      showToast(`Welcome to FitTrack, ${form.username.trim()}!`);
    } else {
      setErrors({ general: result.error });
    }
  };

  return (
    <Screen keyboardAvoiding>
      <View style={styles.hero}>
        <BrandMark size={52} />
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Set up your profile for personalized tracking</Text>
      </View>

      {!!errors.general && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errors.general}</Text>
        </View>
      )}

      {/* Account */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <UserIcon size={18} color={palette.blue600} />
          <Text style={styles.sectionTitle}>Account</Text>
        </View>
        <Input
          label="Username"
          value={form.username}
          onChangeText={(v) => set('username', v)}
          placeholder="fituser_01"
          autoCapitalize="none"
          error={errors.username}
        />
        <Input
          label="Email"
          value={form.email}
          onChangeText={(v) => set('email', v)}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
        />
        <Input
          label="Password"
          value={form.password}
          onChangeText={(v) => set('password', v)}
          placeholder="Minimum 6 characters"
          password
          textContentType="oneTimeCode"
          error={errors.password}
        />
        <Input
          label="Confirm password"
          value={form.confirmPassword}
          onChangeText={(v) => set('confirmPassword', v)}
          placeholder="Repeat your password"
          password
          textContentType="oneTimeCode"
          error={errors.confirmPassword}
        />
      </Card>

      {/* Body metrics */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ruler size={18} color={palette.emerald600} />
          <Text style={styles.sectionTitle}>Body metrics</Text>
        </View>
        <View style={styles.rowPair}>
          <Input
            label="Current weight (kg)"
            value={form.currentWeight}
            onChangeText={(v) => set('currentWeight', v)}
            placeholder="70"
            keyboardType="numeric"
            error={errors.currentWeight}
            containerStyle={styles.flexOne}
          />
          <Input
            label="Target weight (kg)"
            value={form.targetWeight}
            onChangeText={(v) => set('targetWeight', v)}
            placeholder="65"
            keyboardType="numeric"
            error={errors.targetWeight}
            containerStyle={styles.flexOne}
          />
        </View>
        <View style={styles.rowPair}>
          <Input
            label="Age (optional)"
            value={form.age}
            onChangeText={(v) => set('age', v)}
            placeholder="25"
            keyboardType="number-pad"
            error={errors.age}
            containerStyle={styles.flexOne}
          />
          <Input
            label="Height, cm (optional)"
            value={form.height}
            onChangeText={(v) => set('height', v)}
            placeholder="175"
            keyboardType="number-pad"
            error={errors.height}
            containerStyle={styles.flexOne}
          />
        </View>
        <View>
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.chipRow}>
            {(Object.keys(GENDER_LABELS) as Gender[]).map((option) => (
              <Chip
                key={option}
                label={GENDER_LABELS[option]}
                selected={form.gender === option}
                onPress={() => set('gender', option)}
                style={styles.flexOne}
              />
            ))}
          </View>
        </View>
      </Card>

      {/* Goals */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={18} color={palette.orange500} />
          <Text style={styles.sectionTitle}>Goals & lifestyle</Text>
        </View>
        <View>
          <Text style={styles.fieldLabel}>Fitness goal</Text>
          <View style={styles.chipWrap}>
            {(Object.keys(FITNESS_GOAL_LABELS) as FitnessGoal[]).map((option) => (
              <Chip
                key={option}
                label={FITNESS_GOAL_LABELS[option]}
                selected={form.fitnessGoal === option}
                onPress={() => set('fitnessGoal', option)}
              />
            ))}
          </View>
        </View>
        <View>
          <Text style={styles.fieldLabel}>Activity level</Text>
          <View style={styles.chipWrap}>
            {(Object.keys(ACTIVITY_LEVEL_LABELS) as ActivityLevel[]).map((option) => (
              <Chip
                key={option}
                label={ACTIVITY_LEVEL_LABELS[option]}
                selected={form.activityLevel === option}
                onPress={() => set('activityLevel', option)}
              />
            ))}
          </View>
        </View>
        <View style={styles.rowPair}>
          <Input
            label="Daily calories"
            value={form.targetDailyCalories}
            onChangeText={(v) => set('targetDailyCalories', v)}
            keyboardType="number-pad"
            error={errors.targetDailyCalories}
            containerStyle={styles.flexOne}
          />
          <Input
            label="Daily protein (g)"
            value={form.targetDailyProteins}
            onChangeText={(v) => set('targetDailyProteins', v)}
            keyboardType="number-pad"
            error={errors.targetDailyProteins}
            containerStyle={styles.flexOne}
          />
        </View>
        <Input
          label="Daily water (ml)"
          value={form.targetDailyWater}
          onChangeText={(v) => set('targetDailyWater', v)}
          keyboardType="number-pad"
          error={errors.targetDailyWater}
        />
      </Card>

      <GradientButton
        label="Create Account"
        icon={UserPlus}
        onPress={handleSubmit}
        loading={submitting}
        gradient={gradients.brand}
        style={styles.submit}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/login" style={styles.footerLink}>
          Sign in
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    color: palette.red600,
    fontSize: 13.5,
  },
  section: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  rowPair: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flexOne: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  submit: {
    marginTop: spacing.sm,
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
