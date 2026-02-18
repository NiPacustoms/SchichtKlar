import type { Assignment } from './types';

export type DocLike = { id: string; data: () => Record<string, unknown> };

export function mapDocToAssignment(doc: DocLike): Assignment {
  const data = doc.data();
  const assignedAt = (data.assignedAt as { toDate?: () => Date } | undefined)?.toDate?.() || new Date();
  const acceptedAt = (data.acceptedAt as { toDate?: () => Date } | undefined)?.toDate?.();
  const declinedAt = (data.declinedAt as { toDate?: () => Date } | undefined)?.toDate?.();
  const completedAt = (data.completedAt as { toDate?: () => Date } | undefined)?.toDate?.();
  const createdAt = (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.() || new Date();
  const updatedAt = (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.() || new Date();
  const decidedAt = (data.decidedAt as { toDate?: () => Date } | undefined)?.toDate?.();
  const signedAt = (data.signedAt as { toDate?: () => Date } | undefined)?.toDate?.();

  return {
    id: doc.id,
    userId: data.userId as string,
    shiftId: data.shiftId as string,
    companyId: data.companyId as string,
    status: data.status as Assignment['status'],
    assignedAt,
    acceptedAt,
    declinedAt,
    completedAt,
    notes: data.notes as string | undefined,
    createdAt,
    updatedAt,
    decidedAt,
    declineReason: data.declineReason as string | undefined,
    requiresSignature: data.requiresSignature as boolean | undefined,
    signedBy: data.signedBy as string | undefined,
    signedAt,
    penaltyFlag: data.penaltyFlag as boolean | undefined,
    employeeSignatureUrl: data.employeeSignatureUrl as string | undefined,
    employeeSignedAt: (data.employeeSignedAt as { toDate?: () => Date } | undefined)?.toDate?.(),
    adminSignatureUrl: data.adminSignatureUrl as string | undefined,
    adminSignedAt: (data.adminSignedAt as { toDate?: () => Date } | undefined)?.toDate?.(),
    adminSignerName: data.adminSignerName as string | undefined,
    relievingSignatures: (data.relievingSignatures as Array<{
      date: string;
      signerName: string;
      signerRole?: string;
      signatureUrl: string;
      signedAt: Date | { toDate: () => Date };
      timesheetId?: string;
      verifiedTimes?: { startTime: string; endTime: string; breakMinutes: number; totalHours: number };
    }> | undefined)?.map(sig => ({
      ...sig,
      signedAt: sig.signedAt instanceof Date ? sig.signedAt : (sig.signedAt as { toDate: () => Date }).toDate()
    })),
    signatureSchedule: data.signatureSchedule ? {
      requiredDates: ((data.signatureSchedule as { requiredDates?: Array<{ toDate?: () => Date } | Date> }).requiredDates as Array<{ toDate?: () => Date } | Date>)?.map((d: { toDate?: () => Date } | Date) =>
        d instanceof Date ? d : (d as { toDate: () => Date }).toDate()
      ) || [],
      collectedDates: ((data.signatureSchedule as { collectedDates?: string[] }).collectedDates as string[]) || [],
      nextRequiredDate: (() => {
        const schedule = data.signatureSchedule as { nextRequiredDate?: Date | { toDate: () => Date } | string | number };
        if (!schedule?.nextRequiredDate) return undefined;
        const nextDate = schedule.nextRequiredDate;
        if (nextDate instanceof Date) return nextDate;
        if (typeof nextDate === 'object' && 'toDate' in nextDate && typeof (nextDate as { toDate: () => Date }).toDate === 'function') {
          return (nextDate as { toDate: () => Date }).toDate();
        }
        return new Date(nextDate as string | number);
      })(),
    } : undefined,
    pdfGenerated: data.pdfGenerated as boolean | undefined,
    pdfGeneratedAt: (data.pdfGeneratedAt as { toDate?: () => Date } | undefined)?.toDate?.(),
    pdfUrl: data.pdfUrl as string | undefined,
    pdfSentTo: data.pdfSentTo as { employee: boolean; admin: boolean; facility: boolean } | undefined,
  };
}
