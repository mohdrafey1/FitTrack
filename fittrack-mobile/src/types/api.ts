/**
 * Types describing the existing FitTrack backend API
 * (fittrack-backend — Express + MongoDB). These mirror the JSON the server
 * already returns today; the mobile app introduces no backend changes.
 */

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

export type FitnessGoal =
  | 'weight_loss'
  | 'muscle_gain'
  | 'endurance'
  | 'strength'
  | 'general_fitness';

export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  currentWeight: number;
  targetWeight: number;
  targetDailyCalories: number;
  targetDailyProteins: number;
  targetDailyWater: number;
  age?: number;
  height?: number;
  gender?: Gender;
  activityLevel?: ActivityLevel;
  fitnessGoal?: FitnessGoal;
  /** Virtuals serialized by the backend. */
  bmi?: string | null;
  weightDifference?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  currentWeight: number;
  targetWeight: number;
  targetDailyCalories: number;
  targetDailyProteins: number;
  targetDailyWater: number;
  age?: number;
  height?: number;
  gender?: Gender;
  activityLevel?: ActivityLevel;
  fitnessGoal?: FitnessGoal;
}

export type ProfileUpdatePayload = Partial<Omit<SignupPayload, 'username' | 'email' | 'password'>>;

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

/** A single food item logged within a day's entry. */
export interface LoggedFood {
  _id: string;
  foodId: number;
  foodName: string;
  quantity: number;
  unit: 'g' | 'ml';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  timestamp?: string;
}

/** One day's tracking document. */
export interface FoodEntry {
  _id: string;
  date: string;
  foods: LoggedFood[];
  water: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AnalyticsData {
  period: { days: number; startDate: string; endDate: string };
  summary: {
    totalEntries: number;
    avgCalories: number;
    avgProtein: number;
    avgWater: number;
    totalCalories: number;
    totalProtein: number;
    totalWater: number;
  };
  bestDays: {
    calories: { date: string; value: number } | null;
    protein: { date: string; value: number } | null;
    water: { date: string; value: number } | null;
  };
  entries: AnalyticsEntry[];
}

export interface AnalyticsEntry {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  foodCount: number;
}

export type FoodCategory =
  | 'protein'
  | 'carbs'
  | 'fruit'
  | 'vegetable'
  | 'dairy'
  | 'nuts'
  | 'snack'
  | 'beverage'
  | 'grain'
  | 'fat'
  | 'other';

export interface ServingSizes {
  small: number;
  medium: number;
  large: number;
}

export interface CustomFood {
  _id: string;
  name: string;
  category: FoodCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  servingSizes: ServingSizes;
  brand?: string;
  description?: string;
  usageCount?: number;
}

export interface CreateCustomFoodPayload {
  name: string;
  category: FoodCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  servingSizes?: ServingSizes;
  brand?: string;
  description?: string;
}

export interface CategoryOption {
  value: FoodCategory;
  label: string;
  icon: string;
}

export interface AddFoodPayload {
  foodId: number | string;
  foodName: string;
  quantity: number;
  unit: 'g' | 'ml';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  isCustomFood?: boolean;
}
