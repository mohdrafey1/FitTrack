import { useRouter } from 'expo-router';
import { Save } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { Screen } from '@/components/Screen';
import { colors, gradients, layout, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { ActivityLevel, FitnessGoal, Gender } from '@/types/api';
import { ACTIVITY_LEVEL_LABELS, FITNESS_GOAL_LABELS, GENDER_LABELS } from '@/utils/format';
import { haptics } from '@/utils/haptics';

interface FormState {
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

type Errors = Partial<Record<keyof FormState | 'general', string>>;

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    currentWeight: user?.currentWeight?.toString() ?? '',
    targetWeight: user?.targetWeight?.toString() ?? '',
    targetDailyCalories: user?.targetDailyCalories?.toString() ?? '',
    targetDailyProteins: user?.targetDailyProteins?.toString() ?? '',
    targetDailyWater: user?.targetDailyWater?.toString() ?? '',
    age: user?.age?.toString() ?? '',
    height: user?.height?.toString() ?? '',
    gender: user?.gender ?? 'other',
    activityLevel: user?.activityLevel ?? 'moderately_active',
    fitnessGoal: user?.fitnessGoal ?? 'general_fitness',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    const inRange = (raw: string, min: number, max: number) => {
      const value = parseFloat(raw);
      return !Number.isNaN(value) && value >= min && value <= max;
    };
    if (!inRange(form.currentWeight, 20, 300)) next.currentWeight = 'Between 20 and 300 kg';
    if (!inRange(form.targetWeight, 20, 300)) next.targetWeight = 'Between 20 and 300 kg';
    if (!inRange(form.targetDailyCalories, 800, 5000))
      next.targetDailyCalories = 'Between 800 and 5000';
    if (!inRange(form.targetDailyProteins, 20, 500)) next.targetDailyProteins = 'Between 20 and 500 g';
    if (!inRange(form.targetDailyWater, 500, 10000)) next.targetDailyWater = 'Between 500 and 10000 ml';
    if (form.age && !inRange(form.age, 13, 120)) next.age = 'Between 13 and 120';
    if (form.height && !inRange(form.height, 100, 250)) next.height = 'Between 100 and 250 cm';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    const result = await updateProfile({
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
      haptics.success();
      showToast('Profile updated');
      router.back();
    } else {
      setErrors({ general: result.error });
    }
  };

  return (
    <Screen keyboardAvoiding padTop={Platform.OS === 'android'}>
      <View style={styles.topSpacer} />
      <ModalHeader title="Edit Profile" subtitle="Update your metrics and daily goals" />

      {!!errors.general && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errors.general}</Text>
        </View>
      )}

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Body metrics</Text>
        <View style={styles.rowPair}>
          <Input
            label="Current weight (kg)"
            value={form.currentWeight}
            onChangeText={(v) => set('currentWeight', v)}
            keyboardType="numeric"
            error={errors.currentWeight}
            containerStyle={styles.flexOne}
          />
          <Input
            label="Target weight (kg)"
            value={form.targetWeight}
            onChangeText={(v) => set('targetWeight', v)}
            keyboardType="numeric"
            error={errors.targetWeight}
            containerStyle={styles.flexOne}
          />
        </View>
        <View style={styles.rowPair}>
          <Input
            label="Age"
            value={form.age}
            onChangeText={(v) => set('age', v)}
            keyboardType="number-pad"
            error={errors.age}
            containerStyle={styles.flexOne}
          />
          <Input
            label="Height (cm)"
            value={form.height}
            onChangeText={(v) => set('height', v)}
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

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Daily targets</Text>
        <View style={styles.rowPair}>
          <Input
            label="Calories"
            value={form.targetDailyCalories}
            onChangeText={(v) => set('targetDailyCalories', v)}
            keyboardType="number-pad"
            error={errors.targetDailyCalories}
            containerStyle={styles.flexOne}
          />
          <Input
            label="Protein (g)"
            value={form.targetDailyProteins}
            onChangeText={(v) => set('targetDailyProteins', v)}
            keyboardType="number-pad"
            error={errors.targetDailyProteins}
            containerStyle={styles.flexOne}
          />
        </View>
        <Input
          label="Water (ml)"
          value={form.targetDailyWater}
          onChangeText={(v) => set('targetDailyWater', v)}
          keyboardType="number-pad"
          error={errors.targetDailyWater}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Goals & lifestyle</Text>
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
      </Card>

      <GradientButton
        label="Save Changes"
        icon={Save}
        gradient={gradients.brand}
        onPress={handleSubmit}
        loading={submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topSpacer: {
    height: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderWidth: layout.border,
    borderColor: colors.dangerBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    ...typography.label,
    color: colors.danger,
  },
  section: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading,
  },
  fieldLabel: {
    ...typography.labelStrong,
    marginBottom: spacing.sm,
  },
  rowPair: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flexOne: {
    flex: 1,
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
});
