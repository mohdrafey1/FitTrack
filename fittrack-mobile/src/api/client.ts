import axios, { isAxiosError, type AxiosError } from 'axios';
import Constants from 'expo-constants';

/**
 * Resolve the FitTrack backend URL.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_URL (set in .env — required for production builds).
 *  2. In development, the machine running `expo start` on the backend's default
 *     port 6001 — this works on emulators and on physical devices on the same
 *     network without any configuration.
 *  3. localhost fallback.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    const host = hostUri?.split(':')[0];
    if (host) return `http://${host}:6001`;
  }

  return 'http://localhost:6001';
}

export const API_BASE_URL = resolveBaseUrl();

// eslint-disable-next-line import/no-named-as-default-member -- axios.create is the idiomatic factory
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Set (or clear) the JWT attached to every request. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Register the handler invoked when the API rejects our token (401). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Token expired or revoked → force logout, but never for the login/signup
    // endpoints themselves (a wrong password is a 401 too).
    const url = error.config?.url ?? '';
    const isAuthCall = url.includes('/api/auth/login') || url.includes('/api/auth/signup');
    if (error.response?.status === 401 && authToken && !isAuthCall) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

interface BackendErrorBody {
  error?: string;
  message?: string;
  details?: { msg?: string }[];
}

/** Extract a human-readable message from any API error. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError(error)) {
    const body = error.response?.data as BackendErrorBody | undefined;
    if (body) {
      if (body.details?.length && body.details[0]?.msg) return body.details[0].msg;
      if (body.message) return body.message;
      if (body.error) return body.error;
    }
    if (error.code === 'ECONNABORTED') return 'Request timed out. Check your connection.';
    if (!error.response) {
      return `Cannot reach the FitTrack server (${API_BASE_URL}). Make sure it is running and reachable.`;
    }
  }
  return fallback;
}
