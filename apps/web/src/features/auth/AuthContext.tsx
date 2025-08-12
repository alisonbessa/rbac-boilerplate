import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/apiClient';

export type AuthUser = {
  id: number;
  email: string;
  roles: string[];
  permissions: string[];
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/v1/auth/me');
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user?: AuthUser };
      setUser(data.user ?? null);
    } catch (e) {
      setError('Failed to load auth');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    setUser(null);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, refresh, logout }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
