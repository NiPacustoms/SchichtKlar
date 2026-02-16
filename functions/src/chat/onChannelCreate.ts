import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

export const onChannelCreate = onDocumentCreated(
  'chatChannels/{channelId}',
  async (event) => {
    const db = getFirestore();
    const { channelId } = event.params as any;
    const channelData = event.data?.data();

    if (!channelData) {
      logger.warn('Channel data is missing');
      return;
    }

    try {
      // Validierung: Teilnehmer müssen vorhanden sein
      const participants = channelData.participants || [];
      if (participants.length === 0) {
        logger.error(`Channel ${channelId} created without participants`);
        // Lösche ungültigen Channel
        await db.collection('chatChannels').doc(channelId).delete();
        return;
      }

      // Validierung: createdBy muss in participants sein
      const createdBy = channelData.createdBy;
      if (createdBy && !participants.includes(createdBy)) {
        logger.warn(`Channel ${channelId}: createdBy not in participants, adding...`);
        await db.collection('chatChannels').doc(channelId).update({
          participants: [...participants, createdBy],
        });
      }

      // Normalisierung: Channel-Name für Direkt-Chats
      if (channelData.type === 'direct' && !channelData.name) {
        // Name wird client-seitig generiert, hier nur Validierung
        logger.info(`Direct channel ${channelId} created without name (will be generated client-side)`);
      }

      // Normalisierung: Broadcast-Channels müssen Namen haben
      if (channelData.type === 'broadcast' && !channelData.name) {
        logger.warn(`Broadcast channel ${channelId} created without name, setting default...`);
        await db.collection('chatChannels').doc(channelId).update({
          name: 'Broadcast',
        });
      }

      // Normalisierung: archived-Feld initialisieren
      if (channelData.archived === undefined) {
        await db.collection('chatChannels').doc(channelId).update({
          archived: false,
        });
      }

      logger.info(`Channel ${channelId} created and validated successfully`, {
        type: channelData.type,
        participantsCount: participants.length,
      });
    } catch (error) {
      logger.error('Error in onChannelCreate:', error);
      throw error;
    }
  }
);

