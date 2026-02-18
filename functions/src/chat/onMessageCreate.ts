import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as logger from 'firebase-functions/logger';
import { sendChatNotification } from './sendChatNotification';

export const onMessageCreate = onDocumentCreated('chatChannels/{channelId}/messages/{messageId}', async (event) => {
  const db = getFirestore();
  const auth = getAuth();
  const { channelId } = event.params as any;
  const msg = event.data?.data();

  if (!msg) {
    logger.warn('Message data is missing');
    return;
  }

  try {
    // Hole senderName aus User-Dokument falls nicht vorhanden
    let senderName = msg.senderName;
    if (!senderName && msg.senderId) {
      try {
        const userDoc = await db.collection('users').doc(msg.senderId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          senderName = userData?.displayName || userData?.name || userData?.email || 'Unbekannt';
        }
      } catch (e) {
        logger.warn('Could not fetch sender name:', e);
        senderName = 'Unbekannt';
      }
    }

    const last = { 
      text: msg.text ?? (msg.attachments?.[0]?.name ?? 'Anhang'), 
      senderId: msg.senderId,
      senderName: senderName || 'Unbekannt',
      createdAt: msg.createdAt, 
      unreadCount: 0 
    };

    const chRef = db.collection('chatChannels').doc(channelId);
    const chSnap = await chRef.get();

    if (!chSnap.exists) {
      logger.warn(`Channel ${channelId} does not exist`);
      return;
    }

    const participants: string[] = chSnap.get('participants') || [];
    // Unread count = alle Teilnehmer außer dem Sender
    // Dies ist ein globaler Count für die Channel-Liste
    // Die tatsächlichen unreadCounts pro User werden clientseitig berechnet
    const unread = Math.max(participants.filter(p => p !== msg.senderId).length, 0);

    // Update channel with last message
    await chRef.update({ 
      lastMessage: { ...last, unreadCount: unread }, 
      updatedAt: msg.createdAt ?? new Date() 
    });
    
    // Sende Push-Notifications an alle Teilnehmer außer dem Sender
    const channelData = chSnap.data();
    const channelName = channelData?.name;
    
    const notificationPromises = participants
      .filter(p => p !== msg.senderId)
      .map(userId => 
        sendChatNotification(
          userId,
          channelId,
          {
            text: msg.text,
            senderName: senderName || 'Unbekannt',
            senderId: msg.senderId,
            attachments: msg.attachments,
          },
          channelName
        ).catch(err => {
          logger.warn(`Failed to send notification to user ${userId}:`, err);
        })
      );
    
    // Sende Notifications parallel (nicht blockierend)
    Promise.all(notificationPromises).catch(err => {
      logger.error('Error sending notifications:', err);
    });

    logger.info(`Updated channel ${channelId} with new message, unread: ${unread}`);
  } catch (error) {
    logger.error('Error in onMessageCreate:', error);
    throw error;
  }
});

