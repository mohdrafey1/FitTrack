import { useRouter } from 'expo-router';
import { PackagePlus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/client';
import { customFoodsApi } from '@/api/customFoods';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { Screen } from '@/components/Screen';
import { gradients, palette, spacing, typography } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import type { CategoryOption, FoodCategory } from '@/types/api';
import { haptics } from '@/utils/haptics';

/** Fallback if the categories endpoint is unreachable (matches the backend list). */
const DEFAULT_CATEGORIES: CategoryOption[] = [
  { value: 'protein', label: 'Protein', icon: '🥩' },
  { value: 'carbs', label: 'Carbohydrates', icon: '🍞' },
  { value: 'fruit', label: 'Fruits', icon: '🍎' },
  { value: 'vegetable', label: 'Vegetables', icon: '🥬' },
  { value: 'dairy', label: 'Dairy', icon: '🥛' },
  { value: 'nuts', label: 'Nuts & Seeds', icon: '🥜' },
  { value: 'snack', label: 'Snacks', icon: '🍪' },
  { value: 'beverage', label: 'Beverages', icon: '🥤' },
  { value: 'grain', label: 'Grains', icon: '🌾' },
  { value: 'fat', label: 'Fats & Oils', icon: '🫒' },
  { value: 'other', label: 'Other', icon: '🍽️' },
];

interface FormState {
  name: string;
  category: FoodCategory;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  brand: string;
  small: string;
  medium: string;
  large: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  name: '',
  category: 'other',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  fiber: '0',
  sugar: '0',
  brand: '',
  small: '50',
  medium: '100',
  large: '150',
};

export default function CreateFoodScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    customFoodsApi
      .getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    const calories = parseFloat(form.calories);
    const protein = parseFloat(form.protein);
    const carbs = parseFloat(form.carbs);
    const fat = parseFloat(form.fat);

    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!form.calories || Number.isNaN(calories) || calories <= 0)
      next.calories = 'Calories must be greater than 0';
    if (form.protein === '' || Number.isNaN(protein) || protein < 0)
      next.protein = 'Protein is required (0 or more)';
    if (form.carbs === '' || Number.isNaN(carbs) || carbs < 0)
      next.carbs = 'Carbs are required (0 or more)';
    if (form.fat === '' || Number.isNaN(fat) || fat < 0) next.fat = 'Fat is required (0 or more)';

    // Same sanity check as the web app + backend: macros must roughly explain
    // the calories (protein/carbs ×4, fat ×9), otherwise the API rejects it.
    if (!next.calories && !next.protein && !next.carbs && !next.fat) {
      const calculated = protein * 4 + carbs * 4 + fat * 9;
      if (Math.abs(calculated - calories) > calories * 0.1) {
        next.calories = `Calories don't match macros — expected ~${Math.round(calculated)} cal`;
      }
    }

    for (const size of ['small', 'medium', 'large'] as const) {
      const grams = parseFloat(form[size]);
      if (Number.isNaN(grams) || grams < 1 || grams > 1000) {
        next[size] = '1–1000g';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await customFoodsApi.create({
        name: form.name.trim(),
        category: form.category,
        calories: parseFloat(form.calories),
        protein: parseFloat(form.protein),
        carbs: parseFloat(form.carbs),
        fat: parseFloat(form.fat),
        fiber: parseFloat(form.fiber) || 0,
        sugar: parseFloat(form.sugar) || 0,
        brand: form.brand.trim() || undefined,
        servingSizes: {
          small: parseFloat(form.small),
          medium: parseFloat(form.medium),
          large: parseFloat(form.large),
        },
      });
      haptics.success();
      showToast(`${form.name.trim()} created`);
      router.back();
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Failed to create food'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen keyboardAvoiding padTop={Platform.OS === 'android'}>
      <View style={styles.topSpacer} />
      <ModalHeader title="New Custom Food" subtitle="Nutrition values are per 100g" />

      <Card style={styles.section}>
        <Input
          label="Food name"
          value={form.name}
          onChangeText={(v) => set('name', v)}
          placeholder="e.g. Protein Shake"
          error={errors.name}
        />
        <Input
          label="Brand (optional)"
          value={form.brand}
          onChangeText={(v) => set('brand', v)}
          placeholder="e.g. MyProtein"
        />
        <View>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chipWrap}>
            {categories.map((option) => (
              <Chip
                key={option.value}
                label={`${option.icon} ${option.label}`}
                selected={form.category === option.value}
                onPress={() => set('category', option.value)}
                selectedColor={palette.orange500}
              />
            ))}
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition per 100g</Text>
        <View style={styles.rowPair}>
          <Input
            label="Calories"
            value={form.calories}
            onChangeText={(v) => set('calories', v)}
            placeholder="250"
            keyboardType="numeric"
            error={errors.calories}
            containerStyle={styles.flexOne}
          />
          <Input
            label="Protein (g)"
            value={form.protein}
            onChangeText={(v) => set('protein', v)}
            placeholder="20"
            keyboardType="numeric"
            error={errors.protein}
            containerStyle={styles.flexOne}
          />
        </View>
        <View style={styles.rowPair}>
          <Input
            label="Carbs (g)"
            value={form.carbs}
            onChangeText={(v) => set('carbs', v)}
            placeholder="30"
            keyboardType="numeric"
            error={errors.carbs}
            containerStyle={styles.flexOne}
          />
          <Input
            label="Fat (g)"
            value={form.fat}
            onChangeText={(v) => set('fat', v)}
            placeholder="8"
            keyboardType="numeric"
            error={errors.fat}
            containerStyle={styles.flexOne}
          />
        </View>
        <View style={styles.rowPair}>
          <Input
            label="Fiber (g)"
            value={form.fiber}
            onChangeText={(v) => set('fiber', v)}
            keyboardType="numeric"
            containerStyle={styles.flexOne}
          />
          <Input
            label="Sugar (g)"
            value={form.sugar}
            onChangeText={(v) => set('sugar', v)}
            keyboardType="numeric"
            containerStyle={styles.flexOne}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Serving sizes (grams)</Text>
        <View style={styles.rowPair}>
          <Input
            label="Small"
            value={form.small}
            onChangeText={(v) => set('small', v)}
            keyboardType="numeric"
            error={errors.small}
            containerStyle={styles.flexOne}
          />
          <Input
            label="Medium"
            value={form.medium}
            onChangeText={(v) => set('medium', v)}
            keyboardType="numeric"
            error={errors.medium}
            containerStyle={styles.flexOne}
          />
          <Input
            label="Large"
            value={form.large}
            onChangeText={(v) => set('large', v)}
            keyboardType="numeric"
            error={errors.large}
            containerStyle={styles.flexOne}
          />
        </View>
      </Card>

      <GradientButton
        label="Create Food"
        icon={PackagePlus}
        gradient={gradients.calories}
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowPair: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flexOne: {
    flex: 1,
  },
});
