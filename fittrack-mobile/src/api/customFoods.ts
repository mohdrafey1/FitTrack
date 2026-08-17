import { api } from './client';
import type {
  ApiEnvelope,
  CategoryOption,
  CreateCustomFoodPayload,
  CustomFood,
} from '@/types/api';

export const customFoodsApi = {
  async list(params: { search?: string; category?: string; limit?: number } = {}): Promise<CustomFood[]> {
    const { data } = await api.get<ApiEnvelope<CustomFood[]>>('/api/custom-foods', {
      params: { limit: 100, ...params },
    });
    return data.data;
  },

  async create(payload: CreateCustomFoodPayload): Promise<CustomFood> {
    const { data } = await api.post<ApiEnvelope<CustomFood>>('/api/custom-foods', payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/custom-foods/${id}`);
  },

  /** Bump usage count so frequently-logged foods sort first. Best-effort. */
  async incrementUsage(id: string): Promise<void> {
    await api.post(`/api/custom-foods/${id}/use`);
  },

  async getCategories(): Promise<CategoryOption[]> {
    const { data } = await api.get<ApiEnvelope<CategoryOption[]>>(
      '/api/custom-foods/categories/list'
    );
    return data.data;
  },
};
