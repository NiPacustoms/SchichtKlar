import { useQuery } from '@tanstack/react-query';

export interface ApiStats {
  dailyCount: number;
  remaining: number;
  percentageUsed: number;
  lastCallAt?: Date;
  cacheHitRate?: number;
  averageResponseTime?: number;
}

/**
 * Hook für API-Statistiken (OpenRouteService)
 * DEAKTIVIERT: API-Monitoring wird nicht mehr verwendet
 * Lädt die aktuellen API-Call-Statistiken
 */
export function useApiStats() {
  return useQuery<ApiStats>({
    queryKey: ['apiStats'],
    queryFn: async () => {
      // API-Monitoring deaktiviert - gib leere Stats zurück
      return {
        dailyCount: 0,
        remaining: 0,
        percentageUsed: 0,
      };
    },
    enabled: false, // Deaktiviert - wird nicht mehr verwendet
    refetchInterval: false,
    staleTime: Infinity,
  });
}

