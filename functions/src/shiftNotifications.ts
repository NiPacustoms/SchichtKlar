import { FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
const db = getFirestore();
const DEFAULT_SHIFT_LINK = '/employee/dienstplan';

type ShiftNotificationPayload = {
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: 'normal' | 'high';
  read: boolean;
  metadata: Record<string, unknown>;
  actionUrl?: string | null;
  createdAt?: FirebaseFirestore.FieldValue;
};

export const notifyShiftCreated = onDocumentCreated(
  {
    document: 'shifts/{shiftId}',
    region: 'europe-west1',
  },
  async event => {
    const shift = event.data?.data();
    if (!shift) return;

    logger.info('New shift created, sending notifications:', { shiftId: event.params.shiftId });

    try {
      // Get facility information
      const facility = await getFacilityInfo(shift.facilityId);

      // Get all nurses who might be interested in this shift
      const eligibleNurses = await getEligibleNurses(shift);

      // Create notifications for eligible nurses
      const notifications: ShiftNotificationPayload[] = eligibleNurses.map(nurse => ({
        userId: nurse.id,
        type: 'new_shift_available',
        title: 'Neuer Dienst verfügbar',
        message: `Ein neuer ${getShiftTypeLabel(shift.type)} ist am ${formatDate(shift.date)} in ${facility.name} verfügbar.`,
        priority: 'normal',
        read: false,
        actionUrl: DEFAULT_SHIFT_LINK,
        metadata: {
          shiftId: event.params.shiftId,
          shiftType: shift.type,
          shiftDate: shift.date,
          facilityName: facility.name,
          startTime: shift.start,
          endTime: shift.end,
        },
        createdAt: FieldValue.serverTimestamp(),
      }));

      // Batch create notifications
      if (notifications.length > 0) {
        await storeNotifications(notifications);

        logger.info(`Sent ${notifications.length} shift notifications`);
      }

      // Create audit log
      await createAuditLog({
        action: 'shift_created',
        userId: 'system',
        resourceType: 'shift',
        resourceId: event.params.shiftId,
        description: `Neuer Dienst erstellt: ${getShiftTypeLabel(shift.type)} am ${formatDate(shift.date)}`,
        metadata: {
          shiftType: shift.type,
          shiftDate: shift.date,
          facilityName: facility.name,
          notificationsSent: notifications.length,
        },
      });
    } catch (error) {
      logger.error('Error sending shift creation notifications:', error);
    }
  }
);

export const notifyShiftUpdated = onDocumentUpdated(
  {
    document: 'shifts/{shiftId}',
    region: 'europe-west1',
  },
  async event => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) return;

    logger.info('Shift updated, checking for notifications:', { shiftId: event.params.shiftId });

    try {
      const notifications: ShiftNotificationPayload[] = [];

      // Check for assignment changes
      if (beforeData.assignedUserId !== afterData.assignedUserId) {
        // Assignment changed
        if (afterData.assignedUserId) {
          // New assignment
          const assignmentNotification = await createAssignmentNotification(
            afterData.assignedUserId,
            afterData,
            event.params.shiftId
          );
          if (assignmentNotification) {
            notifications.push(assignmentNotification);
          }

          // Notify previous assignee if there was one
          if (beforeData.assignedUserId && beforeData.assignedUserId !== afterData.assignedUserId) {
          const unassignmentNotification = await createUnassignmentNotification(
              beforeData.assignedUserId,
              beforeData,
              event.params.shiftId
            );
            if (unassignmentNotification) {
              notifications.push(unassignmentNotification);
            }
          }
        } else {
          // Assignment removed
          if (beforeData.assignedUserId) {
            const unassignmentNotification = await createUnassignmentNotification(
              beforeData.assignedUserId,
              beforeData,
              event.params.shiftId
            );
            if (unassignmentNotification) {
              notifications.push(unassignmentNotification);
            }
          }
        }
      }

      // Check for time changes
      if (beforeData.start !== afterData.start || beforeData.end !== afterData.end) {
        if (afterData.assignedUserId) {
          const timeChangeNotification = await createTimeChangeNotification(
            afterData.assignedUserId,
            beforeData,
            afterData,
            event.params.shiftId
          );
          if (timeChangeNotification) {
            notifications.push(timeChangeNotification);
          }
        }
      }

      // Check for date changes
      if (beforeData.date !== afterData.date) {
        if (afterData.assignedUserId) {
          const dateChangeNotification = await createDateChangeNotification(
            afterData.assignedUserId,
            beforeData,
            afterData,
            event.params.shiftId
          );
          if (dateChangeNotification) {
            notifications.push(dateChangeNotification);
          }
        }
      }

      // Check for status changes
      if (beforeData.status !== afterData.status) {
        if (afterData.assignedUserId) {
          const statusChangeNotification = await createStatusChangeNotification(
            afterData.assignedUserId,
            beforeData,
            afterData,
            event.params.shiftId
          );
          if (statusChangeNotification) {
            notifications.push(statusChangeNotification);
          }
        }
      }

      // Batch create notifications
      if (notifications.length > 0) {
        await storeNotifications(notifications);

        logger.info(`Sent ${notifications.length} shift update notifications`);
      }

      // Create audit log
      await createAuditLog({
        action: 'shift_updated',
        userId: 'system',
        resourceType: 'shift',
        resourceId: event.params.shiftId,
        description: `Dienst aktualisiert: ${getShiftTypeLabel(afterData.type)} am ${formatDate(afterData.date)}`,
        metadata: {
          changes: getShiftChanges(beforeData, afterData),
          notificationsSent: notifications.length,
        },
      });
    } catch (error) {
      logger.error('Error sending shift update notifications:', error);
    }
  }
);

