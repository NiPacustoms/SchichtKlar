import { db, getDb, storage } from '@/lib/firebase';
import { Channel, Message, MessageAttachment } from '@/lib/types';
import {
  Unsubscribe,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const MESSAGES_COLLECTION = 'messages';
const CHANNELS_COLLECTION = 'channels';

export const messageService = {
  // Get message by ID
  async getById(id: string): Promise<Message | null> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    try {
      const messageDoc = await getDoc(doc(getDb(), MESSAGES_COLLECTION, id));
      if (!messageDoc.exists()) return null;

      const data = messageDoc.data();
      return {
        id: messageDoc.id,
        channelId: data.channelId,
        userId: data.userId,
        companyId: data.companyId || '',
        content: data.content,
        attachments: data.attachments || [],
        readBy: data.readBy || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      throw error;
    }
  },

  // Get messages by channel ID
  async getByChannelId(channelId: string, limitCount = 50): Promise<Message[]> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    try {
      const q = query(
        collection(getDb(), MESSAGES_COLLECTION),
        where('channelId', '==', channelId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const messages: Message[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          channelId: data.channelId,
          userId: data.userId,
          companyId: data.companyId || '',
          content: data.content,
          attachments: data.attachments || [],
          readBy: data.readBy || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      throw error;
    }
  },

  // Listen to messages in real-time
  listenToChannel(channelId: string, callback: (messages: Message[]) => void): Unsubscribe {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const q = query(
      collection(getDb(), MESSAGES_COLLECTION),
      where('channelId', '==', channelId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, snapshot => {
      const messages: Message[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          channelId: data.channelId,
          userId: data.userId,
          companyId: data.companyId || '',
          content: data.content,
          attachments: data.attachments || [],
          readBy: data.readBy || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      callback(messages);
    });
  },

  // Send message
  async sendMessage(
    channelId: string,
    userId: string,
    content: string,
    attachments?: File[]
  ): Promise<string> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    if (!storage) {
      throw new Error('Storage not initialized');
    }
    try {
      let messageAttachments: MessageAttachment[] = [];

      // Upload attachments if provided
      if (attachments && attachments.length > 0) {
        if (!storage) {
          throw new Error('Storage not initialized');
        }
        const uploadPromises = attachments.map(async file => {
          const fileRef = ref(storage!, `messages/${channelId}/${Date.now()}_${file.name}`);
          const uploadResult = await uploadBytes(fileRef, file);
          const downloadURL = await getDownloadURL(uploadResult.ref);

          return {
            id: Date.now().toString(),
            name: file.name,
            url: downloadURL,
            mimeType: file.type,
            fileSize: file.size,
          };
        });

        messageAttachments = await Promise.all(uploadPromises);
      }

      // Save message to Firestore
      const docRef = await addDoc(collection(getDb(), MESSAGES_COLLECTION), {
        channelId,
        userId,
        companyId: '', // Will be set from channel or user
        content,
        attachments: messageAttachments,
        readBy: [userId], // Mark as read by sender
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Letzte Nachricht am Channel denormalisieren (für Chat-Listen-Vorschau)
      const preview = content?.trim()
        ? content.trim().slice(0, 120)
        : messageAttachments.length > 0
          ? `📎 ${messageAttachments[0].name}`
          : '';
      await updateDoc(doc(getDb(), CHANNELS_COLLECTION, channelId), {
        lastMessage: preview,
        lastMessageUserId: userId,
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Mark message as read
  async markAsRead(messageId: string, userId: string): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    try {
      const messageRef = doc(getDb(), MESSAGES_COLLECTION, messageId);
      const messageDoc = await getDoc(messageRef);

      if (messageDoc.exists()) {
        const data = messageDoc.data();
        const readBy = data.readBy || [];

        if (!readBy.includes(userId)) {
          readBy.push(userId);
          await updateDoc(messageRef, {
            readBy,
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      throw error;
    }
  },

  // Update message
  async update(id: string, content: string): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    try {
      const messageRef = doc(getDb(), MESSAGES_COLLECTION, id);
      await updateDoc(messageRef, {
        content,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Delete message
  async delete(id: string): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    try {
      // Get message to delete attachments
      const messageDoc = await getDoc(doc(getDb(), MESSAGES_COLLECTION, id));
      if (messageDoc.exists()) {
        const data = messageDoc.data();

        // Delete attachments from Storage
        if (data.attachments && data.attachments.length > 0) {
          // Note: In a real app, you might want to implement cleanup
          // For now, we'll just delete the Firestore document
        }
      }

      await deleteDoc(doc(getDb(), MESSAGES_COLLECTION, id));
    } catch (error) {
      throw error;
    }
  },

  // Channel management
  async getChannelById(id: string): Promise<Channel | null> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    try {
      const channelDoc = await getDoc(doc(getDb(), CHANNELS_COLLECTION, id));
      if (!channelDoc.exists()) return null;

      const data = channelDoc.data();
      return {
        id: channelDoc.id,
        companyId: data.companyId || '',
        name: data.name,
        type: data.type,
        scopeId: data.scopeId,
        participants: data.participants || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      throw error;
    }
  },

  async getChannelsByUser(userId: string): Promise<Channel[]> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    try {
      const q = query(
        collection(getDb(), CHANNELS_COLLECTION),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const channels: Channel[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        channels.push({
          id: doc.id,
          companyId: data.companyId || '',
          name: data.name,
          type: data.type,
          scopeId: data.scopeId,
          participants: data.participants || [],
          lastMessage: data.lastMessage || '',
          lastMessageUserId: data.lastMessageUserId || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return channels;
    } catch (error) {
      throw error;
    }
  },

  // Listen to a user's channels in real-time (newest activity first)
  listenToChannels(userId: string, callback: (channels: Channel[]) => void): Unsubscribe {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const q = query(
      collection(getDb(), CHANNELS_COLLECTION),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, snapshot => {
      const channels: Channel[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        channels.push({
          id: doc.id,
          companyId: data.companyId || '',
          name: data.name,
          type: data.type,
          scopeId: data.scopeId,
          participants: data.participants || [],
          lastMessage: data.lastMessage || '',
          lastMessageUserId: data.lastMessageUserId || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      callback(channels);
    });
  },

  // Find an existing 1:1 channel with exactly these two participants, or create one
  async findOrCreateDirectChannel(
    userId: string,
    otherUserId: string,
    companyId?: string
  ): Promise<string> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const q = query(
      collection(getDb(), CHANNELS_COLLECTION),
      where('participants', 'array-contains', userId),
      where('type', '==', 'direct')
    );
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(d => {
      const participants: string[] = d.data().participants || [];
      return participants.length === 2 && participants.includes(otherUserId);
    });
    if (existing) return existing.id;

    return this.createChannel({
      companyId: companyId || '',
      name: '',
      type: 'direct',
      scopeId: 'direct',
      participants: [userId, otherUserId],
    });
  },

  async createChannel(data: Omit<Channel, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    try {
      const docRef = await addDoc(collection(getDb(), CHANNELS_COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

};
