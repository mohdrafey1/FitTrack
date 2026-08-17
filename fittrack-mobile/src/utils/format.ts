export function formatNumber(value: number | undefined | null): string {
  return value ? value.toLocaleString() : '0';
}

/** "1.5L" above a litre, otherwise "750ml". */
export function formatWater(amountMl: number): string {
  if (amountMl >= 1000) return `${(amountMl / 1000).toFixed(1)}L`;
  return `${amountMl}ml`;
}

export function progressPercent(consumed: number, target: number): number {
  if (!target) return 0;
  return Math.min((consumed / target) * 100, 100);
}

/** Unclamped percentage, for "112% of goal" labels. */
export function rawPercent(consumed: number, target: number): number {
  if (!target) return 0;
  return Math.round((consumed / target) * 100);
}

export function bmiCategory(bmi: number): { text: string; color: string } {
  if (bmi < 18.5) return { text: 'Underweight', color: '#2563EB' };
  if (bmi < 25) return { text: 'Normal', color: '#16A34A' };
  if (bmi < 30) return { text: 'Overweight', color: '#EA580C' };
  return { text: 'Obese', color: '#DC2626' };
}

export const ACTIVITY_LEVEL_LABELS: Record<string, string> = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly active',
  moderately_active: 'Moderately active',
  very_active: 'Very active',
  extremely_active: 'Extremely active',
};

export const FITNESS_GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Weight loss',
  muscle_gain: 'Muscle gain',
  endurance: 'Endurance',
  strength: 'Strength',
  general_fitness: 'General fitness',
};

export const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};