async function getFacilityInfo(facilityId: string) {
  try {
    const facilityDoc = await db.collection('facilities').doc(facilityId).get();
    if (!facilityDoc.exists) {
      return { name: 'Unbekannte Einrichtung', id: facilityId };
    }
    return { ...facilityDoc.data(), id: facilityId };
  } catch (error) {
    logger.error('Error getting facility info:', error);
    return { name: 'Unbekannte Einrichtung', id: facilityId };
  }
}

async function getEligibleNurses(shift: any) {
  try {
    // Get all nurses
    const nursesSnapshot = await db.collection('users').where('role', '==', 'nurse').get();

    const eligibleNurses: any[] = [];

    for (const nurseDoc of nursesSnapshot.docs) {
      const nurse = nurseDoc.data();

      // Check if nurse has required qualifications
      if (shift.requirements && shift.requirements.length > 0) {
        const nurseQualifications = nurse.qualifications || [];
        const hasRequiredQualifications = shift.requirements.every((req: string) =>
          nurseQualifications.includes(req)
        );

        if (!hasRequiredQualifications) {
          continue;
        }
      }

      // Check if nurse is available (no overlapping shifts)
      const isAvailable = await checkNurseAvailability(nurseDoc.id, shift);
      if (isAvailable) {
        eligibleNurses.push({ id: nurseDoc.id, ...nurse });
      }
    }

    return eligibleNurses;
  } catch (error) {
    logger.error('Error getting eligible nurses:', error);
    return [];
  }
}

