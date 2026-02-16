import type { Firestore } from 'firebase-admin/firestore';
import { parseShiftToUTC, checkOverlap } from '../utils/timeUtils';

/**
 * Prüft, ob ein Nutzer im angegebenen Zeitraum verfügbar ist (keine Überlappung
 * mit Assignments status assigned/accepted).
 */
export async function isUserAvailableForSlot(
  db: Firestore,
  userId: string,
  startUTC: Date,
  endUTC: Date
): Promise<boolean> {
  const myAssignments = await db
    .collection('assignments')
    .where('userId', '==', userId)
    .where('status', 'in', ['assigned', 'accepted'])
    .get();

  for (const aDoc of myAssignments.docs) {
    const a = aDoc.data();
    const shiftId = a.shiftId;
    if (!shiftId) continue;
    const shiftSnap = await db.collection('shifts').doc(shiftId).get();
    if (!shiftSnap.exists) continue;
    const shift = shiftSnap.data()!;
    const shiftDate = shift.date?.toDate?.() || new Date();
    const { startUTC: sStart, endUTC: sEnd } = parseShiftToUTC(
      shiftDate,
      shift.startTime || '08:00',
      shift.endTime || '16:00',
      'Europe/Berlin'
    );
    if (checkOverlap({ start: startUTC, end: endUTC }, { start: sStart, end: sEnd })) {
      return false;
    }
  }
  return true;
}

/**
 * Gibt alle Mitarbeiter-IDs (role nurse) der Firma zurück, die im angegebenen
 * Zeitraum verfügbar sind (keine Überlappung mit bestehenden Einsätzen).
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

  const usersSnap = await db.collection('users').where('role', '==', 'nurse').get();
  const available: string[] = [];

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    const userCompanyId = user.companyId as string | undefined;
    if (userCompanyId && userCompanyId !== companyId) continue;

    if (qualification) {
      const qualifications = (user.qualifications as string[]) || [];
      if (!qualifications.includes(qualification)) continue;
    }

    const availableForSlot = await isUserAvailableForSlot(db, userDoc.id, startUTC, endUTC);
    if (availableForSlot) {
      available.push(userDoc.id);
    }
  }

  return available;
}
