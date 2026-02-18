'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { facilityService, assignmentService, userService } from '@/lib/services';
import type { Shift } from '@/lib/types';

export interface ShiftEnrichment {
  facilityName: string;
  /** Stationsname, falls die Schicht einer Station zugeordnet ist */
  stationName?: string;
  assigneeNames: string[];
}

/** Stabile Query-Key-Komponente, damit bei vielen Schichten der Key nicht zu lang wird */
function stableShiftKey(shiftIds: string[]): string {
  if (shiftIds.length === 0) return '';
  if (shiftIds.length <= 30) return shiftIds.join(',');
  return `${shiftIds.length}:${shiftIds.slice(0, 15).join(',')}:${shiftIds.slice(-5).join(',')}`;
}

/**
 * Lädt für die übergebenen Schichten Einrichtungsname und zugewiesene Mitarbeiter-Namen
 * (für Kalender-Anzeige: „Wer · Einrichtung“).
 * @param shifts - Schichten (müssen id und facilityId haben)
 * @param companyIdOpt - optional; wenn gesetzt, wird dieser statt user.companyId verwendet (z. B. von der Seite übergeben)
 */
/** companyId aus einer Schicht lesen (Service setzt companyId auf die Schicht) */
function getCompanyIdFromShifts(shifts: Shift[]): string {
  const withCompany = shifts.find((s) => (s as unknown as { companyId?: string }).companyId) as
    | { companyId?: string }
    | undefined;
  return withCompany?.companyId ?? '';
}

export function useShiftEnrichment(
  shifts: Shift[],
  companyIdOpt?: string
): { enrichment: Record<string, ShiftEnrichment>; isLoading: boolean } {
  const { user } = useAuth();
  const companyId = companyIdOpt ?? user?.companyId ?? getCompanyIdFromShifts(shifts);
  const shiftIds = useMemo(() => shifts.map((s) => s.id).filter(Boolean), [shifts]);

  const { data: enrichmentMap = {}, isLoading } = useQuery({
    queryKey: ['shiftEnrichment', companyId, stableShiftKey(shiftIds)],
    queryFn: async (): Promise<Record<string, ShiftEnrichment>> => {
      if (shiftIds.length === 0) return {};

      const facilityIds = [...new Set(shifts.map((s) => s.facilityId).filter(Boolean))];
      const facilityMap = new Map<string, { name: string; stations: Array<{ id: string; name: string }> }>();
      await Promise.all(
        facilityIds.map(async (id) => {
          const f = await facilityService.getById(id);
          if (f) {
            facilityMap.set(id, {
              name: f.name,
              stations: f.stations || [],
            });
          }
        })
      );

      const assignmentsByShift = await Promise.all(
        shiftIds.map((id) => assignmentService.getByShiftId(id))
      );
      const userIds = new Set<string>();
      const shiftToUserIds = new Map<string, string[]>();
      shiftIds.forEach((shiftId, i) => {
        const list = assignmentsByShift[i]
          .filter((a) => a.status === 'accepted' || a.status === 'assigned')
          .map((a) => a.userId);
        list.forEach((uid) => userIds.add(uid));
        shiftToUserIds.set(shiftId, list);
      });

      const userMap = new Map<string, string>();
      await Promise.all(
        [...userIds].map(async (uid) => {
          const u = await userService.getById(uid);
          userMap.set(uid, u?.displayName || u?.email || uid);
        })
      );

      const result: Record<string, ShiftEnrichment> = {};
      shifts.forEach((shift) => {
        const facilityData = facilityMap.get(shift.facilityId);
        const facilityName = facilityData?.name ?? 'Unbekannte Einrichtung';
        const stationId = (shift as unknown as { stationId?: string }).stationId;
        const stationName =
          stationId && facilityData?.stations
            ? facilityData.stations.find((st) => st.id === stationId)?.name
            : undefined;
        const uids = shiftToUserIds.get(shift.id) || [];
        const assigneeNames = uids.map((uid) => userMap.get(uid) || uid);
        result[shift.id] = { facilityName, stationName, assigneeNames };
      });
      return result;
    },
    enabled: shiftIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  return { enrichment: enrichmentMap, isLoading };
}
