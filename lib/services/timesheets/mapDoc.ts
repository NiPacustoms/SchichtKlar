import type { Timesheet, FirestoreTimesheetData } from './types';

export type DocLike = { id: string; data: () => unknown };

export function mapDocToTimesheet(doc: DocLike): Timesheet {
  const data = doc.data() as FirestoreTimesheetData;
  return {
    id: doc.id,
    userId: data.userId,
    companyId: data.companyId || '',
    date: data.date?.toDate() || new Date(),
    startDate: data.startDate?.toDate() || data.date?.toDate() || new Date(),
    endDate: data.endDate?.toDate() || data.date?.toDate() || new Date(),
    startTime: data.startTime,
    endTime: data.endTime,
    breakMinutes: data.breakMinutes || 0,
    totalHours: data.totalHours || 0,
    nightHours: data.nightHours || 0,
    weekendHours: data.weekendHours || 0,
    holidayHours: data.holidayHours || 0,
    overtimeHours: data.overtimeHours || 0,
    regularHours: data.regularHours || 0,
    notes: data.notes,
    status: data.status || 'draft',
    submittedAt: data.submittedAt?.toDate(),
    approvedAt: data.approvedAt?.toDate(),
    approvedBy: data.approvedBy,
    rejectionReason: data.rejectionReason,
    breaks: data.breaks || [],
    employeeSignatureUrl: data.employeeSignatureUrl,
    employeeSignedAt: data.employeeSignedAt?.toDate(),
    facilitySignatureUrl: data.facilitySignatureUrl,
    facilitySignedAt: data.facilitySignedAt?.toDate(),
    facilitySignedBy: data.facilitySignedBy,
    facilityConfirmationStatus: data.facilityConfirmationStatus,
    facilitySignerName: data.facilitySignerName,
    facilityId: data.facilityId,
    station: data.station,
    location: data.location,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}
