/**
 * Push-Benachrichtigung bei neuer Chat-Nachricht.
 *
 * Datenmodell des aktuellen Chats: Top-Level-Collection `messages`
 * ({channelId, userId, content, attachments, readBy}) + `channels`
 * ({participants, type, name}). Alle Teilnehmer außer dem Absender
 * erhalten einen FCM-Push (respektiert notificationSettings.chatEnabled
 * über sendChatNotification).
 */
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { sendChatNotification } from './sendChatNotification';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const onNewChatMessage = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async snap => {
    const msg = snap.data();
    if (!msg?.channelId || !msg?.userId) return;

    const channelSnap = await db.collection('channels').doc(msg.channelId).get();
    if (!channelSnap.exists) {
      functions.logger.warn(`onNewChatMessage: Channel ${msg.channelId} nicht gefunden`);
      return;
    }

    const channel = channelSnap.data() || {};
    const participants: string[] = channel.participants || [];
    const recipients = participants.filter(p => p !== msg.userId);
    if (recipients.length === 0) return;

    // Absendername auflösen
    let senderName = 'Unbekannt';
    try {
      const userSnap = await db.collection('users').doc(msg.userId).get();
      if (userSnap.exists) {
        const u = userSnap.data();
        senderName = u?.displayName || u?.email || 'Unbekannt';
      }
    } catch {
      // Name bleibt 'Unbekannt'
    }

    // Bei 1:1-Chats keinen Channel-Namen anzeigen (der Absendername reicht)
    const channelName = channel.type === 'direct' ? undefined : channel.name || undefined;

    await Promise.all(
      recipients.map(userId =>
        sendChatNotification(
          userId,
          msg.channelId,
          {
            text: msg.content,
            senderName,
            senderId: msg.userId,
            attachments: msg.attachments,
          },
          channelName
        ).catch(err => {
          functions.logger.warn(`onNewChatMessage: Push an ${userId} fehlgeschlagen`, {
            error: err instanceof Error ? err.message : String(err),
          });
        })
      )
    );
  });
