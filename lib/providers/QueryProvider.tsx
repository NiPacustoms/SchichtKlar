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
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            placeholderData: (prev: unknown) => prev, // Alte Daten beim Refetch anzeigen, weniger Lade-Flackern
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
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
