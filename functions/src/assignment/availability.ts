import type { Firestore } from 'firebase-admin/firestore';
import { parseShiftToUTC, checkOverlap } from '../utils/timeUtils';
import { berlinDayKey, DAY_RULE_ACTIVE_STATUSES, toDayKey } from '../utils/dayRule';
import { isAbsentOn } from '../absences';

/** Zeitfenster eines bestehenden Einsatzes – aus verknüpfter Schicht oder eigenem startDate. */
async function getAssignmentWindow(
  db: Firestore,
  a: Record<string, unknown>
): Promise<{ start: Date; end: Date; dayKey: string | null } | null> {
  let date: Date | null = null;
  let startTime = (a.startTime as string) || '';
  let endTime = (a.endTime as string) || '';

  const ownDate = (a.startDate as { toDate?: () => Date } | undefined)?.toDate?.();
  if (ownDate) {
    date = ownDate;
  } else if (typeof a.shiftId === 'string' && a.shiftId) {
    const shiftSnap = await db.collection('shifts').doc(a.shiftId).get();
    if (!shiftSnap.exists) return null;
    const shift = shiftSnap.data()!;
    const shiftDate = shift.date?.toDate?.() ?? (typeof shift.date === 'string' ? new Date(shift.date) : null);
    if (!shiftDate || Number.isNaN(shiftDate.getTime())) return null;
    date = shiftDate;
    startTime = startTime || shift.startTime;
    endTime = endTime || shift.endTime;
  }
  if (!date) return null;

  const { startUTC, endUTC } = parseShiftToUTC(date, startTime || '08:00', endTime || '16:00', 'Europe/Berlin');
  return { start: startUTC, end: endUTC, dayKey: toDayKey(ownDate ?? date) };
}

/**
 * Prüft, ob ein Nutzer im angegebenen Zeitraum verfügbar ist:
 * - keine zeitliche Überschneidung mit aktiven Einsätzen und
 * - kein anderer aktiver Einsatz am selben Berliner Kalendertag (Regel „1 Einsatz pro Tag") und
 * - keine genehmigte Abwesenheit (Urlaub/Krankheit) an dem Tag.
 */
export async function isUserAvailableForSlot(
  db: Firestore,
  userId: string,
  startUTC: Date,
  endUTC: Date,
  companyId?: string
): Promise<boolean> {
  let q = db.collection('assignments').where('userId', '==', userId);
  if (companyId) q = q.where('companyId', '==', companyId);
  const myAssignments = await q.where('status', 'in', [...DAY_RULE_ACTIVE_STATUSES]).get();

  const targetDay = berlinDayKey(startUTC);
  // Genehmigter Urlaub oder Krankmeldung → nicht verfügbar
  if (await isAbsentOn(db, userId, companyId, targetDay)) return false;
  for (const aDoc of myAssignments.docs) {
    const window = await getAssignmentWindow(db, aDoc.data());
    if (!window) continue;
    if (window.dayKey === targetDay) return false;
    if (checkOverlap({ start: startUTC, end: endUTC }, { start: window.start, end: window.end })) {
      return false;
    }
  }
  return true;
}

/**
 * Gibt alle Mitarbeiter-IDs (role nurse) der Firma zurück, die im angegebenen
 * Zeitraum verfügbar sind (keine Überlappung, kein anderer Einsatz am selben Tag).
 */
export async function getAvailableEmployeeIds(
  db: Firestore,
  companyId: string,
  startDate: string,
  startTime: string,
  endTime: string,
  qualification?: string
): Promise<string[]> {
  const date = new Date(startDate);
  const { startUTC, endUTC } = parseShiftToUTC(date, startTime, endTime, 'Europe/Berlin');

  const usersSnap = await db
    .collection('users')
    .where('companyId', '==', companyId)
    .where('role', '==', 'nurse')
    .get();
  const available: string[] = [];

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();

    if (qualification) {
      const qualifications = (user.qualifications as string[]) || [];
      if (!qualifications.includes(qualification)) continue;
    }

    if (await isUserAvailableForSlot(db, userDoc.id, startUTC, endUTC, companyId)) {
      available.push(userDoc.id);
    }
  }

  return available;
}
