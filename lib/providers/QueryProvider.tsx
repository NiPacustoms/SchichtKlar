'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default staleTime increased: viele Daten ändern sich selten (Facilities, Users, etc.)
            // Spezifische Queries können über staleTime in useQuery überschrieben werden
            staleTime: 10 * 60 * 1000, // 10 minutes (war: 5)
            gcTime: 30 * 60 * 1000, // 30 minutes (war: 10) - länger im Cache halten
            placeholderData: (prev: unknown) => prev, // Alte Daten beim Refetch anzeigen, weniger Lade-Flackern
            refetchOnWindowFocus: false, // Reduziert unnötige Refetches
            retry: (failureCount, error: unknown) => {
              // Don't retry on 4xx errors
              if (typeof error === 'object' && error !== null && 'status' in (error as Record<string, unknown>)) {
                const status = (error as { status?: number }).status;
                if (status && status >= 400 && status < 500) {
                  return false;
                }
              }
              return failureCount < 3;
            },
            // Retry mit Exponential Backoff (1s, 2s, 4s capped 8s)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
