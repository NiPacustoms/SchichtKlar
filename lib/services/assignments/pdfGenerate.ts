import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/errors';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTION_NAME } from './types';
import { getById } from './read';

export async function generateSignaturePDFAndSendEmails(assignmentId: string): Promise<{ pdfUrl: string; emailsSent: boolean }> {
  const assignment = await getById(assignmentId);
  if (!assignment) throw new Error('Assignment not found');
  if (assignment.pdfGenerated && assignment.pdfUrl) {
    return {
      pdfUrl: assignment.pdfUrl,
      emailsSent: !!(assignment.pdfSentTo?.employee && assignment.pdfSentTo?.admin && assignment.pdfSentTo?.facility),
    };
  }
  const { documentGenerationService } = await import('../documentGeneration');
  const { shiftService } = await import('../shifts');
  const { facilityService } = await import('../facilities');
  const { userService } = await import('../users');
  const { sendAssignmentSignatureEmail } = await import('../email');
  const { timesheetService } = await import('../timesheets');
  const shift = await shiftService.getById(assignment.shiftId);
  if (!shift) throw new Error('Shift not found');
  const employee = await userService.getById(assignment.userId);
  if (!employee) throw new Error('Employee not found');
  const facility = shift.facilityId ? await facilityService.getById(shift.facilityId) : null;
  const shiftDateVal = typeof shift.date === 'string' ? new Date(shift.date) : (shift.date as Date);
  const timesheets = await timesheetService.getByUserAndDateRange(assignment.userId, shiftDateVal, shiftDateVal);
  const timesheetIds = timesheets.map(ts => ts.id);
  const pdfResult = await documentGenerationService.generateDocument({
    type: 'assignment-signatures',
    assignmentId: assignment.id,
    timesheetIds,
  });
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');
  await updateDoc(doc(db, COLLECTION_NAME, assignmentId), {
    pdfGenerated: true,
    pdfGeneratedAt: serverTimestamp(),
    pdfUrl: pdfResult.url,
    updatedAt: serverTimestamp(),
  });
  const employeeName = employee.displayName || employee.email || 'Unbekannt';
  const facilityName = facility?.name || 'Unbekannt';
  const shiftDate = shiftDateVal.toLocaleDateString('de-DE');
  const emailPromises: Promise<void>[] = [];
  if (employee.email) {
    emailPromises.push(
      sendAssignmentSignatureEmail({
        to: employee.email,
        employeeName,
        assignmentId: assignment.id,
        pdfUrl: pdfResult.url,
        facilityName,
        shiftDate,
        recipientType: 'employee',
      }).catch(err => logger.error('Error sending email to employee', err instanceof Error ? err : new Error(String(err))))
    );
  }
  let adminEmailsSent = false;
  const documentPromises: Promise<void>[] = [];
  if (assignment.companyId) {
    try {
      const { userService: us } = await import('../users');
      const { documentService } = await import('../documents');
      const allUsers = await us.getAll(1, 1000, { role: 'admin', companyId: assignment.companyId });
      const adminUsers = allUsers.data.filter(u => u.id);
      for (const admin of adminUsers) {
        if (admin.email) {
          emailPromises.push(
            sendAssignmentSignatureEmail({
              to: admin.email,
              employeeName,
              assignmentId: assignment.id,
              pdfUrl: pdfResult.url,
              facilityName,
              shiftDate,
              recipientType: 'admin',
            })
              .then(() => { adminEmailsSent = true; })
              .catch(err => logger.error(`Error sending email to admin ${admin.email}`, err instanceof Error ? err : new Error(String(err))))
          );
        }
        documentPromises.push(
          documentService
            .create({
              userId: admin.id,
              type: 'contract',
              name: `Zeiterfassung mit Unterschriften - ${employeeName} - ${shiftDate}`,
              url: pdfResult.url,
              fileSize: pdfResult.fileSize,
              mimeType: 'application/pdf',
              notes: `Assignment-ID: ${assignment.id}, Einrichtung: ${facilityName}`,
            })
            .then(() => {})
            .catch(docErr =>
              logger.error(`Error saving document for admin ${admin.id}`, docErr instanceof Error ? docErr : new Error(String(docErr)))
            )
        );
      }
    } catch (err) {
      logger.error('Error getting admin users', err instanceof Error ? err : new Error(String(err)));
    }
  }
  if (facility?.email) {
    emailPromises.push(
      sendAssignmentSignatureEmail({
        to: facility.email,
        employeeName,
        assignmentId: assignment.id,
        pdfUrl: pdfResult.url,
        facilityName,
        shiftDate,
        recipientType: 'facility',
      }).catch(err => logger.error('Error sending email to facility', err instanceof Error ? err : new Error(String(err))))
    );
  }
  await Promise.allSettled([...emailPromises, ...documentPromises]);
  await updateDoc(doc(db, COLLECTION_NAME, assignmentId), {
    pdfSentTo: { employee: !!employee.email, admin: adminEmailsSent, facility: !!facility?.email },
    updatedAt: serverTimestamp(),
  });
  return {
    pdfUrl: pdfResult.url,
    emailsSent: !!employee.email || adminEmailsSent || !!facility?.email,
  };
}
