/* eslint-disable @typescript-eslint/no-explicit-any */
import { db, storage, auth } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, query, where, orderBy, limit, startAfter, serverTimestamp, updateDoc, onSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { ChatChannel, ChatMessage, CreateChannelInput, SendMessageInput, ChatAttachment } from '@/lib/types/chatChannels';
import type { ChatUser } from '@/lib/types/chat';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { logger } from '@/lib/logging';

export async function getChannelsForUser(uid: string): Promise<ChatChannel[]> {
  if (!db || !uid) return [];
  try {
    const q = query(collection(db, 'chatChannels'), where('participants', 'array-contains', uid), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatChannel));
  } catch (error) {
    logger.error('Error getting channels', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

export async function getChannelById(channelId: string): Promise<ChatChannel | null> {
  if (!db || !channelId) return null;
  try {
    const channelDoc = await getDoc(doc(db, 'chatChannels', channelId));
    if (!channelDoc.exists()) {
      return null;
    }
    return { id: channelDoc.id, ...channelDoc.data() } as ChatChannel;
  } catch (error) {
    logger.error('Error getting channel by id', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

export async function createChannel(input: CreateChannelInput): Promise<{ id: string }> {
  if (!db) throw new Error('Database not initialized');
  if (!input.participants || input.participants.length === 0) {
    throw new Error('At least one participant is required');
  }
  if (!input.createdBy) {
    throw new Error('createdBy is required');
  }
  try {
    const now = serverTimestamp();
    const ref = await addDoc(collection(db, 'chatChannels'), { 
      ...input, 
      createdAt: now, 
      updatedAt: now,
      lastMessage: null,
      archived: false, // Standard: nicht archiviert
    });
    return { id: ref.id };
  } catch (error) {
    logger.error('Error creating channel', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export function onMessages(channelId: string, cb: (msgs: ChatMessage[]) => void, pageSize = 50): () => void {
  if (!db || !channelId) return () => {};
  const q = query(collection(db, `chatChannels/${channelId}/messages`), orderBy('createdAt', 'asc'), limit(pageSize));
  return onSnapshot(q, 
    (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage))),
    (error) => {
      logger.error('Error in onMessages', error instanceof Error ? error : new Error(String(error)));
      cb([]);
    }
  );
}

export async function getMessages(
  channelId: string, 
  options: { limit?: number; before?: QueryDocumentSnapshot } = {}
): Promise<{ messages: ChatMessage[]; lastDoc: QueryDocumentSnapshot | null }> {
  if (!db || !channelId) return { messages: [], lastDoc: null };
  try {
    const pageSize = Math.min(options.limit || 50, 100); // Max 100 messages per request
    let q = query(
      collection(db, `chatChannels/${channelId}/messages`),
      orderBy('createdAt', 'asc'),
      limit(pageSize)
    );
    if (options.before) {
      q = query(q, startAfter(options.before));
    }
    const snap = await getDocs(q);
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return { messages, lastDoc };
  } catch (error) {
    logger.error('Error getting messages', error instanceof Error ? error : new Error(String(error)));
    return { messages: [], lastDoc: null };
  }
}

/**
 * Extrahiert Mentions (@username) aus Text
 */
function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)]; // Duplikate entfernen
}

export async function sendMessage(channelId: string, msg: SendMessageInput): Promise<{ id: string }> {
  if (!db || !channelId || !msg.senderId) throw new Error('Missing required parameters');
  if (!msg.text && (!msg.attachments || msg.attachments.length === 0)) {
    throw new Error('Message must have text or attachments');
  }
  
  try {
    // Validiere, dass Channel existiert und User Teilnehmer ist
    const channelDoc = await getDoc(doc(db, 'chatChannels', channelId));
    if (!channelDoc.exists()) {
      throw new Error('Channel not found');
    }
    const channelData = channelDoc.data() as ChatChannel;
    if (!channelData.participants.includes(msg.senderId)) {
      throw new Error('User is not a participant of this channel');
    }
    
    // Hole senderName falls nicht vorhanden
    let senderName = msg.senderName;
    if (!senderName) {
      try {
        const userDoc = await getDoc(doc(db, 'users', msg.senderId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          senderName = userData.displayName || userData.name || userData.email || 'Unbekannt';
        }
      } catch (e) {
        logger.warn('Could not fetch sender name', {}, { error: e instanceof Error ? e.message : String(e) });
      }
    }
    
    // Extrahiere Mentions aus Text
    const mentions: string[] = msg.text ? extractMentions(msg.text) : [];
    
    const now = serverTimestamp();
    const messageData: Omit<ChatMessage, 'id'> & { createdAt: any } = {
      text: msg.text,
      senderId: msg.senderId,
      senderName: senderName || 'Unbekannt',
      type: msg.attachments?.length ? (msg.attachments[0].mime?.startsWith('image/') ? 'image' : 'file') : 'text',
      createdAt: now as any, // serverTimestamp() wird beim Speichern zu Timestamp konvertiert
      readBy: [msg.senderId],
      attachments: msg.attachments,
      mentions: mentions.length > 0 ? mentions : undefined,
      reactions: {},
      pinned: false,
    };
    const ref = await addDoc(collection(db, `chatChannels/${channelId}/messages`), messageData);
    // lastMessage/updatedAt werden in CF gepflegt (onMessageCreate)
    return { id: ref.id };
  } catch (error) {
    logger.error('Error sending message', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function markAsRead(channelId: string, messageId: string, uid: string) {
  if (!db || !channelId || !messageId || !uid) return;
  try {
    const msgRef = doc(db, `chatChannels/${channelId}/messages/${messageId}`);
    const msgSnap = await getDoc(msgRef);
    if (!msgSnap.exists()) return;
    const msgData = msgSnap.data();
    const readBy = Array.isArray(msgData.readBy) ? msgData.readBy : [];
    if (!readBy.includes(uid)) {
      await updateDoc(msgRef, { readBy: [...readBy, uid] });
    }
  } catch (error) {
    logger.error('Error marking message as read', error instanceof Error ? error : new Error(String(error)));
  }
}

export async function markChannelAsRead(channelId: string, uid: string): Promise<void> {
  if (!db || !channelId || !uid) return;
  try {
    // Validiere, dass User Teilnehmer ist
    const channelDoc = await getDoc(doc(db, 'chatChannels', channelId));
    if (!channelDoc.exists()) {
      logger.warn(`Channel ${channelId} does not exist`);
      return;
    }
    const channelData = channelDoc.data() as ChatChannel;
    if (!channelData.participants.includes(uid)) {
      logger.warn(`User ${uid} is not a participant of channel ${channelId}`);
      return;
    }
    
    // Markiere die letzten 50 ungelesenen Nachrichten als gelesen
    const messagesRef = collection(db, `chatChannels/${channelId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    
    const updates = snap.docs
      .filter(d => {
        const data = d.data();
        const readBy = Array.isArray(data.readBy) ? data.readBy : [];
        return !readBy.includes(uid);
      })
      .slice(0, 20); // Max 20 Updates pro Call
    
    // Batch updates
    for (const msgDoc of updates) {
      const msgData = msgDoc.data();
      const readBy = Array.isArray(msgData.readBy) ? msgData.readBy : [];
      if (!readBy.includes(uid)) {
        await updateDoc(msgDoc.ref, { readBy: [...readBy, uid] });
      }
    }
  } catch (error) {
    logger.error('Error marking channel as read', error instanceof Error ? error : new Error(String(error)));
  }
}

export async function addReaction(
  channelId: string,
  messageId: string,
  emoji: string,
  userId: string
): Promise<void> {
  if (!db || !channelId || !messageId || !emoji || !userId) {
    throw new Error('Missing required parameters');
  }
  try {
    const msgRef = doc(db, `chatChannels/${channelId}/messages/${messageId}`);
    const msgSnap = await getDoc(msgRef);
    if (!msgSnap.exists()) {
      throw new Error('Message not found');
    }
    
    const msgData = msgSnap.data();
    const reactions = msgData.reactions || {};
    const currentUsers = reactions[emoji] || [];
    
    if (currentUsers.includes(userId)) {
      // Reaction entfernen
      const updatedUsers = currentUsers.filter((id: string) => id !== userId);
      if (updatedUsers.length === 0) {
        delete reactions[emoji];
      } else {
        reactions[emoji] = updatedUsers;
      }
    } else {
      // Reaction hinzufügen
      reactions[emoji] = [...currentUsers, userId];
    }
    
    await updateDoc(msgRef, { reactions });
  } catch (error) {
    logger.error('Error adding reaction', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function pinMessage(channelId: string, messageId: string, pinned: boolean = true): Promise<void> {
  if (!db || !channelId || !messageId) {
    throw new Error('Missing required parameters');
  }
  try {
    // Update message
    const msgRef = doc(db, `chatChannels/${channelId}/messages/${messageId}`);
    await updateDoc(msgRef, { pinned });
    
    // Update channel pinnedMessages array
    const channelRef = doc(db, 'chatChannels', channelId);
    const channelSnap = await getDoc(channelRef);
    if (!channelSnap.exists()) {
      throw new Error('Channel not found');
    }
    
    const channelData = channelSnap.data();
    const pinnedMessages = channelData.pinnedMessages || [];
    
    if (pinned) {
      // Hinzufügen wenn nicht vorhanden
      if (!pinnedMessages.includes(messageId)) {
        await updateDoc(channelRef, {
          pinnedMessages: [...pinnedMessages, messageId],
        });
      }
    } else {
      // Entfernen
      await updateDoc(channelRef, {
        pinnedMessages: pinnedMessages.filter((id: string) => id !== messageId),
      });
    }
  } catch (error) {
    logger.error('Error pinning message', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function editMessage(
  channelId: string,
  messageId: string,
  newText: string,
  userId: string
): Promise<void> {
  if (!db || !channelId || !messageId || !newText) {
    throw new Error('Missing required parameters');
  }
  try {
    const msgRef = doc(db, `chatChannels/${channelId}/messages/${messageId}`);
    const msgSnap = await getDoc(msgRef);
    if (!msgSnap.exists()) {
      throw new Error('Message not found');
    }
    
    const msgData = msgSnap.data();
    if (msgData.senderId !== userId) {
      throw new Error('You can only edit your own messages');
    }
    
    // Extrahiere Mentions aus neuem Text
    const mentions: string[] = extractMentions(newText);
    
    await updateDoc(msgRef, {
      text: newText,
      editedAt: serverTimestamp(),
      mentions: mentions.length > 0 ? mentions : undefined,
    });
  } catch (error) {
    logger.error('Error editing message', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function deleteMessage(channelId: string, messageId: string, userId: string): Promise<void> {
  if (!db || !channelId || !messageId) {
    throw new Error('Missing required parameters');
  }
  try {
    const msgRef = doc(db, `chatChannels/${channelId}/messages/${messageId}`);
    const msgSnap = await getDoc(msgRef);
    if (!msgSnap.exists()) {
      throw new Error('Message not found');
    }
    
    const msgData = msgSnap.data();
    // Prüfe Berechtigung (eigener Ersteller oder Admin/Dispatcher - wird auch in Rules geprüft)
    if (msgData.senderId !== userId) {
      // Admin/Dispatcher-Check würde hier gemacht, aber Rules prüfen das auch
      throw new Error('You can only delete your own messages');
    }
    
    await updateDoc(msgRef, {
      text: '[Nachricht gelöscht]',
      type: 'system',
      deletedAt: serverTimestamp(),
    });
    // Alternativ: await deleteDoc(msgRef); - je nach Anforderung
  } catch (error) {
    logger.error('Error deleting message', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function uploadAttachment(
  file: File, 
  channelId: string, 
  onProgress?: (progress: number) => void
): Promise<ChatAttachment> {
  if (!storage || !file || !channelId) throw new Error('Missing required parameters');
  
  // Prüfe, ob User authentifiziert ist
  if (!auth?.currentUser) {
    throw new Error('User must be authenticated to upload files');
  }
  
  // Validiere, dass User Teilnehmer des Channels ist
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const channelDoc = await getDoc(doc(db, 'chatChannels', channelId));
    if (!channelDoc.exists()) {
      throw new Error('Channel not found');
    }
    
    const channelData = channelDoc.data() as ChatChannel;
    if (!channelData.participants.includes(auth.currentUser.uid)) {
      throw new Error('User is not a participant of this channel');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('not a participant')) {
      throw error;
    }
    logger.error('Error validating channel access', error instanceof Error ? error : new Error(String(error)));
    throw new Error('Failed to validate channel access');
  }
  
  // Validierung: Max 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  // Validierung: Nur Bilder und PDFs
  const allowedTypes = ['image/', 'application/pdf'];
  if (!allowedTypes.some(type => file.type.startsWith(type))) {
    throw new Error('Only images and PDF files are allowed');
  }
  
  try {
    // Sanitize filename
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `chatUploads/${channelId}/${crypto.randomUUID()}-${sanitizedFilename}`;
    const r = ref(storage, path);
    const task = uploadBytesResumable(r, file);
    
    await new Promise<void>((res, rej) => {
      task.on('state_changed', 
        (snapshot) => {
          if (onProgress) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          }
        },
        rej,
        () => res()
      );
    });
    
    const url = await getDownloadURL(r);
    return { url, name: file.name, mime: file.type, size: file.size };
  } catch (error) {
    logger.error('Error uploading attachment', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function archiveChannel(channelId: string, archived: boolean = true): Promise<void> {
  if (!db || !channelId) throw new Error('Missing required parameters');
  try {
    await updateDoc(doc(db, 'chatChannels', channelId), {
      archived,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Error archiving channel', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export function subscribeToChannels(uid: string, callback: (channels: ChatChannel[]) => void): () => void {
  if (!db || !uid) return () => {};
  // Filter: Nur nicht-archivierte Channels
  const q = query(
    collection(db, 'chatChannels'), 
    where('participants', 'array-contains', uid),
    where('archived', '==', false),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, 
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatChannel))),
    (error) => {
      logger.error('Error in subscribeToChannels', error instanceof Error ? error : new Error(String(error)));
      callback([]);
    }
  );
}

export function subscribeToMessages(channelId: string, callback: (messages: ChatMessage[]) => void, pageSize = 50): () => void {
  return onMessages(channelId, callback, pageSize);
}

export async function deleteChannel(channelId: string): Promise<void> {
  if (!db || !channelId) throw new Error('Missing required parameters');
  try {
    // Markiere als archiviert statt zu löschen (für Audit-Zwecke)
    await updateDoc(doc(db, 'chatChannels', channelId), {
      archived: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Error deleting channel', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function addParticipantToChannel(channelId: string, participantId: string): Promise<void> {
  if (!db || !channelId || !participantId) throw new Error('Missing required parameters');
  try {
    const channelRef = doc(db, 'chatChannels', channelId);
    const channelSnap = await getDoc(channelRef);
    if (!channelSnap.exists()) {
      throw new Error('Channel not found');
    }
    const channelData = channelSnap.data() as ChatChannel;
    const participants = channelData.participants || [];
    if (!participants.includes(participantId)) {
      await updateDoc(channelRef, {
        participants: [...participants, participantId],
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    logger.error('Error adding participant', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function removeParticipantFromChannel(channelId: string, participantId: string): Promise<void> {
  if (!db || !channelId || !participantId) throw new Error('Missing required parameters');
  try {
    const channelRef = doc(db, 'chatChannels', channelId);
    const channelSnap = await getDoc(channelRef);
    if (!channelSnap.exists()) {
      throw new Error('Channel not found');
    }
    const channelData = channelSnap.data() as ChatChannel;
    const participants = channelData.participants || [];
    if (participants.includes(participantId)) {
      await updateDoc(channelRef, {
        participants: participants.filter((id: string) => id !== participantId),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    logger.error('Error removing participant', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function markMessageAsRead(channelId: string, messageId: string, uid: string): Promise<void> {
  return markAsRead(channelId, messageId, uid);
}

export async function markMessagesAsRead(channelId: string, messageIds: string[], uid: string): Promise<void> {
  if (!db || !channelId || !messageIds || !uid) return;
  try {
    for (const messageId of messageIds) {
      await markAsRead(channelId, messageId, uid);
    }
  } catch (error) {
    logger.error('Error marking messages as read', error instanceof Error ? error : new Error(String(error)));
  }
}

export async function uploadChatFile(file: File, channelId: string, onProgress?: (progress: number) => void): Promise<ChatAttachment> {
  return uploadAttachment(file, channelId, onProgress);
}

export async function deleteChatFile(channelIdOrAttachment: string | ChatAttachment, fileUrlOrChannelId?: string): Promise<void> {
  // TODO: Implement file deletion from storage
  logger.warn('deleteChatFile not yet implemented');
  // Handle both signatures: deleteChatFile(channelId, fileUrl) and deleteChatFile(attachment, channelId)
  if (typeof channelIdOrAttachment === 'string') {
    // First signature: deleteChatFile(channelId: string, fileUrl: string)
    const channelId = channelIdOrAttachment;
    const fileUrl = fileUrlOrChannelId || '';
    logger.warn('deleteChatFile called with channelId + fileUrl', {}, { channelId, fileUrl });
    // Implementation would go here
  } else {
    // Second signature: deleteChatFile(attachment: ChatAttachment, channelId: string)
    const attachment = channelIdOrAttachment;
    const channelId = fileUrlOrChannelId || '';
    logger.warn('deleteChatFile called with attachment + channelId', {}, { attachmentName: attachment.name, channelId });
    // Implementation would go here
  }
}

export async function getAllUsers(companyId?: string): Promise<ChatUser[]> {
  if (!db) return [];
  try {
    if (!companyId) {
      return [];
    }

    // Versuche zuerst die Query mit beiden Filtern
    const constraints = [where('active', '==', true), where('companyId', '==', companyId)];
    const q = query(collection(db, 'users'), ...constraints);
    const snap = await getDocs(q);
    
    // Wenn keine Ergebnisse, prüfe ob es ein Index-Problem ist
    if (snap.empty) {
      // Test: Prüfe ob es überhaupt Benutzer mit dieser companyId gibt
      try {
        const testQuery = query(collection(db, 'users'), where('companyId', '==', companyId));
        const testSnap = await getDocs(testQuery);
        if (!testSnap.empty) {
          // Es gibt Benutzer mit dieser companyId, aber sie sind möglicherweise nicht aktiv
          // oder der Index für active+companyId ist noch nicht fertig
          logger.warn(`Gefunden: ${testSnap.size} Benutzer mit companyId ${companyId}, aber 0 mit active=true. Index möglicherweise noch nicht aktiv.`);
        }
      } catch (testError) {
        // Ignoriere Test-Fehler
      }
    }
    
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.displayName || data.name || data.email || 'Unbekannt',
        email: data.email || '',
        avatar: data.photoURL || data.avatar,
        role: data.role || 'nurse',
        online: false, // Would need real-time subscription
        lastSeen: undefined,
      } as ChatUser;
    });
  } catch (error: any) {
    // Prüfe auf Index-Fehler
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      logger.error('Firestore Index fehlt oder ist noch nicht aktiv. Bitte prüfe die Firebase Console', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Der Firestore-Index wird noch erstellt. Bitte warte einige Minuten und versuche es erneut.');
    }
    logger.error('Error getting all users', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function getOrCreateDirectChannel(userId1: string, userId2: string): Promise<string> {
  if (!db || !userId1 || !userId2) throw new Error('Missing required parameters');
  try {
    // Hole companyId aus Auth oder User-Dokument
    let companyId: string | null = null;
    try {
      companyId = await getCompanyIdFromAuth();
    } catch (error) {
      // Falls Auth-Token nicht verfügbar, versuche aus User-Dokument
      try {
        const userDoc = await getDoc(doc(db, 'users', userId1));
        if (userDoc.exists()) {
          companyId = userDoc.data()?.companyId || null;
        }
      } catch (docError) {
        logger.warn('Could not get companyId from user document', {}, { error: docError instanceof Error ? docError.message : String(docError) });
      }
    }

    // Suche nach existierendem Direct-Channel
    const q = query(
      collection(db, 'chatChannels'),
      where('type', '==', 'direct'),
      where('participants', 'array-contains', userId1)
    );
    const snap = await getDocs(q);
    const existingChannel = snap.docs.find(doc => {
      const data = doc.data();
      return data.participants?.includes(userId2);
    });
    
    if (existingChannel) {
      return existingChannel.id;
    }
    
    // Erstelle neuen Direct-Channel mit companyId
    const channelData: CreateChannelInput = {
      participants: [userId1, userId2],
      type: 'direct',
      createdBy: userId1,
    };
    
    if (companyId) {
      channelData.companyId = companyId;
    }
    
    const result = await createChannel(channelData);
    return result.id;
  } catch (error) {
    logger.error('Error getting or creating direct channel', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export function subscribeToTyping(_channelId: string, _callback: (userIds: string[]) => void): () => void {
  // TODO: Implement typing indicators with Firestore
  // For now, return a no-op unsubscribe function
  return () => {};
}

export async function setTypingStatus(_channelId: string, _userId: string, _isTyping: boolean): Promise<void> {
  // TODO: Implement typing indicators with Firestore
  // For now, this is a no-op
  if (!db) return;
  // Could implement with Firestore real-time updates here
}

