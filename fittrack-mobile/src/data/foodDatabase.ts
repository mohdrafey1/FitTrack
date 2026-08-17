import type { FoodCategory, ServingSizes } from '@/types/api';

/**
 * Built-in food database with nutritional values per 100g.
 * Mirrors fittrack-frontend/src/data/foodDatabase.js so both clients log
 * identical foods against the shared backend.
 */

export interface DatabaseFood {
  id: number;
  name: string;
  category: FoodCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSizes: ServingSizes;
}

export const foodDatabase: DatabaseFood[] = [
  {
    id: 1,
    name: 'Roti/Chapati',
    category: 'carbs',
    calories: 297,
    protein: 12,
    carbs: 51,
    fat: 7,
    servingSizes: { small: 35, medium: 70, large: 100 },
  },
  {
    id: 2,
    name: 'Bread',
    category: 'carbs',
    calories: 265,
    protein: 9,
    carbs: 49,
    fat: 3.2,
    servingSizes: { small: 13, medium: 26, large: 39 },
  },
  {
    id: 3,
    name: 'Milk',
    category: 'dairy',
    calories: 42,
    protein: 3.4,
    carbs: 5,
    fat: 1,
    servingSizes: { small: 150, medium: 200, large: 250 },
  },
  {
    id: 4,
    name: 'Curd/Yogurt',
    category: 'dairy',
    calories: 61,
    protein: 3.5,
    carbs: 4.7,
    fat: 3.3,
    servingSizes: { small: 50, medium: 100, large: 200 },
  },
  {
    id: 5,
    name: 'Chicken Breast',
    category: 'protein',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    servingSizes: { small: 100, medium: 150, large: 200 },
  },
  {
    id: 6,
    name: 'Eggs',
    category: 'protein',
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    servingSizes: { small: 50, medium: 100, large: 150 },
  },
  {
    id: 7,
    name: 'Paneer',
    category: 'protein',
    calories: 265,
    protein: 18,
    carbs: 3.4,
    fat: 20,
    servingSizes: { small: 50, medium: 100, large: 150 },
  },
  {
    id: 8,
    name: 'Dal (Lentils)',
    category: 'protein',
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    servingSizes: { small: 100, medium: 150, large: 200 },
  },
  {
    id: 9,
    name: 'Rice',
    category: 'carbs',
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    servingSizes: { small: 100, medium: 150, large: 200 },
  },
  {
    id: 10,
    name: 'Banana',
    category: 'fruit',
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    servingSizes: { small: 100, medium: 150, large: 200 },
  },
  {
    id: 11,
    name: 'Lady Finger (Bhindi)',
    category: 'vegetable',
    calories: 33,
    protein: 2,
    carbs: 7,
    fat: 0.2,
    servingSizes: { small: 50, medium: 100, large: 150 },
  },
  {
    id: 12,
    name: 'Apple',
    category: 'fruit',
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    servingSizes: { small: 100, medium: 150, large: 200 },
  },
  {
    id: 13,
    name: 'Biscuits',
    category: 'snack',
    calories: 502,
    protein: 6,
    carbs: 62,
    fat: 25,
    servingSizes: { small: 20, medium: 30, large: 50 },
  },
  {
    id: 14,
    name: 'Chocolate',
    category: 'snack',
    calories: 546,
    protein: 4.9,
    carbs: 61,
    fat: 31,
    servingSizes: { small: 20, medium: 30, large: 50 },
  },
  {
    id: 15,
    name: 'Sponge Gourd (Nenua)',
    category: 'vegetable',
    calories: 20,
    protein: 1.2,
    carbs: 4.3,
    fat: 0.1,
    servingSizes: { small: 20, medium: 40, large: 80 },
  },
];

/** Nutrition scaled to a quantity in grams (values are per 100g). */
export function calculateMacros(
  food: Pick<DatabaseFood, 'calories' | 'protein' | 'carbs' | 'fat'>,
  quantityGrams: number
) {
  const multiplier = quantityGrams / 100;
  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10,
  };
}
