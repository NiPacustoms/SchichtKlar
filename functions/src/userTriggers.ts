import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';

// Firestore wird hier nur innerhalb des Trigger-Handlers über event.data?.ref verwendet
const auth = getAuth();

/**
 * Synchronisiert Custom Claims mit dem User-Dokument
 * Wird aufgerufen, wenn ein User-Dokument erstellt oder aktualisiert wird
 */
async function syncCustomClaims(userId: string, role: string | undefined, companyId: string | undefined) {
  try {
    // Set default role to 'nurse' if not specified
    const finalRole = role || 'nurse';

    // Prüfe aktuelle Custom Claims
    const firebaseUser = await auth.getUser(userId);
    const currentClaims = firebaseUser.customClaims || {};
    const currentRole = currentClaims.role;
    const currentCompanyId = currentClaims.companyId;

    // Aktualisieren, wenn sich die Rolle oder companyId geändert hat
    const roleChanged = currentRole !== finalRole;
    const companyIdChanged = companyId && currentCompanyId !== companyId;

    if (roleChanged || companyIdChanged) {
      const newClaims: Record<string, any> = {
        ...currentClaims,
        role: finalRole,
      };
      
      // companyId nur setzen, wenn vorhanden
      if (companyId) {
        newClaims.companyId = companyId;
      }

      await auth.setCustomUserClaims(userId, newClaims);
      logger.info(`Custom claims updated for user ${userId}: role ${currentRole || 'none'} → ${finalRole}, companyId ${currentCompanyId || 'none'} → ${companyId || 'none'}`);
    }
  } catch (error) {
    logger.error(`Error syncing custom claims for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Trigger: Wird ausgelöst, wenn ein User-Dokument erstellt wird
 */
export const onUserCreated = onDocumentCreated('users/{userId}', async event => {
  const userId = event.params.userId;
  const userData = event.data?.data();

  if (!userData) {
    logger.warn(`No data for user ${userId}`);
    return;
  }

  try {
    const role = userData.role;
    const companyId = userData.companyId;

    // Synchronisiere Custom Claims (inkl. companyId)
    await syncCustomClaims(userId, role, companyId);

    // Update document with default values if missing
    await event.data?.ref.update({
      role: role || 'nurse',
      qualifications: userData.qualifications || [],
      documents: userData.documents || [],
      notificationSettings: userData.notificationSettings || {
        emailNotifications: true,
        pushNotifications: true,
        shiftReminders: true,
        documentExpiry: true,
        systemAnnouncements: true,
      },
      createdAt: userData.createdAt || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`User ${userId} initialized with role: ${role || 'nurse'}, companyId: ${companyId || 'none'}`);
  } catch (error) {
    logger.error(`Error initializing user ${userId}:`, error);
  }
});

/**
 * Trigger: Wird ausgelöst, wenn ein User-Dokument aktualisiert wird
 * Synchronisiert Custom Claims, wenn sich die Rolle geändert hat
 */
export const onUserUpdated = onDocumentUpdated('users/{userId}', async event => {
  const userId = event.params.userId;
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (!beforeData || !afterData) {
    return;
  }

  // Prüfe, ob sich die Rolle oder companyId geändert hat
  const oldRole = beforeData.role;
  const newRole = afterData.role;
  const oldCompanyId = beforeData.companyId;
  const newCompanyId = afterData.companyId;

  const roleChanged = oldRole !== newRole;
  const companyIdChanged = oldCompanyId !== newCompanyId;

  if (roleChanged || companyIdChanged) {
    try {
      await syncCustomClaims(userId, newRole, newCompanyId);
      logger.info(`User data changed for ${userId}: role ${oldRole} → ${newRole}, companyId ${oldCompanyId || 'none'} → ${newCompanyId || 'none'}`);
    } catch (error) {
      logger.error(`Error syncing user changes for user ${userId}:`, error);
    }
  }
});
