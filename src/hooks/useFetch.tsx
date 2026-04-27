'use client';

import { useState, useCallback } from 'react';
import { getClientApiUrl } from '@/lib/config';

interface UseFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, any>;
  headers?: Record<string, string>;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseFetchReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  execute: (url: string, options?: UseFetchOptions) => Promise<T>;
}

const resolveClientApiUrl = (): string => {
  const apiUrl = getClientApiUrl();

  if (!apiUrl) {
    throw new Error('Missing NEXT_PUBLIC_API_URL/API_URL configuration.');
  }

  return apiUrl;
};

export const useFetch = <T,>(): UseFetchReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (url: string, options: UseFetchOptions = {}): Promise<T> => {
      setIsLoading(true);
      setError(null);

      try {
        const apiUrl = resolveClientApiUrl();
        const response = await fetch(`${apiUrl}${url}`, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        options.onSuccess?.(result);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { data, isLoading, error, execute };
};

export const useFetchData = <T,>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = resolveClientApiUrl();
      const response = await fetch(`${apiUrl}${url}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  return { data, isLoading, error, refetch: fetchData };
};
