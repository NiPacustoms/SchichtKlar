import { logger } from '@/lib/errors';
import { getById } from './read';
import { generateSignaturePDFAndSendEmails } from './pdfGenerate';

function areAllSignaturesCollected(schedule: { requiredDates?: unknown[]; collectedDates?: string[] } | undefined): boolean {
  if (!schedule?.requiredDates?.length) return true;
  return (schedule.collectedDates?.length ?? 0) === schedule.requiredDates.length;
}

export async function checkAndGeneratePDFIfComplete(assignmentId: string): Promise<void> {
  try {
    const assignment = await getById(assignmentId);
    if (!assignment || assignment.pdfGenerated) return;
    const { shiftService } = await import('../shifts');
    const { timesheetService } = await import('../timesheets');
    const shift = await shiftService.getById(assignment.shiftId);
    if (!shift) return;
    const shiftDateValue = typeof shift.date === 'string' ? new Date(shift.date) : (shift.date as Date);
    if (!areAllSignaturesCollected(assignment.signatureSchedule)) return;
    const timesheets = await timesheetService.getByUserAndDateRange(assignment.userId, shiftDateValue, shiftDateValue);
    const hasFacilitySignatures = timesheets.some(ts => ts.facilitySignatureUrl);
    if (!hasFacilitySignatures && timesheets.length > 0) return;
    await generateSignaturePDFAndSendEmails(assignmentId);
  } catch (error) {
    logger.error('Error checking and generating PDF', error instanceof Error ? error : new Error(String(error)));
  }
}
