import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { sendTemplatedEmail } from './email';

const db = getFirestore();

const DEFAULT_LOCALE = 'de';
type TemplateChannel = 'app' | 'email';

const TEMPLATE_KEYS = {
  SHIFT_ASSIGNED: 'shift_assigned',
  ASSIGNMENT_CONFIRMED: 'assignment_confirmed',
  ASSIGNMENT_REJECTED: 'assignment_rejected',
  DOCUMENT_VERIFIED: 'document_verified',
  DOCUMENT_REJECTED: 'document_rejected',
  DOCUMENT_EXPIRY_WARNING: 'document_expiry_warning',
  SHIFT_REQUESTED_ADMIN: 'shift_requested_admin',
  ASSIGNMENT_ACCEPTED_ADMIN: 'assignment_accepted_admin',
  SHIFT_FULL_ADMIN: 'shift_full_admin',
} as const;

type TemplateKey = (typeof TEMPLATE_KEYS)[keyof typeof TEMPLATE_KEYS];

interface NotificationOptions {
  userId: string;
  templateKey: TemplateKey;
  payload?: Record<string, unknown>;
  fallback: {
    title: string;
    message: string;
    subject?: string;
  };
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

const isFalse = (value: unknown): boolean => value === false;

type TemplateDocument = {
  id: string;
  locale: string;
  title?: string;
  message?: string;
  subject?: string;
  bodyHtml?: string;
  actionText?: string;
};

async function fetchTemplateCandidate(
  companyId: string,
  templateKey: TemplateKey,
  channel: TemplateChannel,
  locale?: string,
  status: 'published' | 'draft' = 'published'
) {
  let query = db
    .collection('companyTemplates')
    .where('companyId', '==', companyId)
    .where('key', '==', templateKey)
    .where('channel', '==', channel)
    .where('status', '==', status)
    .limit(1);

  if (locale) {
    query = query.where('locale', '==', locale);
  }

  const snapshot = await query.get();
  return snapshot.empty ? null : snapshot.docs[0];
}

async function loadCompanyTemplate(
  companyId: string,
  templateKey: TemplateKey,
  channel: TemplateChannel,
  locale: string
): Promise<TemplateDocument | null> {
  const attempts: Array<{ locale?: string; status: 'published' | 'draft' }> = [
    { locale, status: 'published' },
    { locale, status: 'draft' },
    { locale: DEFAULT_LOCALE, status: 'published' },
    { locale: DEFAULT_LOCALE, status: 'draft' },
    { locale: undefined, status: 'published' },
    { locale: undefined, status: 'draft' },
  ];

  for (const attempt of attempts) {
    const doc = await fetchTemplateCandidate(companyId, templateKey, channel, attempt.locale, attempt.status);
    if (doc) {
      const data = doc.data() as Record<string, unknown>;
      const resolvedLocale =
        (typeof data.locale === 'string' && data.locale.trim().length > 0 ? data.locale : undefined) ??
        attempt.locale ??
        locale;

      const message =
        typeof data.message === 'string'
          ? data.message
          : typeof data.bodyText === 'string'
            ? data.bodyText
            : undefined;

      return {
        id: doc.id,
        locale: resolvedLocale,
        title: typeof data.title === 'string' ? data.title : undefined,
        message,
        subject: typeof data.subject === 'string' ? data.subject : undefined,
        bodyHtml: typeof data.bodyHtml === 'string' ? data.bodyHtml : undefined,
        actionText: typeof data.actionText === 'string' ? data.actionText : undefined,
      };
    }
  }

  return null;
}

function formatDateValue(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return date.toISOString().split('T')[0];
  }
  return undefined;
}