async function checkNurseAvailability(nurseId: string, shift: any) {
  try {
    const shiftDate = shift.date;
    const shiftStart = new Date(`${shiftDate}T${shift.start}`);
    const shiftEnd = new Date(`${shiftDate}T${shift.end}`);

    // Check for overlapping shifts
    const overlappingShifts = await db
      .collection('shifts')
      .where('assignedUserId', '==', nurseId)
      .where('date', '==', shiftDate)
      .where('status', 'in', ['assigned', 'confirmed'])
      .get();

    for (const doc of overlappingShifts.docs) {
      const existingShift = doc.data();
      const existingStart = new Date(`${existingShift.date}T${existingShift.start}`);
      const existingEnd = new Date(`${existingShift.date}T${existingShift.end}`);

      // Check for overlap
      if (shiftStart < existingEnd && shiftEnd > existingStart) {
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Error checking nurse availability:', error);
    return false;
  }
}

async function createAssignmentNotification(userId: string, shift: any, shiftId: string): Promise<ShiftNotificationPayload> {
  const facility = await getFacilityInfo(shift.facilityId);

  return {
    userId,
    type: 'shift_assigned',
    title: 'Dienst zugewiesen',
    message: `Sie wurden für einen ${getShiftTypeLabel(shift.type)} am ${formatDate(shift.date)} in ${facility.name} eingeteilt.`,
    priority: 'high' as const,
    read: false,
    actionUrl: DEFAULT_SHIFT_LINK,
    metadata: {
      shiftId,
      shiftType: shift.type,
      shiftDate: shift.date,
      facilityName: facility.name,
      startTime: shift.start,
      endTime: shift.end,
    },
    createdAt: FieldValue.serverTimestamp(),
  };
}

async function createUnassignmentNotification(userId: string, shift: any, shiftId: string): Promise<ShiftNotificationPayload> {
  const facility = await getFacilityInfo(shift.facilityId);

  return {
    userId,
    type: 'shift_unassigned',
    title: 'Dienst-Zuweisung entfernt',
    message: `Ihre Zuweisung für den ${getShiftTypeLabel(shift.type)} am ${formatDate(shift.date)} in ${facility.name} wurde entfernt.`,
    priority: 'normal' as const,
    read: false,
    actionUrl: DEFAULT_SHIFT_LINK,
    metadata: {
      shiftId,
      shiftType: shift.type,
      shiftDate: shift.date,
      facilityName: facility.name,
    },
    createdAt: FieldValue.serverTimestamp(),
  };
}

async function createTimeChangeNotification(
  userId: string,
  beforeData: any,
  afterData: any,
  shiftId: string
): Promise<ShiftNotificationPayload> {
  const facility = await getFacilityInfo(afterData.facilityId);

  return {
    userId,
    type: 'shift_time_changed',
    title: 'Dienstzeiten geändert',
    message: `Die Zeiten für Ihren ${getShiftTypeLabel(afterData.type)} am ${formatDate(afterData.date)} in ${facility.name} wurden geändert.`,
    priority: 'high' as const,
    read: false,
    actionUrl: DEFAULT_SHIFT_LINK,
    metadata: {
      shiftId,
      shiftType: afterData.type,
      shiftDate: afterData.date,
      facilityName: facility.name,
      oldStart: beforeData.start,
      newStart: afterData.start,
      oldEnd: beforeData.end,
      newEnd: afterData.end,
    },
    createdAt: FieldValue.serverTimestamp(),
  };
}

async function createDateChangeNotification(
  userId: string,
  beforeData: any,
  afterData: any,
  shiftId: string
): Promise<ShiftNotificationPayload> {
  const facility = await getFacilityInfo(afterData.facilityId);

  return {
    userId,
    type: 'shift_date_changed',
    title: 'Dienst-Datum geändert',
    message: `Das Datum für Ihren ${getShiftTypeLabel(afterData.type)} in ${facility.name} wurde von ${formatDate(beforeData.date)} auf ${formatDate(afterData.date)} geändert.`,
    priority: 'high' as const,
    read: false,
    actionUrl: DEFAULT_SHIFT_LINK,
    metadata: {
      shiftId,
      shiftType: afterData.type,
      oldDate: beforeData.date,
      newDate: afterData.date,
      facilityName: facility.name,
    },
    createdAt: FieldValue.serverTimestamp(),
  };
}

async function createStatusChangeNotification(
  userId: string,
  beforeData: any,
  afterData: any,
  shiftId: string
): Promise<ShiftNotificationPayload> {
  const facility = await getFacilityInfo(afterData.facilityId);

  return {
    userId,
    type: 'shift_status_changed',
    title: 'Dienst-Status geändert',
    message: `Der Status Ihres ${getShiftTypeLabel(afterData.type)} am ${formatDate(afterData.date)} in ${facility.name} wurde geändert.`,
    priority: 'normal' as const,
    read: false,
    actionUrl: DEFAULT_SHIFT_LINK,
    metadata: {
      shiftId,
      shiftType: afterData.type,
      shiftDate: afterData.date,
      facilityName: facility.name,
      oldStatus: beforeData.status,
      newStatus: afterData.status,
    },
    createdAt: FieldValue.serverTimestamp(),
  };
}

function getShiftChanges(beforeData: any, afterData: any) {
  const changes: string[] = [];

  if (beforeData.assignedUserId !== afterData.assignedUserId) {
    changes.push('assignment');
  }
  if (beforeData.start !== afterData.start || beforeData.end !== afterData.end) {
    changes.push('time');
  }
  if (beforeData.date !== afterData.date) {
    changes.push('date');
  }
  if (beforeData.status !== afterData.status) {
    changes.push('status');
  }
  if (beforeData.facilityId !== afterData.facilityId) {
    changes.push('facility');
  }

  return changes;
}

async function storeNotifications(notifications: ShiftNotificationPayload[]) {
  const batch = db.batch();
  
  // Lade User-Rollen für alle betroffenen User (Batch-Load für Performance)
  const userIds = [...new Set(notifications.map(n => n.userId))];
  const userDocs = await Promise.all(
    userIds.map(userId => db.collection('users').doc(userId).get())
  );
  
  const userRoles = new Map<string, string>();
  userDocs.forEach((doc, index) => {
    if (doc.exists) {
      const userData = doc.data();
      userRoles.set(userIds[index], userData?.role || 'nurse');
    }
  });
  
  // Speichere in richtige Collection basierend auf User-Rolle
  notifications.forEach(notification => {
    const userRole = userRoles.get(notification.userId) || 'nurse';
    const collectionName = userRole === 'nurse' ? 'employeeNotifications' : 'notifications';
    
    const notificationRef = db.collection(collectionName).doc();
    batch.set(notificationRef, {
      ...notification,
      createdAt: notification.createdAt || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  
  await batch.commit();
}

function getShiftTypeLabel(type: string): string {
  switch (type) {
    case 'early':
      return 'Frühdienst';
    case 'late':
      return 'Spätdienst';
    case 'night':
      return 'Nachtdienst';
    case 'oncall':
      return 'Bereitschaft';
    default:
      return type;
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

async function createAuditLog(logData: any) {
  try {
    await db.collection('auditLogs').add({
      ...logData,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error('Error creating audit log:', error);
  }
}
