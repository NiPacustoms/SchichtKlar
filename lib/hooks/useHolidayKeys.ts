'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { holidayProvider } from '@/lib/services/holidayProvider';

/** Bundesland der eigenen Firma (companies/{id}.holidayState), z. B. 'NW' */
export function useCompanyHolidayState() {
  const { user } = useAuth();
  const companyId = user?.companyId ?? '';
  return useQuery({
    queryKey: ['company-holiday-state', companyId],
    queryFn: async () => {
      try {
        const snap = await getDoc(doc(getDb(), 'companies', companyId));
        const raw = snap.exists() ? (snap.data().holidayState ?? snap.data().state ?? snap.data().bundesland) : undefined;
        return typeof raw === 'string' && /^[A-Za-z]{2}$/.test(raw) ? raw.toUpperCase() : null;
      } catch {
        return null; // ohne Zugriff → nur bundesweite Feiertage
      }
    },
    enabled: !!companyId,
    staleTime: 60 * 60_000,
  });
}

/**
 * Gesetzliche Feiertage als 'YYYY-MM-DD' für die angegebenen Jahre – bundesweit
 * plus die des Bundeslands der Firma (Feiertage kosten keinen Urlaub).
 */
export function useHolidayKeys(years: number[], state?: string) {
  const sorted = [...new Set(years)].sort();
  const { data: companyState, isFetched } = useCompanyHolidayState();
  const effective = state ?? companyState ?? undefined;
  const { user } = useAuth();
  return useQuery({
    queryKey: ['holiday-keys', sorted.join(','), effective ?? ''],
    queryFn: async () => {
      const keys = new Set<string>();
      for (const y of sorted) {
        for (const d of await holidayProvider.getHolidays(y, effective)) keys.add(format(d, 'yyyy-MM-dd'));
      }
      return keys;
    },
    // auf das Bundesland warten, damit nicht erst falsch gezählt wird
    enabled: !!state || isFetched || !user?.companyId,
    staleTime: Infinity,
  });
}
