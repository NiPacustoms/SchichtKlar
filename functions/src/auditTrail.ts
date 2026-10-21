/**
 * Prüfprotokoll (auditLogs) – serverseitig, nicht abschaltbar vom Client.
 *
 * Protokolliert die für GoBD/AÜG und Lohn relevanten Vorgänge:
 * Zeiten (eingereicht, freigegeben, abgelehnt, geändert), Monatsnachweise
 * (unterschrieben, anerkannt), Abwesenheiten (beantragt, entschieden),
 * Einsätze (Status), Lohnexport-Einstellungen und Personalstamm
 * (Rolle, Stundenlohn, Personalnummer, Urlaubsanspruch).
 *
 * auditLogs sind per Rules unveränderlich (create/update/delete: false).
 */
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { onDocumentWritten, type FirestoreEvent, type Change } from 'firebase-functions/v2/firestore';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

type Data = Record<string, unknown> | undefined;

export interface AuditDecision {
  action: string;
  summary: string;
  actorUid?: string;
  fields?: string[];
}

const str = (v: unknown) => (v == null ? '' : String(v));
const changed = (b: Data, a: Data, f: string) => JSON.stringify(b?.[f] ?? null) !== JSON.stringify(a?.[f] ?? null);
const dayOf = (d: Data) => {
  const v = d?.date as { toDate?: () => Date } | undefined;
  return v?.toDate ? v.toDate().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }) : str(d?.dayKey ?? '');
};

/** Entscheidet je Sammlung, ob und wie protokolliert wird (rein, testbar) */
export function auditFor(collection: string, before: Data, after: Data): AuditDecision | null {
  const status = (d: Data) => str(d?.status);
  switch (collection) {
    case 'timesheets': {
      const times = ['startTime', 'endTime', 'breakMinutes', 'totalHours'];
      const when = dayOf(after ?? before);
      if (!after) return { action: 'timesheet.deleted', summary: `Zeiten vom ${when} gelöscht` };
      if (!before) return { action: 'timesheet.created', summary: `Zeiten vom ${when} erfasst (${str(after.startTime)}–${str(after.endTime)})`, actorUid: str(after.userId) };
      if (status(before) !== status(after)) {
        const s = status(after);
        const label: Record<string, string> = { submitted: 'eingereicht', approved: 'freigegeben', rejected: 'abgelehnt', draft: 'zurück in Entwurf' };
        return {
          action: `timesheet.${s}`,
          summary: `Zeiten vom ${when} ${label[s] ?? s}${s === 'rejected' && after.rejectionReason ? ` – ${str(after.rejectionReason)}` : ''}${s === 'approved' && after.facilityApprovedVia === 'link' ? ' (Freigabe-Link der Einrichtung)' : ''}`,
          actorUid: s === 'approved' ? str(after.approvedBy) : s === 'submitted' ? str(after.userId) : undefined,
          fields: ['status', ...times],
        };
      }
      if (times.some(f => changed(before, after, f)))
        return { action: 'timesheet.changed', summary: `Zeiten vom ${when} geändert`, fields: times };
      if (changed(before, after, 'facilitySignerName') && after.facilitySignerName)
        return { action: 'timesheet.facility-signed', summary: `Einrichtung hat ${when} bestätigt: ${str(after.facilitySignerName)}`, fields: ['facilitySignerName'] };
      return null;
    }
    case 'timesheetStatements': {
      if (!after) return null;
      const month = str(after.month);
      if (changed(before, after, 'employeeSignedAt') && after.employeeSignedAt)
        return { action: 'statement.employee-signed', summary: `Stundennachweis ${month} unterschrieben (${str(after.signedTotalHours)} Std.)`, actorUid: str(after.userId), fields: ['signedTotalHours', 'signedFingerprint'] };
      if (changed(before, after, 'employerSignedAt'))
        return after.employerSignedAt
          ? { action: 'statement.acknowledged', summary: `Stundennachweis ${month} anerkannt von ${str(after.employerSignedName)}`, actorUid: str(after.employerSignedBy) }
          : { action: 'statement.acknowledgement-revoked', summary: `Anerkennung Stundennachweis ${month} zurückgenommen` };
      return null;
    }
    case 'absences': {
      if (!after) return null;
      const kind = after.type === 'sick' ? 'Krankmeldung' : 'Urlaub';
      const period = `${str(after.fromKey)} – ${str(after.toKey)}`;
      if (!before) return { action: `absence.${status(after)}`, summary: `${kind} ${period} ${after.type === 'sick' ? 'gemeldet' : 'beantragt'}`, actorUid: str(after.userId) };
      if (status(before) !== status(after)) {
        const label: Record<string, string> = { approved: 'genehmigt', rejected: 'abgelehnt', cancelled: 'zurückgezogen' };
        return {
          action: `absence.${status(after)}`,
          summary: `${kind} ${period} ${label[status(after)] ?? status(after)}${after.decisionNote ? ` – ${str(after.decisionNote)}` : ''}`,
          actorUid: str(after.decidedBy) || undefined,
          fields: ['status'],
        };
      }
      if (changed(before, after, 'toKey')) return { action: 'absence.extended', summary: `${kind} geändert: ${period}`, fields: ['toKey'] };
      return null;
    }
    case 'assignments': {
      if (!after) return { action: 'assignment.deleted', summary: 'Einsatz gelöscht' };
      if (!before) return { action: 'assignment.created', summary: `Einsatz angelegt (${status(after)})` };
      if (status(before) !== status(after))
        return { action: `assignment.${status(after)}`, summary: `Einsatz: ${status(before)} → ${status(after)}`, fields: ['status', 'userId'] };
      if (changed(before, after, 'userId')) return { action: 'assignment.reassigned', summary: 'Einsatz neu zugewiesen', fields: ['userId'] };
      return null;
    }
    case 'payrollSettings':
      return { action: 'payroll.settings-changed', summary: 'Lohnexport-Einstellungen geändert', fields: ['beraterNr', 'mandantenNr', 'bsStunden', 'lohnarten'] };
    case 'users': {
      if (!before || !after) return null;
      const fields = ['role', 'hourlyRate', 'personnelNumber', 'vacationDaysPerYear', 'active'].filter(f => changed(before, after, f));
      if (!fields.length) return null;
      const label: Record<string, string> = { role: 'Rolle', hourlyRate: 'Stundenlohn', personnelNumber: 'Personalnummer', vacationDaysPerYear: 'Urlaubsanspruch', active: 'Status' };
      return { action: 'user.master-data-changed', summary: `${str(after.displayName) || 'Person'}: ${fields.map(f => label[f]).join(', ')} geändert`, fields };
    }
  }
  return null;
}

