'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { facilityService, assignmentService, userService } from '@/lib/services';
import type { Shift } from '@/lib/types';

export interface ShiftEnrichment {
  facilityName: string;
  /** Farbe der Einrichtung (Stammdaten) – für Kalender-Markierungen */
  facilityColor?: string;
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

      // Wenige Sammelabfragen statt je Schicht/Person einzeln (vorher: N+1 –
      // bei 190 Schichten mehrere hundert Firestore-Reads pro Kalenderaufruf)
      const [facilities, assignmentPage, staffRes] = await Promise.all([
        facilityService.getAll(companyId || undefined),
        assignmentService.getAll(1, 2000),
        userService.getAll(1, 1000, companyId ? { companyId } : undefined),
      ]);
      const staff = Array.isArray(staffRes) ? staffRes : staffRes.data;

      const facilityMap = new Map(
        facilities.map(f => [f.id, { name: f.name, color: f.colorCode, stations: f.stations || [] }])
      );
      const userMap = new Map(staff.map(u => [u.id, u.displayName || u.email]));
      const shiftToUserIds = new Map<string, string[]>();
      for (const a of assignmentPage.data) {
        if (!a.shiftId || !a.userId) continue;
        if (!['accepted', 'assigned', 'pending-signature', 'completed'].includes(a.status)) continue;
        const list = shiftToUserIds.get(a.shiftId) ?? [];
        list.push(a.userId);
        shiftToUserIds.set(a.shiftId, list);
      }

      const result: Record<string, ShiftEnrichment> = {};
      shifts.forEach(shift => {
        const facilityData = facilityMap.get(shift.facilityId);
        const stationId = (shift as unknown as { stationId?: string }).stationId;
        const stationName =
          stationId && facilityData?.stations
            ? facilityData.stations.find(st => st.id === stationId)?.name
            : undefined;
        const uids = shiftToUserIds.get(shift.id) || [];
        result[shift.id] = {
          facilityName: facilityData?.name ?? 'Unbekannte Einrichtung',
          facilityColor: facilityData?.color,
          stationName,
          assigneeNames: uids.map(uid => userMap.get(uid) || 'Unbekannte Person'),
        };
      });
      return result;
    },
    enabled: shiftIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  return { enrichment: enrichmentMap, isLoading };
}