async function sendNotification({
  userId,
  templateKey,
  payload = {},
  fallback,
  actionUrl,
  metadata,
}: NotificationOptions) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      logger.warn('Notification skipped, user missing', { userId, templateKey });
      return;
    }

    const userData = userDoc.data() as Record<string, unknown>;
    const companyId = typeof userData.companyId === 'string' ? userData.companyId : undefined;
    const email = typeof userData.email === 'string' ? userData.email : undefined;
    const localeValue =
      (typeof (userData as Record<string, unknown>).preferredLocale === 'string'
        ? (userData as Record<string, string>).preferredLocale
        : undefined)
      || (typeof (userData as Record<string, unknown>).locale === 'string'
        ? (userData as Record<string, string>).locale
        : undefined)
      || DEFAULT_LOCALE;

    const settingsDoc = await db.collection('notificationSettings').doc(userId).get();
    const settingsData = settingsDoc.exists ? (settingsDoc.data() as Record<string, unknown>) : {};
    const channels = (settingsData.channels || {}) as Record<string, unknown>;
    const typeChannels = (settingsData.typeChannels || {}) as Record<string, { app?: boolean; email?: boolean }>;
    const legacyTypes = (settingsData.types || {}) as Record<string, unknown>;

    const channelAppAllowed = !isFalse(channels.app);
    const channelEmailAllowed = !isFalse(channels.email);
    const legacyAllowed = !isFalse(legacyTypes[templateKey]);
    const typeChannelConfig = typeChannels[templateKey];
    const typeAppFlag = typeChannelConfig?.app;
    const typeEmailFlag = typeChannelConfig?.email;

    const appAllowed = channelAppAllowed && (typeAppFlag !== false) && legacyAllowed;
    const emailEnabledGlobal = settingsData.emailEnabled !== false;
    const emailAllowed = emailEnabledGlobal && channelEmailAllowed && (typeEmailFlag !== false) && legacyAllowed;

    const baseMetadata: Record<string, unknown> = {
      ...(metadata || {}),
      templateKey,
      locale: localeValue,
    };
    if (Object.keys(payload).length > 0) {
      baseMetadata.payload = payload;
    }

    if (companyId) {
      baseMetadata.companyId = companyId;
    }

    if (appAllowed) {
      let templateData: TemplateDocument | null = null;
      if (companyId) {
        templateData = await loadCompanyTemplate(companyId, templateKey, 'app', localeValue);
      }

      const title = templateData?.title || fallback.title;
      const message = templateData?.message || fallback.message;
      const actionText = templateData?.actionText;

      if (templateData) {
        baseMetadata.templateId = templateData.id;
        baseMetadata.templateLocale = templateData.locale;
      }

      // Prüfe User-Rolle und speichere in richtige Collection
      const userRole = userData.role || 'nurse';
      const notificationCollection = userRole === 'nurse' ? 'employeeNotifications' : 'notifications';
      
      await db.collection(notificationCollection).add({
        userId,
        type: templateKey,
        title,
        message,
        read: false,
        important: false,
        priority: 'normal',
        actionUrl: actionUrl || null,
        actionText: actionText || null,
        metadata: baseMetadata,
        channel: 'app',
        companyId: companyId || null,
        templateKey,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      logger.info('Notification stored', { userId, templateKey, channel: 'app', collection: notificationCollection });
    }

    if (emailAllowed && email) {
      let templateData: TemplateDocument | null = null;
      if (companyId) {
        templateData = await loadCompanyTemplate(companyId, templateKey, 'email', localeValue);
      }

      const subject = templateData?.subject || fallback.subject || fallback.title;
      const html = templateData?.bodyHtml || `<p>${fallback.message}</p>`;
      const text = templateData?.message || fallback.message;

      try {
        const result = await sendTemplatedEmail({
          to: email,
          subject,
          html,
          text,
        });
        logger.info('Email notification dispatched', { userId, templateKey, fallback: result.fallback === true });
      } catch (emailError) {
        logger.error('Failed to send notification email', {}, { userId, templateKey, error: emailError });
      }
    }
  } catch (error) {
    logger.error('Error sending notification', error instanceof Error ? error : new Error(String(error)), {}, { userId, templateKey });
  }
}