function pick(d: Data, fields?: string[]) {
  if (!d || !fields) return undefined;
  const out: Record<string, unknown> = {};
  for (const f of fields) if (d[f] !== undefined) out[f] = d[f];
  return out;
}

function handler(collection: string) {
  return async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined, Record<string, string>>) => {
    const before = event.data?.before?.exists ? event.data.before.data() : undefined;
    const after = event.data?.after?.exists ? event.data.after.data() : undefined;
    const decision = auditFor(collection, before, after);
    if (!decision) return;
    const companyId = str((after ?? before)?.companyId) || (collection === 'payrollSettings' ? Object.values(event.params)[0] : '');
    if (!companyId) return;
    const id = Object.values(event.params)[0];
    try {
      await admin.firestore().collection('auditLogs').add({
        companyId,
        action: decision.action,
        summary: decision.summary,
        actorUid: decision.actorUid || 'system',
        subjectUid: str((after ?? before)?.userId) || (collection === 'users' ? id : null),
        target: { collection, id },
        before: pick(before, decision.fields) ?? null,
        after: pick(after, decision.fields) ?? null,
        source: 'server',
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      logger.error('Prüfprotokoll konnte nicht geschrieben werden', { collection, id, error: (e as Error).message });
    }
  };
}

export const auditTimesheets = onDocumentWritten('timesheets/{id}', handler('timesheets'));
export const auditStatements = onDocumentWritten('timesheetStatements/{id}', handler('timesheetStatements'));
export const auditAbsences = onDocumentWritten('absences/{id}', handler('absences'));
export const auditAssignments = onDocumentWritten('assignments/{id}', handler('assignments'));
export const auditPayrollSettings = onDocumentWritten('payrollSettings/{id}', handler('payrollSettings'));
export const auditUsers = onDocumentWritten('users/{id}', handler('users'));
