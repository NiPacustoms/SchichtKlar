import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import { StaffGroup, StaffGroupData, StaffGroupMember } from '@/lib/types/staffGroup';
import { User } from '@/lib/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

const COLLECTION_NAME = 'staffGroups';

export const staffGroupService = {
  // Create a new staff group
  async create(data: StaffGroupData): Promise<StaffGroup> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot create staff group server-side');
    }
    try {
      const groupData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), groupData);
      
      return {
        id: docRef.id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Error creating staff group', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  // Get all staff groups
  async getAll(): Promise<StaffGroup[]> {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const q = query(
        collection(getDb(), COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as StaffGroup[];
    } catch (error) {
      logger.error('Error fetching staff groups', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  // Get a specific staff group by ID
  async getById(id: string): Promise<StaffGroup | null> {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const docRef = doc(getDb(), COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as StaffGroup;
    } catch (error) {
      logger.error('Error fetching staff group', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  // Update a staff group
  async update(id: string, data: Partial<StaffGroupData>): Promise<void> {
    try {
      const docRef = doc(getDb(), COLLECTION_NAME, id);
      
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Error updating staff group', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  // Delete a staff group
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(getDb(), COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      logger.error('Error deleting staff group', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  // Add member to group
  async addMember(groupId: string, userId: string): Promise<void> {
    try {
      const groupRef = doc(getDb(), COLLECTION_NAME, groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Staff group not found');
      }
      
      const currentMembers = groupDoc.data().members || [];
      
      if (!currentMembers.includes(userId)) {
        await updateDoc(groupRef, {
          members: [...currentMembers, userId],
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      logger.error('Error adding member to group', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  // Remove member from group
  async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      const groupRef = doc(getDb(), COLLECTION_NAME, groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Staff group not found');
      }
      
      const currentMembers = groupDoc.data().members || [];
      const updatedMembers = currentMembers.filter((id: string) => id !== userId);
      
      await updateDoc(groupRef, {
        members: updatedMembers,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Error removing member from group', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  // Get group members with user details
  async getGroupMembers(groupId: string): Promise<StaffGroupMember[]> {
    try {
      const groupDoc = await this.getById(groupId);
      if (!groupDoc) {
        return [];
      }

      const memberPromises = groupDoc.members.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(getDb(), 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            return {
              userId,
              displayName: userData.displayName,
              email: userData.email,
              role: userData.role,
              addedAt: new Date(), // We don't track when members were added
            };
          }
          return null;
        } catch (error) {
          logger.error(`Error fetching user ${userId}`, error instanceof Error ? error : new Error(String(error)));
          return null;
        }
      });

      const members = await Promise.all(memberPromises);
      return members.filter((member): member is StaffGroupMember => member !== null);
    } catch (error) {
      logger.error('Error fetching group members', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  // Get groups for a specific user
  async getGroupsForUser(userId: string): Promise<StaffGroup[]> {
    try {
      const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('members', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as StaffGroup[];
    } catch (error) {
      logger.error('Error fetching groups for user', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },
};