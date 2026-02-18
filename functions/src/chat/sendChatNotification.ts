import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

/**
 * Sendet Push-Notification für neue Chat-Nachrichten
 */
export async function sendChatNotification(
  userId: string,
  channelId: string,
  message: {
    text?: string;
    senderName: string;
    senderId: string;
    attachments?: Array<{ name: string; mime: string }>;
  },
  channelName?: string
): Promise<void> {
  try {
    const db = getFirestore();
    const messaging = getMessaging();

    // Hole FCM-Token des Users
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      logger.warn(`User ${userId} not found for notification`);
      return;
    }

    const userData = userDoc.data();
    const fcmToken = userDoc.data()?.fcmToken || userDoc.data()?.fcmTokens?.[0];

    if (!fcmToken) {
      logger.info(`No FCM token for user ${userId}`);
      return;
    }

    // Prüfe Notification-Einstellungen
    const notificationSettings = userData?.notificationSettings || {};
    if (notificationSettings.chatEnabled === false) {
      logger.info(`Chat notifications disabled for user ${userId}`);
      return;
    }

    // Erstelle Notification-Payload
    const messageText = message.text 
      ? (message.text.length > 100 ? message.text.substring(0, 100) + '...' : message.text)
      : (message.attachments?.[0]?.name || 'Anhang');

    const title = channelName || message.senderName;
    const body = `${message.senderName}: ${messageText}`;

    const payload = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        type: 'chat_message',
        channelId,
        messageId: message.senderId, // Wird später durch messageId ersetzt
        senderId: message.senderId,
        click_action: `FLUTTER_NOTIFICATION_CLICK`,
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'chat_messages',
          sound: 'default',
          priority: 'high' as const,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    await messaging.send(payload);
    logger.info(`Sent chat notification to user ${userId}`);
  } catch (error) {
    logger.error('Error sending chat notification:', error);
    // Nicht werfen, damit Message-Creation nicht fehlschlägt
  }
}

