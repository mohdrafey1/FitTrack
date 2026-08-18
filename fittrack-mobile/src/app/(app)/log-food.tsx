import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, PackagePlus, Plus, Search, UtensilsCrossed } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { getApiErrorMessage } from '@/api/client';
import { customFoodsApi } from '@/api/customFoods';
import { foodApi } from '@/api/food';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { GradientButton } from '@/components/GradientButton';
import { Input } from '@/components/Input';
import { ModalHeader } from '@/components/ModalHeader';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { colors, gradients, layout, motion, palette, radius, spacing, typography } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { foodDatabase, calculateMacros } from '@/data/foodDatabase';
import { haptics } from '@/utils/haptics';
import type { CustomFood, ServingSizes } from '@/types/api';

/** A food the user can pick — built-in or their own custom food. */
interface SelectableFood {
  key: string;
  /** Value sent to the backend as `foodId` (number for built-in, _id for custom — same as the web app). */
  foodId: number | string;
  name: string;
  category: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSizes: ServingSizes;
  isCustom: boolean;
  customId?: string;
}

type ServingChoice = keyof ServingSizes | 'custom';

export default function LogFoodScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [selected, setSelected] = useState<SelectableFood | null>(null);
  const [serving, setServing] = useState<ServingChoice>('medium');
  const [customGrams, setCustomGrams] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // (Re)load custom foods whenever this screen gains focus, so foods created
  // in the "New custom food" modal appear immediately.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      customFoodsApi
        .list()
        .then((foods) => {
          if (!cancelled) setCustomFoods(foods);
        })
        .catch(() => {
          // Built-in database still works offline from the API.
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const allFoods = useMemo<SelectableFood[]>(() => {
    const builtIn = foodDatabase.map<SelectableFood>((food) => ({
      key: `db-${food.id}`,
      foodId: food.id,
      name: food.name,
      category: food.category,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servingSizes: food.servingSizes,
      isCustom: false,
    }));
    const custom = customFoods.map<SelectableFood>((food) => ({
      key: `custom-${food._id}`,
      foodId: food._id,
      name: food.name,
      category: food.category,
      brand: food.brand,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servingSizes: food.servingSizes ?? { small: 50, medium: 100, large: 150 },
      isCustom: true,
      customId: food._id,
    }));
    return [...builtIn, ...custom];
  }, [customFoods]);

  const filteredFoods = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return allFoods;
    return allFoods.filter(
      (food) =>
        food.name.toLowerCase().includes(query) || food.category.toLowerCase().includes(query)
    );
  }, [allFoods, searchTerm]);

  const quantityGrams = useMemo(() => {
    if (!selected) return 0;
    if (serving === 'custom') {
      const parsed = parseFloat(customGrams);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return selected.servingSizes[serving] ?? 0;
  }, [selected, serving, customGrams]);

  const nutrition = useMemo(() => {
    if (!selected || quantityGrams <= 0) return null;
    const macros = calculateMacros(selected, quantityGrams);
    // The backend rejects 0-calorie entries — force a slightly larger portion.
    if (macros.calories <= 0) return null;
    return macros;
  }, [selected, quantityGrams]);

  const selectFood = (food: SelectableFood) => {
    setSelected(food);
    setServing('medium');
    setCustomGrams('');
  };

  const handleAdd = async () => {
    if (!selected || !nutrition || submitting) return;
    setSubmitting(true);
    try {
      await foodApi.addFood({
        foodId: selected.foodId,
        foodName: selected.name,
        quantity: quantityGrams,
        unit: 'g',
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        servingSize:
          serving === 'custom' ? `${quantityGrams}g` : `${serving} (${quantityGrams}g)`,
        isCustomFood: selected.isCustom,
      });
      if (selected.isCustom && selected.customId) {
        customFoodsApi.incrementUsage(selected.customId).catch(() => {});
      }
      haptics.success();
      showToast(`${selected.name} added`);
      router.back();
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Failed to add food'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen keyboardAvoiding padTop={Platform.OS === 'android'}>
      <View style={styles.topSpacer} />
      <ModalHeader
        title="Add Food"
        subtitle="Log a meal for today"
        right={
          <PressableScale
            onPress={() => router.push('/create-food')}
            haptic="selection"
            accessibilityLabel="Create a new custom food"
            style={styles.newFoodButton}>
            <PackagePlus size={layout.icon.sm} color={palette.orange600} />
            <Text style={styles.newFoodText}>New</Text>
          </PressableScale>
        }
      />

      {!selected ? (
        <>
          <Input
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search foods (e.g. paneer, rice)..."
            autoCorrect={false}
            containerStyle={styles.searchField}
          />

          {filteredFoods.length > 0 ? (
            <Card style={styles.listCard}>
              {filteredFoods.map((food, index) => (
                <PressableScale
                  key={food.key}
                  onPress={() => selectFood(food)}
                  scaleTo={motion.press.scaleSubtle}
                  haptic="selection"
                  accessibilityLabel={`${food.name}, ${food.calories} calories per 100 grams`}
                  style={[styles.foodRow, index > 0 && styles.foodRowBorder]}>
                  <View style={styles.foodInfo}>
                    <View style={styles.foodNameRow}>
                      <Text style={styles.foodName} numberOfLines={1}>
                        {food.name}
                      </Text>
                      {food.isCustom && (
                        <View style={styles.customBadge}>
                          <Text style={styles.customBadgeText}>Custom</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.foodCategory} numberOfLines={1}>
                      {food.category}
                      {food.brand ? ` • ${food.brand}` : ''}
                    </Text>
                  </View>
                  <View style={styles.foodCalories}>
                    <Text style={styles.foodCaloriesValue}>{food.calories} cal</Text>
                    <Text style={styles.foodCaloriesUnit}>per 100g</Text>
                  </View>
                </PressableScale>
              ))}
            </Card>
          ) : (
            <Card>
              <View style={styles.emptyState}>
                <Search size={26} color={colors.textFaint} />
                <Text style={styles.emptyTitle}>No foods found for “{searchTerm}”</Text>
                <GradientButton
                  label="Create Custom Food"
                  icon={Plus}
                  small
                  gradient={gradients.calories}
                  onPress={() => router.push('/create-food')}
                />
              </View>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Selected food */}
          <Card style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedTitleGroup}>
                <View style={styles.selectedIcon}>
                  <UtensilsCrossed size={layout.icon.md} color={palette.orange600} />
                </View>
                <View style={styles.flexOne}>
                  <Text style={styles.selectedName} numberOfLines={1}>
                    {selected.name}
                  </Text>
                  <Text style={styles.foodCategory}>
                    {selected.calories} cal • {selected.protein}g protein per 100g
                  </Text>
                </View>
              </View>
              <PressableScale
                onPress={() => setSelected(null)}
                hitSlop={layout.hitSlop}
                haptic="selection"
                accessibilityLabel="Pick a different food"
                style={styles.changeButton}>
                <ChevronLeft size={layout.icon.sm} color={colors.textSecondary} />
                <Text style={styles.changeButtonText}>Change</Text>
              </PressableScale>
            </View>

            <Text style={styles.fieldLabel}>Serving size</Text>
            <View style={styles.servingRow}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <Chip
                  key={size}
                  label={size.charAt(0).toUpperCase() + size.slice(1)}
                  sublabel={`${selected.servingSizes[size]}g`}
                  selected={serving === size}
                  onPress={() => setServing(size)}
                  selectedColor={palette.orange500}
                  style={styles.servingChip}
                />
              ))}
              <Chip
                label="Custom"
                sublabel="grams"
                selected={serving === 'custom'}
                onPress={() => setServing('custom')}
                selectedColor={palette.orange500}
                style={styles.servingChip}
              />
            </View>

            {serving === 'custom' && (
              <Input
                value={customGrams}
                onChangeText={setCustomGrams}
                placeholder="Enter amount in grams"
                keyboardType="numeric"
                autoFocus
              />
            )}

            {nutrition && (
              <Animated.View
                entering={FadeIn.duration(motion.duration.fast)}
                layout={LinearTransition.duration(motion.duration.base)}
                style={styles.nutritionPreview}>
                <Text style={styles.nutritionTitle}>Nutrition ({quantityGrams}g)</Text>
                <View style={styles.nutritionGrid}>
                  <NutritionCell label="Calories" value={`${nutrition.calories}`} accent={palette.orange600} />
                  <NutritionCell label="Protein" value={`${nutrition.protein}g`} accent={palette.red600} />
                  <NutritionCell label="Carbs" value={`${nutrition.carbs}g`} accent={palette.amber600} />
                  <NutritionCell label="Fat" value={`${nutrition.fat}g`} accent={palette.purple600} />
                </View>
              </Animated.View>
            )}
          </Card>

          <GradientButton
            label="Add Food"
            icon={Plus}
            gradient={gradients.calories}
            onPress={handleAdd}
            disabled={!nutrition}
            loading={submitting}
          />
        </>
      )}
    </Screen>
  );
}

function NutritionCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.nutritionCell}>
      <Text style={[styles.nutritionValue, { color: accent }]}>{value}</Text>
      <Text style={styles.nutritionLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topSpacer: {
    height: spacing.md,
  },
  flexOne: {
    flex: 1,
  },
  newFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.orange100,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: layout.iconButton,
  },
  newFoodText: {
    ...typography.captionStrong,
    fontWeight: '700',
    color: palette.orange600,
  },
  searchField: {
    marginBottom: spacing.md,
  },
  listCard: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.md,
    borderRadius: radius.sm,
    minHeight: layout.tapTarget,
  },
  foodRowBorder: {
    borderTopWidth: layout.hairline,
    borderTopColor: colors.divider,
  },
  foodInfo: {
    flex: 1,
  },
  foodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  foodName: {
    ...typography.bodyStrong,
    flexShrink: 1,
  },
  customBadge: {
    backgroundColor: colors.infoBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  customBadgeText: {
    ...typography.micro,
    fontWeight: '700',
    color: palette.blue700,
  },
  foodCategory: {
    ...typography.caption,
    textTransform: 'capitalize',
  },
  foodCalories: {
    alignItems: 'flex-end',
  },
  foodCaloriesValue: {
    ...typography.numberSm,
  },
  foodCaloriesUnit: {
    ...typography.micro,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  selectedCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  selectedTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  selectedIcon: {
    width: layout.iconTile.md,
    height: layout.iconTile.md,
    borderRadius: radius.sm,
    backgroundColor: palette.orange100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedName: {
    ...typography.heading,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.fill,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: layout.iconButton,
  },
  changeButtonText: {
    ...typography.captionStrong,
  },
  fieldLabel: {
    ...typography.label,
  },
  servingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  servingChip: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  nutritionPreview: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: layout.border,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  nutritionTitle: {
    ...typography.labelStrong,
  },
  nutritionGrid: {
    flexDirection: 'row',
  },
  nutritionCell: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    ...typography.numberMd,
    fontWeight: '800',
  },
  nutritionLabel: {
    ...typography.micro,
    color: colors.textMuted,
  },
});
