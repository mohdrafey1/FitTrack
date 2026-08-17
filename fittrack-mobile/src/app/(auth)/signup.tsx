import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Mail,
  Ruler,
  Target,
  User as UserIcon,
  UserPlus,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { colors, gradients, palette, radius, shadows, spacing } from '@/constants/theme';
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
  age: string;
  height: string;
  gender: Gender;
  fitnessGoal: FitnessGoal;
  activityLevel: ActivityLevel;
  targetDailyCalories: string;
  targetDailyProteins: string;
  targetDailyWater: string;
}

const INITIAL_FORM: FormState = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  currentWeight: '',
  targetWeight: '',
  age: '',
  height: '',
  gender: 'other',
  fitnessGoal: 'general_fitness',
  activityLevel: 'moderately_active',
  targetDailyCalories: '2000',
  targetDailyProteins: '150',
  targetDailyWater: '2500',
};

type Errors = Partial<Record<keyof FormState | 'general', string>>;

const STEPS = [
  { title: 'Your account', subtitle: 'How you’ll sign in', icon: UserIcon },
  { title: 'About you', subtitle: 'Used to personalise your targets', icon: Ruler },
  { title: 'Your goals', subtitle: 'What you’re aiming for each day', icon: Target },
] as const;

const inRange = (raw: string, min: number, max: number) => {
  const value = parseFloat(raw);
  return !Number.isNaN(value) && value >= min && value <= max;
};

