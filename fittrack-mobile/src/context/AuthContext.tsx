import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { authApi } from '@/api/auth';
import { getApiErrorMessage, setAuthToken, setUnauthorizedHandler } from '@/api/client';
import type { ProfileUpdatePayload, SignupPayload, User } from '@/types/api';

const TOKEN_KEY = 'fittrack.token';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True while the stored session is being restored at launch. */
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (payload: SignupPayload) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  }, []);

  // Restore the stored session on launch.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const me = await authApi.getMe();
          if (!cancelled) setUser(me);
        }
      } catch {
        // Expired/invalid token, or the server is unreachable — start signed out.
        await clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // If any API call returns 401, drop the session (token expired server-side).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (userRef.current) void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const persistSession = useCallback(async (token: string, nextUser: User) => {
    setAuthToken(token);
    setUser(nextUser);
    await SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {});
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const { token, user: nextUser } = await authApi.login(email.trim(), password);
        await persistSession(token, nextUser);
        return { success: true };
      } catch (error) {
        return { success: false, error: getApiErrorMessage(error, 'Login failed') };
      }
    },
    [persistSession]
  );

  const signup = useCallback(
    async (payload: SignupPayload): Promise<AuthResult> => {
      try {
        const { token, user: nextUser } = await authApi.signup(payload);
        await persistSession(token, nextUser);
        return { success: true };
      } catch (error) {
        return { success: false, error: getApiErrorMessage(error, 'Signup failed') };
      }
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const updateProfile = useCallback(async (payload: ProfileUpdatePayload): Promise<AuthResult> => {
    try {
      const nextUser = await authApi.updateProfile(payload);
      setUser(nextUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: getApiErrorMessage(error, 'Profile update failed') };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      // Non-fatal — keep showing the cached user.
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      signup,
      logout,
      updateProfile,
      refreshUser,
    }),
    [user, loading, login, signup, logout, updateProfile, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
