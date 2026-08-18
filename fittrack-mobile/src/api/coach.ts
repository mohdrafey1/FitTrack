import { api } from './client';
import type { ApiEnvelope, CoachAnswer, CoachRange, CoachStatus, CoachTurn } from '@/types/api';

export const coachApi = {
  /** Whether this deployment has FitAI enabled. */
  async status(): Promise<CoachStatus> {
    const { data } = await api.get<ApiEnvelope<CoachStatus>>('/api/coach/status');
    return data.data;
  },

  /**
   * Ask FitAI a question.
   *
   * Only the question, the range and the recent turns go up — the server reads
   * the profile and the logged data straight from the database, so nothing
   * about the user's body or meals has to be shipped from the device.
   */
  async chat(params: {
    message: string;
    range: CoachRange;
    history: CoachTurn[];
  }): Promise<CoachAnswer> {
    const { data } = await api.post<ApiEnvelope<CoachAnswer>>(
      '/api/coach/chat',
      params,
      // Coaching answers reason over up to 28 days of data; the default 15s
      // client timeout would fire before the server's own 30s ceiling.
      { timeout: 45000 }
    );
    return data.data;
  },
};
