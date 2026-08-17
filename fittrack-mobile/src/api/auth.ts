import { api } from './client';
import type { AuthResponse, ProfileUpdatePayload, SignupPayload, User } from '@/types/api';

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
    return data;
  },

  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/signup', payload);
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<{ user: User }>('/api/auth/me');
    return data.user;
  },

  async updateProfile(payload: ProfileUpdatePayload): Promise<User> {
    const { data } = await api.put<{ message: string; user: User }>('/api/auth/profile', payload);
    return data.user;
  },
};