export default function SignupScreen() {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] || e.general ? { ...e, [key]: undefined, general: undefined } : e));
  };

  const validateStep = (index: number): boolean => {
    const next: Errors = {};

    if (index === 0) {
      if (form.username.trim().length < 3) next.username = 'At least 3 characters';
      else if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim()))
        next.username = 'Only letters, numbers and underscores';
      if (!/\S+@\S+\.\S+/.test(form.email.trim())) next.email = 'Enter a valid email';
      if (form.password.length < 6) next.password = 'At least 6 characters';
      if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    }

    if (index === 1) {
      if (!inRange(form.currentWeight, 20, 300)) next.currentWeight = 'Between 20 and 300 kg';
      if (!inRange(form.targetWeight, 20, 300)) next.targetWeight = 'Between 20 and 300 kg';
      if (form.age && !inRange(form.age, 13, 120)) next.age = 'Between 13 and 120';
      if (form.height && !inRange(form.height, 100, 250)) next.height = 'Between 100 and 250 cm';
    }

    if (index === 2) {
      if (!inRange(form.targetDailyCalories, 800, 5000))
        next.targetDailyCalories = 'Between 800 and 5000';
      if (!inRange(form.targetDailyProteins, 20, 500))
        next.targetDailyProteins = 'Between 20 and 500 g';
      if (!inRange(form.targetDailyWater, 500, 10000))
        next.targetDailyWater = 'Between 500 and 10000 ml';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goBack = () => {
    if (step === 0) router.back();
    else setStep((s) => s - 1);
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2) || submitting) return;
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
      // Account-level failures (duplicate email/username) belong to step 1.
      setErrors({ general: result.error });
      setStep(0);
    }
  };

  const current = STEPS[step];
  const StepIcon = current.icon;

  return (
    <Screen keyboardAvoiding padBottom={spacing.xl}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={step === 0 ? 'Back to sign in' : 'Previous step'}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}>
          <ArrowLeft size={20} color={palette.gray700} />
        </Pressable>
        <Text style={styles.stepCount}>
          Step {step + 1} of {STEPS.length}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        {STEPS.map((s, index) => (
          <View
            key={s.title}
            style={[
              styles.progressSegment,
              index <= step ? styles.progressSegmentDone : styles.progressSegmentTodo,
            ]}
          />
        ))}
      </View>

      {/* Step heading */}
      <View style={styles.stepHeading}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.stepIcon}>
          <StepIcon size={20} color={palette.white} strokeWidth={2.2} />
        </LinearGradient>
        <View style={styles.flexOne}>
          <Text style={styles.stepTitle}>{current.title}</Text>
          <Text style={styles.stepSubtitle}>{current.subtitle}</Text>
        </View>
      </View>

      {!!errors.general && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errors.general}</Text>
        </View>
      )}

      {/* Step content */}
      <View style={styles.card}>
        {step === 0 && (
          <View style={styles.fields}>
            <Input
              label="Username"
              value={form.username}
              onChangeText={(v) => set('username', v)}
              placeholder="fituser_01"
              autoCapitalize="none"
              autoCorrect={false}
              icon={UserIcon}
              error={errors.username}
            />
            <Input
              label="Email"
              value={form.email}
              onChangeText={(v) => set('email', v)}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon={Mail}
              error={errors.email}
            />
            <Input
              label="Password"
              value={form.password}
              onChangeText={(v) => set('password', v)}
              placeholder="Minimum 6 characters"
              password
              autoCapitalize="none"
              autoCorrect={false}
              icon={Lock}
              error={errors.password}
            />
            <Input
              label="Confirm password"
              value={form.confirmPassword}
              onChangeText={(v) => set('confirmPassword', v)}
              placeholder="Repeat your password"
              password
              autoCapitalize="none"
              autoCorrect={false}
              icon={Lock}
              error={errors.confirmPassword}
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.fields}>
            <View style={styles.row}>
              <Input
                label="Current weight"
                value={form.currentWeight}
                onChangeText={(v) => set('currentWeight', v)}
                placeholder="70"
                keyboardType="numeric"
                hint="kg"
                error={errors.currentWeight}
                containerStyle={styles.flexOne}
              />
              <Input
                label="Target weight"
                value={form.targetWeight}
                onChangeText={(v) => set('targetWeight', v)}
                placeholder="65"
                keyboardType="numeric"
                hint="kg"
                error={errors.targetWeight}
                containerStyle={styles.flexOne}
              />
            </View>
            <View style={styles.row}>
              <Input
                label="Age"
                value={form.age}
                onChangeText={(v) => set('age', v)}
                placeholder="25"
                keyboardType="number-pad"
                hint="Optional"
                error={errors.age}
                containerStyle={styles.flexOne}
              />
              <Input
                label="Height"
                value={form.height}
                onChangeText={(v) => set('height', v)}
                placeholder="175"
                keyboardType="number-pad"
                hint="cm · optional"
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
          </View>
        )}

        {step === 2 && (
          <View style={styles.fields}>
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

            <View style={styles.divider} />

            <Text style={styles.fieldLabel}>Daily targets</Text>
            <View style={styles.row}>
              <Input
                label="Calories"
                value={form.targetDailyCalories}
                onChangeText={(v) => set('targetDailyCalories', v)}
                keyboardType="number-pad"
                hint="kcal"
                error={errors.targetDailyCalories}
                containerStyle={styles.flexOne}
              />
              <Input
                label="Protein"
                value={form.targetDailyProteins}
                onChangeText={(v) => set('targetDailyProteins', v)}
                keyboardType="number-pad"
                hint="grams"
                error={errors.targetDailyProteins}
                containerStyle={styles.flexOne}
              />
            </View>
            <Input
              label="Water"
              value={form.targetDailyWater}
              onChangeText={(v) => set('targetDailyWater', v)}
              keyboardType="number-pad"
              hint="millilitres per day"
              error={errors.targetDailyWater}
            />
          </View>
        )}
      </View>

      {/* Navigation */}
      {step < STEPS.length - 1 ? (
        <GradientButton
          label="Continue"
          icon={ArrowRight}
          gradient={gradients.brand}
          onPress={goNext}
          style={styles.cta}
        />
      ) : (
        <GradientButton
          label="Create Account"
          icon={Check}
          gradient={gradients.brand}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.cta}
        />
      )}

      {step === 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable
            onPress={() => router.replace('/login')}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  progressSegmentDone: {
    backgroundColor: palette.blue600,
  },
  progressSegmentTodo: {
    backgroundColor: palette.gray200,
  },
  stepHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    ...shadows.card,
  },
  fields: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flexOne: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: spacing.xs,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    color: palette.red600,
    fontSize: 13.5,
    lineHeight: 19,
  },
  cta: {
    marginTop: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
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
