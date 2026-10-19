'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { holidayProvider } from '@/lib/services/holidayProvider';

/**
 * Bundesweite gesetzliche Feiertage als 'YYYY-MM-DD' für die angegebenen
 * Jahre – für die Zählung von Urlaubstagen (Feiertage kosten keinen Urlaub).
 */
export function useHolidayKeys(years: number[], state?: string) {
  const sorted = [...new Set(years)].sort();
  return useQuery({
    queryKey: ['holiday-keys', sorted.join(','), state ?? ''],
    queryFn: async () => {
      const keys = new Set<string>();
      for (const y of sorted) {
        for (const d of await holidayProvider.getHolidays(y, state)) keys.add(format(d, 'yyyy-MM-dd'));
      }
      return keys;
    },
    staleTime: Infinity,
  });
}
