'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError } from '@/lib/api';
import type { LoginResponse, Profile } from '@/lib/types';

interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  /** Resolves with the raw login response so callers can handle MFA. */
  login: (email: string, password: string, mfaToken?: string) => Promise<LoginResponse>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api<Profile>('/auth/me');
      setProfile(me ?? null);
    } catch (err) {
      // 401 simply means "not logged in" — keep it quiet.
      if (!(err instanceof ApiError) || err.status !== 401) {
        // Unexpected error; still treat as logged out but log for debugging.
        // eslint-disable-next-line no-console
        console.error('Auth check failed', err);
      }
      setProfile(null);
    }
  }, []);

  // Probe the session once on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      await refresh();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string, mfaToken?: string): Promise<LoginResponse> => {
      const result = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password, ...(mfaToken ? { mfaToken } : {}) },
      });
      // Only refresh the profile when authentication actually completed.
      if (!('mfaRequired' in result)) {
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<void> => {
      await api<{ id: string; email: string }>('/auth/register', {
        method: 'POST',
        body: input,
      });
      // Auto-login after a successful registration.
      await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email: input.email, password: input.password },
      });
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await api<void>('/auth/logout', { method: 'POST' });
    } finally {
      setProfile(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ profile, loading, login, register, logout, refresh }),
    [profile, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
