import { describe, expect, it } from 'vitest';
import { auditFor } from '../src/auditTrail';

const ts = (extra: Record<string, unknown> = {}) => ({ companyId: 'c', userId: 'u', startTime: '06:00', endTime: '14:00', breakMinutes: 30, totalHours: 7.5, status: 'draft', ...extra });

describe('Prüfprotokoll', () => {
  it('Zeiten: Freigabe mit Freigebendem, Ablehnung mit Grund', () => {
    expect(auditFor('timesheets', ts({ status: 'submitted' }), ts({ status: 'approved', approvedBy: 'admin1' }))).toMatchObject({ action: 'timesheet.approved', actorUid: 'admin1' });
    expect(auditFor('timesheets', ts({ status: 'submitted' }), ts({ status: 'rejected', rejectionReason: 'Pause fehlt' }))?.summary).toContain('Pause fehlt');
    expect(auditFor('timesheets', ts({ status: 'submitted' }), ts({ status: 'approved', facilityApprovedVia: 'link' }))?.summary).toContain('Freigabe-Link');
  });
  it('Zeiten: Änderung an Uhrzeiten wird protokolliert, Server-Felder nicht', () => {
    expect(auditFor('timesheets', ts(), ts({ endTime: '15:00', totalHours: 8.5 }))?.action).toBe('timesheet.changed');
    expect(auditFor('timesheets', ts(), ts({ nightHours: 2, breakdownKey: 'v3|x' }))).toBeNull();
  });
  it('Stundennachweis: Unterschrift und Anerkennung', () => {
    const base = { companyId: 'c', userId: 'u', month: '2026-09' };
    expect(auditFor('timesheetStatements', undefined, { ...base, employeeSignedAt: 1, signedTotalHours: 22.25 })?.action).toBe('statement.employee-signed');
    expect(auditFor('timesheetStatements', { ...base, employeeSignedAt: 1 }, { ...base, employeeSignedAt: 1, employerSignedAt: 2, employerSignedName: 'Pepe', employerSignedBy: 'a' })).toMatchObject({ action: 'statement.acknowledged', actorUid: 'a' });
    expect(auditFor('timesheetStatements', { ...base, employeeSignedAt: 1, employerSignedAt: 2 }, { ...base, employeeSignedAt: 1 })?.action).toBe('statement.acknowledgement-revoked');
  });
  it('Krankmeldungen gibt es nicht mehr – Altbestand wird nicht protokolliert', () => {
    expect(auditFor('absences', undefined, { companyId: 'c', userId: 'u', type: 'sick', fromKey: '2026-11-02', toKey: '2026-11-03', status: 'reported' })).toBeNull();
  });
  it('Personalstamm: nur lohn-/rechterelevante Felder', () => {
    const u = { companyId: 'c', displayName: 'Lea', role: 'nurse', phone: '1' };
    expect(auditFor('users', u, { ...u, phone: '2' })).toBeNull();
    expect(auditFor('users', u, { ...u, personnelNumber: '17' })?.summary).toBe('Lea: Personalnummer geändert');
  });
});