// Shift Assignment Notification
export const onShiftAssigned = onDocumentUpdated('shifts/{shiftId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  // Check if assignedUserId changed
  if (before.assignedUserId !== after.assignedUserId && after.assignedUserId) {
    const shiftDate = formatDateValue(after.date);
    await sendNotification({
      userId: after.assignedUserId,
      templateKey: TEMPLATE_KEYS.SHIFT_ASSIGNED,
      actionUrl: '/employee/dienstplan',
      payload: {
        shiftType: after.type || 'Dienst',
        shiftDate,
        shiftStart: after.startTime,
        shiftEnd: after.endTime,
      },
      fallback: {
        title: 'Neue Schicht zugewiesen',
        message: `Dir wurde ein neuer ${after.type || 'Dienst'} am ${shiftDate || after.date} zugewiesen.`,
        subject: 'Neue Schicht zugewiesen',
      },
    });
  }
});

// Assignment Status Change
export const onAssignmentStatusChanged = onDocumentUpdated(
  'assignments/{assignmentId}',
  async event => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after || before.status === after.status) return;

    if (after.status === 'confirmed') {
    await sendNotification({
      userId: after.userId,
      templateKey: TEMPLATE_KEYS.ASSIGNMENT_CONFIRMED,
      actionUrl: '/employee/dienstplan',
      payload: {
        assignmentId: event.params.assignmentId,
        shiftId: after.shiftId,
        status: after.status,
      },
      fallback: {
        title: 'Dienst bestätigt',
        message: 'Deine Schicht wurde erfolgreich bestätigt.',
        subject: 'Dienst bestätigt',
      },
    });
    } else if (after.status === 'rejected') {
    await sendNotification({
      userId: after.userId,
      templateKey: TEMPLATE_KEYS.ASSIGNMENT_REJECTED,
      actionUrl: '/employee/dienstplan',
      payload: {
        assignmentId: event.params.assignmentId,
        shiftId: after.shiftId,
        status: after.status,
        reason: after.rejectionReason,
      },
      fallback: {
        title: 'Dienst abgelehnt',
        message: after.rejectionReason || 'Deine Schicht wurde abgelehnt.',
        subject: 'Dienst abgelehnt',
      },
    });
    }
  }
);

// Document Verification
export const onDocumentVerified = onDocumentUpdated('documents/{documentId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after || before.verified === after.verified) return;

  if (after.verified) {
    await sendNotification({
      userId: after.userId,
      templateKey: TEMPLATE_KEYS.DOCUMENT_VERIFIED,
      actionUrl: '/employee/profil',
      payload: {
        documentName: after.name,
        documentId: event.params.documentId,
      },
      fallback: {
        title: 'Dokument verifiziert',
        message: `Dein Dokument "${after.name}" wurde erfolgreich verifiziert.`,
        subject: 'Dokument verifiziert',
      },
    });
  } else if (after.rejectionReason) {
    await sendNotification({
      userId: after.userId,
      templateKey: TEMPLATE_KEYS.DOCUMENT_REJECTED,
      actionUrl: '/employee/profil',
      payload: {
        documentName: after.name,
        documentId: event.params.documentId,
        reason: after.rejectionReason,
      },
      fallback: {
        title: 'Dokument abgelehnt',
        message: `Dein Dokument "${after.name}" wurde abgelehnt: ${after.rejectionReason}`,
        subject: 'Dokument abgelehnt',
      },
    });
  }
});

