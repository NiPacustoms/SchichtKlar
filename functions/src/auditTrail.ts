/**
 * Prüfprotokoll (auditLogs) – serverseitig, nicht abschaltbar vom Client.
 *
 * Protokolliert die für GoBD/AÜG und Lohn relevanten Vorgänge:
 * Zeiten (eingereicht, freigegeben, abgelehnt, geändert), Monatsnachweise
 * (unterschrieben, anerkannt),
 * Einsätze (Status) und Personalstamm
 * (Rolle, Stundenlohn, Personalnummer).
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

/** „ am 14.12.2026“ aus startDate eines Einsatzes (sonst leer) */
const toDay = (d: Data) => {
  const v = d?.startDate as { toDate?: () => Date } | undefined;
  return v?.toDate ? ` am ${v.toDate().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}` : '';
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
          actorUid: s === 'approved' ? str(after.approvedBy) : s === 'submitted' ? str(after.userId) : s === 'rejected' ? str(after.rejectedBy) || undefined : undefined,
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
      const [y, m] = str(after.month).split('-').map(Number);
      const month = y && m ? new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('de-DE', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : str(after.month);
      if (changed(before, after, 'employeeSignedAt') && after.employeeSignedAt)
        return { action: 'statement.employee-signed', summary: `Stundennachweis ${month} unterschrieben (${Number(after.signedTotalHours ?? 0).toLocaleString('de-DE')} Std.)`, actorUid: str(after.userId), fields: ['signedTotalHours', 'signedFingerprint'] };
      if (changed(before, after, 'employerSignedAt'))
        return after.employerSignedAt
          ? { action: 'statement.acknowledged', summary: `Stundennachweis ${month} anerkannt von ${str(after.employerSignedName)}`, actorUid: str(after.employerSignedBy) }
          : { action: 'statement.acknowledgement-revoked', summary: `Anerkennung Stundennachweis ${month} zurückgenommen` };
      return null;
    }
    case 'assignments': {
      const label: Record<string, string> = {
        assigned: 'zugewiesen',
        accepted: 'angenommen',
        declined: 'abgelehnt',
        cancelled: 'abgesagt',
        completed: 'abgeschlossen',
        published: 'ausgeschrieben',
        requested: 'angefragt',
        'pending-signature': 'wartet auf Unterschrift',
      };
      const st = (d: Data) => label[status(d)] ?? status(d);
      const actor = (d: Data) => str(d?.updatedBy ?? d?.createdBy) || undefined;
      const when = toDay(after ?? before);
      if (!after) return { action: 'assignment.deleted', summary: `Einsatz${when} gelöscht` };
      if (!before) return { action: 'assignment.created', summary: `Einsatz${when} angelegt – ${st(after)}`, actorUid: actor(after) };
      if (status(before) !== status(after)) {
        // Annehmen/Ablehnen macht die Pflegekraft selbst
        const self = ['accepted', 'declined', 'requested'].includes(status(after)) ? str(after.userId) : undefined;
        return { action: `assignment.${status(after)}`, summary: `Einsatz${when}: ${st(before)} → ${st(after)}`, actorUid: self || actor(after), fields: ['status', 'userId'] };
      }
      if (changed(before, after, 'userId')) return { action: 'assignment.reassigned', summary: `Einsatz${when} neu zugewiesen`, actorUid: actor(after), fields: ['userId'] };
      return null;
    }
    case 'users': {
      if (!before || !after) return null;
      const fields = ['role', 'hourlyRate', 'personnelNumber', 'active'].filter(f => changed(before, after, f));
      if (!fields.length) return null;
      const label: Record<string, string> = { role: 'Rolle', hourlyRate: 'Stundenlohn', personnelNumber: 'Personalnummer', active: 'Status' };
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
    const companyId = str((after ?? before)?.companyId);
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
export const auditAssignments = onDocumentWritten('assignments/{id}', handler('assignments'));
export const auditUsers = onDocumentWritten('users/{id}', handler('users'));
