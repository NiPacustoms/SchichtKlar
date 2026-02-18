import { FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

async function runDocumentExpiryCheck(): Promise<void> {
  logger.info('Starting document expiry check...');

  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Find documents expiring in the next 30 days
    const expiringDocuments = await db
      .collection('documents')
      .where('expiryDate', '>=', now.toISOString())
      .where('expiryDate', '<=', thirtyDaysFromNow.toISOString())
      .get();

    logger.info(`Found ${expiringDocuments.size} documents expiring in the next 30 days`);

    const notifications: any[] = [];
    const auditLogs: any[] = [];

    for (const doc of expiringDocuments.docs) {
      const document = doc.data() as any;
      const expiryDate = new Date(document.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Create notification based on urgency
      const notification = await createExpiryNotification(document, daysUntilExpiry);
      if (notification) {
        notifications.push(notification);
      }

      // Create audit log
      const auditLog = {
        action: 'document_expiry_check',
        userId: document.userId,
        resourceType: 'document',
        resourceId: doc.id,
        description: `Dokument läuft in ${daysUntilExpiry} Tagen ab`,
        metadata: {
          documentName: document.name,
          documentType: document.type,
          expiryDate: document.expiryDate,
          daysUntilExpiry,
        },
        timestamp: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      };
      auditLogs.push(auditLog);
    }

    // Batch create notifications (in richtige Collection basierend auf User-Rolle)
    if (notifications.length > 0) {
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
      
      const batch = db.batch();
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
      logger.info(`Created ${notifications.length} expiry notifications`);
    }

    // Batch create audit logs
    if (auditLogs.length > 0) {
      const batch = db.batch();
      auditLogs.forEach(auditLog => {
        const auditLogRef = db.collection('auditLogs').doc();
        batch.set(auditLogRef, auditLog);
      });
      await batch.commit();
      logger.info(`Created ${auditLogs.length} audit logs`);
    }

    // Send summary to admins
    await sendExpirySummaryToAdmins(notifications.length, notifications.length);

    logger.info('Document expiry check completed successfully');
  } catch (error) {
    logger.error('Error during document expiry check:', error);

    const message = error instanceof Error ? error.message : String(error);
    // Create error audit log
    await db.collection('auditLogs').add({
      action: 'document_expiry_check_error',
      userId: 'system',
      resourceType: 'system',
      description: `Fehler bei Dokument-Ablauf-Check: ${message}`,
      error: message,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}

// Scheduled function to run daily at 6:00 AM
export const checkDocumentExpiry = onSchedule(
  {
    schedule: '0 6 * * *', // Daily at 6:00 AM
    timeZone: 'Europe/Berlin',
    region: 'europe-west1',
  },
  async () => {
    await runDocumentExpiryCheck();
  }
);

async function createExpiryNotification(document: any, daysUntilExpiry: number) {
  if (!document.userId) return null;

  let notificationType = 'document_expiry_warning';
  let title = 'Dokument läuft bald ab';
  let message = '';
  let priority = 'normal';

  if (daysUntilExpiry <= 0) {
    // Document is already expired
    notificationType = 'document_expired';
    title = 'Dokument ist abgelaufen';
    message = `Ihr Dokument "${document.name}" ist abgelaufen und muss erneuert werden.`;
    priority = 'high';
  } else if (daysUntilExpiry <= 7) {
    // Critical: expires within a week
    notificationType = 'document_expiry_critical';
    title = 'Dokument läuft in Kürze ab';
    message = `Ihr Dokument "${document.name}" läuft in ${daysUntilExpiry} Tag${daysUntilExpiry === 1 ? '' : 'en'} ab.`;
    priority = 'high';
  } else if (daysUntilExpiry <= 14) {
    // Warning: expires within two weeks
    notificationType = 'document_expiry_warning';
    title = 'Dokument läuft bald ab';
    message = `Ihr Dokument "${document.name}" läuft in ${daysUntilExpiry} Tagen ab.`;
    priority = 'normal';
  } else {
    // Info: expires within a month
    notificationType = 'document_expiry_info';
    title = 'Dokument läuft in einem Monat ab';
    message = `Ihr Dokument "${document.name}" läuft in ${daysUntilExpiry} Tagen ab.`;
    priority = 'low';
  }

  return {
    userId: document.userId,
    type: notificationType,
    title,
    message,
    priority,
    read: false,
    metadata: {
      documentId: document.id,
      documentName: document.name,
      documentType: document.type,
      expiryDate: document.expiryDate,
      daysUntilExpiry,
    },
    createdAt: FieldValue.serverTimestamp(),
  };
}

async function sendExpirySummaryToAdmins(totalExpiring: number, notificationsSent: number) {
  try {
    // Get all admin users
    const adminUsers = await db
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    if (adminUsers.empty) {
      logger.warn('No admin users found for expiry summary');
      return;
    }

    const summaryMessage =
      `Dokument-Ablauf-Check abgeschlossen:\n` +
      `• ${totalExpiring} Dokumente laufen in den nächsten 30 Tagen ab\n` +
      `• ${notificationsSent} Benachrichtigungen an Benutzer gesendet`;

    // Send summary to each admin
    const batch = db.batch();
    adminUsers.docs.forEach(doc => {
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        userId: doc.id,
        type: 'system_summary',
        title: 'Dokument-Ablauf-Check',
        message: summaryMessage,
        priority: 'low',
        read: false,
        metadata: {
          totalExpiring,
          notificationsSent,
        },
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    logger.info(`Sent expiry summary to ${adminUsers.size} admin users`);
  } catch (error) {
    logger.error('Error sending expiry summary to admins:', error);
  }
}

// Manual trigger function for testing
export const manualDocumentExpiryCheck = onSchedule(
  {
    schedule: '0 0 * * *', // Never runs automatically, only for manual testing
    timeZone: 'Europe/Berlin',
    region: 'europe-west1',
  },
  async event => {
    logger.info('Manual document expiry check triggered');
    await runDocumentExpiryCheck();
  }
);

// Function to check specific document types
export const checkSpecificDocumentTypes = onSchedule(
  {
    schedule: '0 8 * * 1', // Every Monday at 8:00 AM
    timeZone: 'Europe/Berlin',
    region: 'europe-west1',
  },
  async event => {
    logger.info('Checking specific document types...');

    const criticalDocumentTypes = ['health_certificate', 'vaccination', 'criminal_record'];

    for (const docType of criticalDocumentTypes) {
      try {
        const now = new Date();
        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(now.getDate() + 90);

        const criticalDocuments = await db
          .collection('documents')
          .where('type', '==', docType)
          .where('expiryDate', '>=', now.toISOString())
          .where('expiryDate', '<=', ninetyDaysFromNow.toISOString())
          .get();

        logger.info(`Found ${criticalDocuments.size} critical ${docType} documents`);

        // Send special notifications for critical documents (in richtige Collection basierend auf User-Rolle)
        const userIds = [...new Set(criticalDocuments.docs.map(doc => doc.data().userId))];
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
        
        const batch = db.batch();
        criticalDocuments.docs.forEach(doc => {
          const document = doc.data();
          const expiryDate = new Date(document.expiryDate);
          const daysUntilExpiry = Math.ceil(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const userRole = userRoles.get(document.userId) || 'nurse';
          const collectionName = userRole === 'nurse' ? 'employeeNotifications' : 'notifications';
          
          const notificationRef = db.collection(collectionName).doc();
          batch.set(notificationRef, {
            userId: document.userId,
            type: 'critical_document_expiry',
            title: 'Kritisches Dokument läuft ab',
            message: `Ihr ${getDocumentTypeLabel(docType)} läuft in ${daysUntilExpiry} Tagen ab. Bitte erneuern Sie es rechtzeitig.`,
            priority: 'high',
            read: false,
            metadata: {
              documentId: doc.id,
              documentName: document.name,
              documentType: document.type,
              expiryDate: document.expiryDate,
              daysUntilExpiry,
            },
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        });

        await batch.commit();
        logger.info(
          `Sent ${criticalDocuments.size} critical document notifications for ${docType}`
        );
      } catch (error) {
        logger.error(`Error checking ${docType} documents:`, error);
      }
    }
  }
);

function getDocumentTypeLabel(type: string): string {
  switch (type) {
    case 'health_certificate':
      return 'Gesundheitszeugnis';
    case 'vaccination':
      return 'Impfpass';
    case 'criminal_record':
      return 'Führungszeugnis';
    case 'qualification':
      return 'Qualifikationsnachweis';
    case 'personal_id':
      return 'Personalausweis';
    default:
      return type;
  }
}