// Document Expiry Warning (daily scheduled function)
export const checkDocumentExpiry = onDocumentCreated('documents/{documentId}', async event => {
  const data = event.data?.data();
  if (!data || !data.expiryDate) return;

  const expiryDate = new Date(data.expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Warn if document expires within 30 days
  if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
    await sendNotification({
      userId: data.userId as string,
      templateKey: TEMPLATE_KEYS.DOCUMENT_EXPIRY_WARNING,
      actionUrl: '/employee/profil',
      payload: {
        documentName: data.name,
        documentId: event.params.documentId,
        expiresInDays: daysUntilExpiry,
        expiryDate: expiryDate.toISOString(),
      },
      fallback: {
        title: 'Dokument läuft bald ab',
        message: `Dein Dokument "${data.name}" läuft in ${daysUntilExpiry} Tagen ab.`,
        subject: 'Dokument läuft bald ab',
      },
    });
  }
});

// Schichtverwaltung Notification Triggers
export const onAssignmentRequested = onDocumentCreated(
  'assignments/{assignmentId}',
  async event => {
    const assignment = event.data?.data();
    if (!assignment || assignment.status !== 'requested') return;

    try {
      // Admin-Benachrichtigung für Schichtanfrage
      const shiftRef = db.collection('shifts').doc(assignment.shiftId);
      const shiftDoc = await shiftRef.get();

      if (shiftDoc.exists) {
        const shift = shiftDoc.data()!;
        await sendNotification({
          userId: shift.createdBy,
          templateKey: TEMPLATE_KEYS.SHIFT_REQUESTED_ADMIN,
          actionUrl: `/admin/einsaetze/${event.params.assignmentId}`,
          payload: {
            assignmentId: event.params.assignmentId,
            shiftId: assignment.shiftId,
            requesterId: assignment.userId,
          },
          fallback: {
            title: 'Neue Schichtanfrage',
            message: 'Ein Mitarbeiter hat eine Anfrage für eine Schicht gesendet.',
            subject: 'Neue Schichtanfrage',
          },
        });
      }
    } catch (error) {
      logger.error('Error sending assignment request notification:', error);
    }
  }
);

export const onAssignmentAccepted = onDocumentUpdated('assignments/{assignmentId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after || before.status !== 'requested' || after.status !== 'accepted') return;

  try {
    // Admin-Benachrichtigung über Annahme
    const shiftRef = db.collection('shifts').doc(after.shiftId);
    const shiftDoc = await shiftRef.get();

    if (shiftDoc.exists) {
      const shift = shiftDoc.data()!;
      await sendNotification({
        userId: shift.createdBy,
        templateKey: TEMPLATE_KEYS.ASSIGNMENT_ACCEPTED_ADMIN,
        actionUrl: '/admin/schichten',
        payload: {
          assignmentId: event.params.assignmentId,
          shiftId: after.shiftId,
          employeeId: after.userId,
        },
        fallback: {
          title: 'Schicht angenommen',
          message: 'Ein Mitarbeiter hat eine Schichtanfrage angenommen.',
          subject: 'Schicht angenommen',
        },
      });
    }
  } catch (error) {
    logger.error('Error sending assignment accepted notification:', error);
  }
});

export const onShiftFull = onDocumentUpdated('shifts/{shiftId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  // Prüfen ob Schicht voll ist
  if (after.assignedCount >= after.capacity && before.assignedCount < before.capacity) {
    try {
      // Alle Admins benachrichtigen
      const adminsQuery = db.collection('users').where('role', 'in', ['admin', 'dispatcher']);
      const adminsSnapshot = await adminsQuery.get();

      const notifications = adminsSnapshot.docs.map(adminDoc =>
        sendNotification({
          userId: adminDoc.id,
          templateKey: TEMPLATE_KEYS.SHIFT_FULL_ADMIN,
          actionUrl: '/admin/schichten',
          payload: {
            shiftId: event.params.shiftId,
            capacity: after.capacity,
            assignedCount: after.assignedCount,
          },
          fallback: {
            title: 'Schicht voll besetzt',
            message: 'Eine Schicht ist jetzt voll besetzt.',
            subject: 'Schicht voll besetzt',
          },
        })
      );

      await Promise.all(notifications);
    } catch (error) {
      logger.error('Error sending shift full notifications:', error);
    }
  }
});
