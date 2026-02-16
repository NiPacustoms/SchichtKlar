import * as functions from 'firebase-functions/v1';
import { defineString } from 'firebase-functions/params';
import { getFirestore } from 'firebase-admin/firestore';
import { sendUserPushNotification } from './pushNotifications';
import { logger } from './utils/logger';

const db = getFirestore();

// Environment Variable für Deployment-Notification Secret
const deploymentNotificationSecret = defineString('DEPLOYMENT_NOTIFICATION_SECRET');

interface DeploymentNotificationRequest {
  status: 'success' | 'failure';
  message: string;
  deploymentType?: 'staging' | 'production';
  commitSha?: string;
  branch?: string;
  secret?: string; // Einfaches Secret für Authentifizierung
}

/**
 * Sendet Deployment-Benachrichtigungen an alle Admin-User
 * Wird von GitHub Actions aufgerufen
 */
export const notifyDeployment = functions.https.onRequest(async (req, res) => {
    try {
      // CORS Headers setzen
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type');

      // Handle OPTIONS request
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      // Nur POST erlauben
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const body = req.body as DeploymentNotificationRequest;
      const { status, message, deploymentType, commitSha, branch, secret } = body;

      // Einfache Authentifizierung (Secret aus Environment Variable)
      const expectedSecret = deploymentNotificationSecret.value();
      if (expectedSecret && secret !== expectedSecret) {
        logger.warn('Invalid secret for deployment notification');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validiere Eingabe
      if (!status || !message) {
        res.status(400).json({ error: 'Missing required fields: status, message' });
        return;
      }

      if (status !== 'success' && status !== 'failure') {
        res.status(400).json({ error: 'Invalid status. Must be "success" or "failure"' });
        return;
      }

      // Finde alle Admin-User
      const adminUsersSnapshot = await db
        .collection('users')
        .where('role', '==', 'admin')
        .get();

      if (adminUsersSnapshot.empty) {
        logger.info('No admin users found for deployment notification');
        res.status(200).json({ message: 'No admin users found', notified: 0 });
        return;
      }

      // Erstelle Benachrichtigungs-Text
      const emoji = status === 'success' ? '🚀' : '❌';
      const title = `Deployment ${status === 'success' ? 'erfolgreich' : 'fehlgeschlagen'}`;
      let bodyText = `${emoji} ${message}`;
      
      if (deploymentType) {
        bodyText += `\nUmgebung: ${deploymentType}`;
      }
      if (branch) {
        bodyText += `\nBranch: ${branch}`;
      }
      if (commitSha) {
        bodyText += `\nCommit: ${commitSha.substring(0, 7)}`;
      }

      // Sende Benachrichtigung an alle Admin-User
      const notificationPromises = adminUsersSnapshot.docs.map((doc) => {
        const userId = doc.id;
        return sendUserPushNotification({
          userId,
          title,
          body: bodyText,
          data: {
            type: 'deployment',
            status,
            deploymentType: deploymentType || 'unknown',
            branch: branch || '',
            commitSha: commitSha || '',
          },
          link: '/admin/uebersicht',
          notificationType: 'deployment',
        }).catch((error) => {
          logger.error(`Failed to send notification to user ${userId}`, error);
          return null;
        });
      });

      await Promise.allSettled(notificationPromises);

      const notifiedCount = adminUsersSnapshot.size;
      logger.info(`Deployment notification sent to ${notifiedCount} admin users`, {
        status,
        deploymentType,
      });

      res.status(200).json({
        message: 'Notifications sent',
        notified: notifiedCount,
        status,
      });
    } catch (error) {
      logger.error('Error in deployment notification function', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
