import { api } from './client';
import type { AddFoodPayload, AnalyticsData, ApiEnvelope, FoodEntry } from '@/types/api';

export const foodApi = {
  async getToday(): Promise<FoodEntry> {
    const { data } = await api.get<ApiEnvelope<FoodEntry>>('/api/food/today');
    return data.data;
  },

  /** @param date YYYY-MM-DD (UTC) */
  async getByDate(date: string): Promise<FoodEntry> {
    const { data } = await api.get<ApiEnvelope<FoodEntry>>(`/api/food/date/${date}`);
    return data.data;
  },

  /** Most recent `limit` days (backend fills missing days only where entries exist). */
  async getHistory(limit: number): Promise<FoodEntry[]> {
    const { data } = await api.get<ApiEnvelope<FoodEntry[]>>('/api/food/history', {
      params: { limit },
    });
    return data.data;
  },

  async addFood(payload: AddFoodPayload): Promise<FoodEntry> {
    const { data } = await api.post<ApiEnvelope<FoodEntry>>('/api/food/add', payload);
    return data.data;
  },

  /** Removes a food item from *today's* entry (backend restriction). */
  async removeFood(loggedFoodId: string): Promise<FoodEntry> {
    const { data } = await api.delete<ApiEnvelope<FoodEntry>>(`/api/food/remove/${loggedFoodId}`);
    return data.data;
  },

  /** Adds (positive) or removes (negative) water in ml for today. */
  async updateWater(amountMl: number): Promise<FoodEntry> {
    const { data } = await api.post<ApiEnvelope<FoodEntry>>('/api/food/water', {
      amount: amountMl,
    });
    return data.data;
  },

  async getAnalytics(days: number): Promise<AnalyticsData> {
    const { data } = await api.get<ApiEnvelope<AnalyticsData>>('/api/food/analytics', {
      params: { days },
    });
    return data.data;
  },
};
