'use client';

import { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { User } from '@/types';
import { getClientApiUrl } from '@/lib/config';

const API_URL = getClientApiUrl();

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

interface ApiErrorResponse {
  message?: string;
}

const getErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    if (data?.message && typeof data.message === 'string') {
      return data.message;
    }
  } catch {
    // Ignore JSON parse errors and use fallback.
  }

  return fallback;
};

const AuthContext = createContext<UseAuthReturn | null>(null);
const AUTH_STORAGE_KEY = 'animah.auth.user';

const useProvideAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const cachedUser = JSON.parse(raw) as User;
        setUser(cachedUser);
        setIsLoading(false);
      }
    } catch {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }

    const controller = new AbortController();

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        } else if (response.status === 401) {
          setUser(null);
          window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void checkAuth();

    return () => {
      controller.abort();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Login failed');
        throw new Error(message);
      }

      const { user } = await response.json();
      setUser(user);
      window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Registration failed');
        throw new Error(message);
      }

      const { user } = await response.json();
      setUser(user);
      window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useProvideAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = (): UseAuthReturn => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
