import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { isValidDayKey, type Absence, type AbsenceType } from '@/lib/domain/absence';

const COL = 'absences';

function toDate(v: unknown): Date | undefined {
  if (v && typeof (v as { toDate?: () => Date }).toDate === 'function') return (v as { toDate: () => Date }).toDate();
  return v instanceof Date ? v : undefined;
}

function map(id: string, d: DocumentData): Absence & { affectedAssignmentIds?: string[] } {
  return {
    id,
    companyId: d.companyId,
    userId: d.userId,
    type: d.type,
    fromKey: d.fromKey,
    toKey: d.toKey,
    status: d.status,
    auProvided: !!d.auProvided,
    createdAt: toDate(d.createdAt),
    affectedAssignmentIds: Array.isArray(d.affectedAssignmentIds) ? d.affectedAssignmentIds : undefined,
  };
}

export type AbsenceWithConflicts = ReturnType<typeof map>;

const byFromDesc = (a: Absence, b: Absence) => (a.fromKey < b.fromKey ? 1 : a.fromKey > b.fromKey ? -1 : 0);

function assertRange(fromKey: string, toKey: string) {
  if (!isValidDayKey(fromKey) || !isValidDayKey(toKey)) throw new Error('Bitte gültige Daten wählen.');
  if (fromKey > toKey) throw new Error('Das Ende liegt vor dem Beginn.');
}

/** Krankmeldungen (absences/{id}) – keine Urlaubsverwaltung */
export const absenceService = {
  async listMine(userId: string, companyId: string): Promise<AbsenceWithConflicts[]> {
    const snap = await getDocs(query(collection(getDb(), COL), where('userId', '==', userId), where('companyId', '==', companyId)));
    return snap.docs.map(d => map(d.id, d.data())).filter(a => a.type === 'sick').sort(byFromDesc);
  },

  async listForCompany(companyId: string): Promise<AbsenceWithConflicts[]> {
    const snap = await getDocs(query(collection(getDb(), COL), where('companyId', '==', companyId), orderBy('fromKey', 'desc')));
    return snap.docs.map(d => map(d.id, d.data())).filter(a => a.type === 'sick');
  },

  /** Krankmeldung – ohne Diagnose. Gilt sofort, keine Genehmigung. */
  async reportSick(p: { userId: string; companyId: string; fromKey: string; toKey: string; auProvided?: boolean }) {
    assertRange(p.fromKey, p.toKey);
    await addDoc(collection(getDb(), COL), {
      companyId: p.companyId,
      userId: p.userId,
      type: 'sick' satisfies AbsenceType,
      fromKey: p.fromKey,
      toKey: p.toKey,
      status: 'reported',
      auProvided: !!p.auProvided,
      createdAt: serverTimestamp(),
    });
  },

  async cancel(id: string) {
    await updateDoc(doc(getDb(), COL, id), { status: 'cancelled', updatedAt: serverTimestamp() });
  },

  /** Krankmeldung verlängern bzw. AU nachreichen */
  async updateSick(id: string, p: { toKey?: string; auProvided?: boolean }) {
    const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (p.toKey) {
      if (!isValidDayKey(p.toKey)) throw new Error('Bitte gültiges Datum wählen.');
      patch.toKey = p.toKey;
    }
    if (typeof p.auProvided === 'boolean') patch.auProvided = p.auProvided;
    await updateDoc(doc(getDb(), COL, id), patch);
  },
};
