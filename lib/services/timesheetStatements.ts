import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { berlinDayKey } from '@/lib/utils/dateKey';
import {
  buildMonthlyStatement,
  monthRangeKeys,
  statementDocId,
  type MonthlyStatement,
  type StatementAbsence,
  type StatementSheet,
} from '@/lib/domain/stundennachweis';

export interface StatementSignatureDoc {
  employeeSignature?: string;
  employeeSignedName?: string;
  employeeSignedAt?: Date | null;
  signedFingerprint?: string;
  signedTotalHours?: number;
  employerSignature?: string;
  employerSignedName?: string;
  employerSignedAt?: Date | null;
  employerSignedBy?: string;
}

export interface LoadedStatement {
  statement: MonthlyStatement;
  signatures: StatementSignatureDoc | null;
}

const toDate = (v: unknown): Date | null =>
  v && typeof (v as Timestamp).toDate === 'function' ? (v as Timestamp).toDate() : v instanceof Date ? v : null;

/** Zeitraum großzügig abfragen (Berliner Mitternacht liegt am Vortag UTC) und per Kalendertag filtern */
function monthQueryRange(month: string) {
  const { fromKey, toKey } = monthRangeKeys(month);
  return { start: new Date(Date.parse(`${fromKey}T00:00:00Z`) - 3 * 3600_000), end: new Date(`${toKey}T23:59:59Z`), fromKey, toKey };
}

/**
 * Monatlicher Stundennachweis (timesheetStatements): Zeilen aus timesheets +
 * Abwesenheiten, Unterschriften aus dem Nachweis-Dokument.
 */
export const timesheetStatementService = {
  async load(p: { companyId: string; userId: string; month: string; holidays?: Set<string> }): Promise<LoadedStatement> {
    const db = getDb();
    const { start, end, fromKey, toKey } = monthQueryRange(p.month);
    const [tsSnap, absSnap, sigSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, 'timesheets'),
          where('companyId', '==', p.companyId),
          where('userId', '==', p.userId),
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'asc')
        )
      ),
      getDocs(query(collection(db, 'absences'), where('userId', '==', p.userId), where('companyId', '==', p.companyId))),
      getDoc(doc(db, 'timesheetStatements', statementDocId(p.companyId, p.userId, p.month))),
    ]);

    // Einrichtungsnamen nachladen (nur die benötigten)
    const facilityIds = [...new Set(tsSnap.docs.map(d => d.data().facilityId).filter(Boolean) as string[])];
    const names: Record<string, string> = {};
    await Promise.all(
      facilityIds.map(async id => {
        try {
          const f = await getDoc(doc(db, 'facilities', id));
          if (f.exists()) names[id] = String(f.data().name ?? '');
        } catch {
          /* fremde/gelöschte Einrichtung → ohne Namen */
        }
      })
    );

    const sheets: StatementSheet[] = [];
    for (const d of tsSnap.docs) {
      const t = d.data();
      const date = toDate(t.date);
      if (!date) continue;
      const dayKey = berlinDayKey(date);
      if (dayKey < fromKey || dayKey > toKey) continue;
      sheets.push({
        id: d.id,
        dayKey,
        startTime: String(t.startTime ?? ''),
        endTime: String(t.endTime ?? ''),
        breakMinutes: Number(t.breakMinutes ?? 0),
        totalHours: Number(t.totalHours ?? 0),
        status: t.status ?? 'draft',
        facilityName: t.facilityId ? names[t.facilityId] || undefined : undefined,
        station: t.station || undefined,
        facilitySignerName: t.facilitySignerName || undefined,
        nightHours: Number(t.nightHours ?? 0) || undefined,
        sundayNonHolidayHours: Number(t.sundayNonHolidayHours ?? 0) || undefined,
        holidayHours: Number(t.holidayHours ?? 0) || undefined,
        overtimeHours: Number(t.overtimeHours ?? 0) || undefined,
      });
    }
    const absences: StatementAbsence[] = absSnap.docs.map(d => {
      const a = d.data();
      return { type: a.type, status: a.status, fromKey: a.fromKey, toKey: a.toKey, auProvided: !!a.auProvided };
    });

    const s = sigSnap.exists() ? sigSnap.data() : null;
    return {
      statement: buildMonthlyStatement(p.month, sheets, absences, p.holidays),
      signatures: s
        ? {
            employeeSignature: s.employeeSignature,
            employeeSignedName: s.employeeSignedName,
            employeeSignedAt: toDate(s.employeeSignedAt),
            signedFingerprint: s.signedFingerprint,
            signedTotalHours: s.signedTotalHours,
            employerSignature: s.employerSignature,
            employerSignedName: s.employerSignedName,
            employerSignedAt: toDate(s.employerSignedAt),
            employerSignedBy: s.employerSignedBy,
          }
        : null,
    };
  },

  /** Unterschriften aller Mitarbeitenden eines Monats (Disposition) */
  async listForMonth(companyId: string, month: string): Promise<Record<string, StatementSignatureDoc>> {
    const snap = await getDocs(query(collection(getDb(), 'timesheetStatements'), where('companyId', '==', companyId), where('month', '==', month)));
    const out: Record<string, StatementSignatureDoc> = {};
    for (const d of snap.docs) {
      const s = d.data();
      out[s.userId] = {
        employeeSignedAt: toDate(s.employeeSignedAt),
        employeeSignedName: s.employeeSignedName,
        signedFingerprint: s.signedFingerprint,
        signedTotalHours: s.signedTotalHours,
        employerSignedAt: toDate(s.employerSignedAt),
        employerSignedName: s.employerSignedName,
      };
    }
    return out;
  },

  /** Arbeitnehmer/in bestätigt die erfassten Zeiten des Monats */
  async signAsEmployee(p: { companyId: string; userId: string; month: string; statement: MonthlyStatement; signature: string; name: string; exists: boolean }) {
    const ref = doc(getDb(), 'timesheetStatements', statementDocId(p.companyId, p.userId, p.month));
    const fields = {
      employeeSignature: p.signature,
      employeeSignedName: p.name.trim().slice(0, 120),
      employeeSignedAt: serverTimestamp(),
      signedFingerprint: p.statement.fingerprint,
      signedTotalHours: p.statement.totals.hours,
      updatedAt: serverTimestamp(),
    };
    if (p.exists) await updateDoc(ref, fields);
    else await setDoc(ref, { companyId: p.companyId, userId: p.userId, month: p.month, createdAt: serverTimestamp(), ...fields });
  },

  /** Arbeitgeber erkennt an */
  async acknowledge(p: { companyId: string; userId: string; month: string; adminId: string; name: string; signature: string }) {
    await updateDoc(doc(getDb(), 'timesheetStatements', statementDocId(p.companyId, p.userId, p.month)), {
      employerSignature: p.signature,
      employerSignedName: p.name.trim().slice(0, 120),
      employerSignedAt: serverTimestamp(),
      employerSignedBy: p.adminId,
      updatedAt: serverTimestamp(),
    });
  },

  async revokeAcknowledgement(p: { companyId: string; userId: string; month: string }) {
    await updateDoc(doc(getDb(), 'timesheetStatements', statementDocId(p.companyId, p.userId, p.month)), {
      employerSignature: deleteField(),
      employerSignedName: deleteField(),
      employerSignedAt: deleteField(),
      employerSignedBy: deleteField(),
      updatedAt: serverTimestamp(),
    });
  },
};
