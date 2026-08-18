import { api } from './client';
import type {
  AiSuggestionResult,
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

  async getById(id: string): Promise<CustomFood> {
    const { data } = await api.get<ApiEnvelope<CustomFood>>(`/api/custom-foods/${id}`);
    return data.data;
  },

  async create(payload: CreateCustomFoodPayload): Promise<CustomFood> {
    const { data } = await api.post<ApiEnvelope<CustomFood>>('/api/custom-foods', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<CreateCustomFoodPayload>): Promise<CustomFood> {
    const { data } = await api.put<ApiEnvelope<CustomFood>>(`/api/custom-foods/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/custom-foods/${id}`);
  },

  /** Bump usage count so frequently-logged foods sort first. Best-effort. */
  async incrementUsage(id: string): Promise<void> {
    await api.post(`/api/custom-foods/${id}/use`);
  },

  /**
   * Ask the server to estimate per-100g nutrition for a food name.
   *
   * The Gemini call happens on the backend so the API key never ships inside
   * the app bundle. Values come back already reconciled against the CustomFood
   * validation rules, so they can be written straight into the form.
   *
   * Throws with status 503 when the server has no AI key configured.
   */
  async aiSuggest(name: string, description?: string): Promise<AiSuggestionResult> {
    const { data } = await api.post<AiSuggestionResult & { success: boolean }>(
      '/api/custom-foods/ai-suggest',
      { name, description },
      // The model call is slower than a database read; the default 15s client
      // timeout would fire before the server's own 20s ceiling.
      { timeout: 30000 }
    );
    return { data: data.data, meta: data.meta };
  },

  async getCategories(): Promise<CategoryOption[]> {
    const { data } = await api.get<ApiEnvelope<CategoryOption[]>>(
      '/api/custom-foods/categories/list'
    );
    return data.data;
  },
};
