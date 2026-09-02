import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

import { login as apiLogin, signup as apiSignup } from '@/api/client';
import { getToken, hydrateToken, isReady, setToken, subscribe } from '@/state/auth';

interface AuthContextValue {
  token: string | null;
  /** False until the persisted token has loaded — gates the login redirect so it doesn't flash on startup. */
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useSyncExternalStore(subscribe, getToken, () => null);
  const ready = useSyncExternalStore(subscribe, isReady, () => false);

  useEffect(() => {
    hydrateToken();
  }, []);

  const value: AuthContextValue = {
    token,
    ready,
    login: async (username, password) => {
      const accessToken = await apiLogin(username, password);
      setToken(accessToken);
    },
    signup: async (username, password) => {
      const accessToken = await apiSignup(username, password);
      setToken(accessToken);
    },
    logout: () => setToken(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
