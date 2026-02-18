import { db, getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  getDoc,
  doc,
} from 'firebase/firestore';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'nurse';
  type: 'user' | 'shift' | 'assignment' | 'timesheet' | 'document' | 'facility' | 'system';
  action: 'created' | 'updated' | 'deleted' | 'verified' | 'rejected' | 'accepted' | 'declined' | 'completed';
  entityType: string; // 'User', 'Shift', 'Assignment', etc.
  entityId: string;
  entityName: string;
  description: string;
  companyId: string; // Mandantenzugehörigkeit
  metadata?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivityFilters {
  userId?: string;
  companyId?: string; // Filter nach Firma (über User-IDs)
  type?: Activity['type'];
  action?: Activity['action'];
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface ActivityStats {
  total: number;
  byType: Record<string, number>;
  byAction: Record<string, number>;
  byUser: Record<string, number>;
  recent: Activity[];
}

const COLLECTION_NAME = 'activities';

export const activityService = {
  /**
   * Erstellt eine neue Aktivität
   */
  async create(data: Omit<Activity, 'id' | 'timestamp'>): Promise<Activity> {
    // Prüfe, ob wir im Browser sind und db verfügbar ist
    if (typeof window === 'undefined' || !db) {
      throw new Error('Firestore kann nur clientseitig verwendet werden');
    }
    try {
      // Hole companyId aus dem User oder Auth
      let companyId: string = data.companyId || '';
      if (!companyId && data.userId) {
        const firestoreDb = db || getDb();
        const userDoc = await getDoc(doc(firestoreDb, 'users', data.userId));
        if (userDoc.exists()) {
          companyId = userDoc.data().companyId || '';
        }
      }
      if (!companyId) {
        const authCompanyId = await getCompanyIdFromAuth();
        companyId = authCompanyId || '';
      }
      if (!companyId) {
        throw new Error('No companyId found for activity');
      }

      const now = Timestamp.now();
      const activityData = {
        ...data,
        companyId: companyId,
        timestamp: now,
      };

      // Verwende db direkt, wenn verfügbar, ansonsten getDb()
      const firestoreDb = db || getDb();
      const docRef = await addDoc(collection(firestoreDb, COLLECTION_NAME), activityData);
      
      return {
        id: docRef.id,
        ...activityData,
        timestamp: activityData.timestamp.toDate(),
      };
    } catch (error) {
      logger.error('Error creating activity', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  /**
   * Holt Aktivitäten mit optionalen Filtern
   */
  async getAll(filters: ActivityFilters = {}): Promise<Activity[]> {
    // Prüfe, ob wir im Browser sind und db verfügbar ist
    if (typeof window === 'undefined' || !db) {
      logger.warn('Firebase not initialized or called on server side, returning empty activities array');
      return [];
    }
    try {
      // WICHTIG: Activities benötigen immer companyId für Admin-Zugriff
      // Falls nicht übergeben, versuche es aus Auth zu holen
      let companyId = filters.companyId;
      if (!companyId) {
        companyId = await getCompanyIdFromAuth() || undefined;
      }
      
      // Wenn immer noch keine companyId vorhanden ist, gibt es keine Activities
      if (!companyId) {
        logger.warn('No companyId found for activities query. Returning empty array.');
        return [];
      }

      const constraints: QueryConstraint[] = [];

      // WICHTIG: Filter direkt nach companyId für Firestore Rules
      // Activities haben ein companyId Feld, daher können wir direkt danach filtern
      if (companyId) {
        constraints.push(where('companyId', '==', companyId));
      }

      // Filter nach User
      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }

      // Filter nach Typ
      if (filters.type) {
        constraints.push(where('type', '==', filters.type));
      }

      // Filter nach Aktion
      if (filters.action) {
        constraints.push(where('action', '==', filters.action));
      }

      // Filter nach Entity-Typ
      if (filters.entityType) {
        constraints.push(where('entityType', '==', filters.entityType));
      }

      // Filter nach Datum
      if (filters.startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
      }

      if (filters.endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
      }

      // Sortierung nach Zeitstempel (neueste zuerst)
      constraints.push(orderBy('timestamp', 'desc'));

      // Limit
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      // Verwende db direkt, wenn verfügbar, ansonsten getDb()
      const firestoreDb = db || getDb();
      const q = query(collection(firestoreDb, COLLECTION_NAME), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data() as {
          timestamp: Timestamp;
        } & Omit<Activity, 'id' | 'timestamp'>;
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
        } as Activity;
      });
    } catch (error) {
      logger.error('Error getting activities', error instanceof Error ? error : new Error(String(error)));
      return []; // Return empty array instead of throwing
    }
  },

  /**
   * Holt die neuesten Aktivitäten
   */
  async getRecent(limitCount: number = 50, companyId?: string): Promise<Activity[]> {
    return this.getAll({ limit: limitCount, companyId });
  },

  /**
   * Holt Aktivitäten für einen bestimmten User
   */
  async getByUserId(userId: string, limitCount?: number): Promise<Activity[]> {
    return this.getAll({ userId, limit: limitCount });
  },

  /**
   * Holt Aktivitäten für eine bestimmte Entity
   */
  async getByEntity(_entityType: string, _entityId: string): Promise<Activity[]> {
    return this.getAll({ entityType: _entityType, limit: 100 });
  },

  /**
   * Holt Aktivitäts-Statistiken
   */
  async getStats(limitCount: number = 1000): Promise<ActivityStats> {
    try {
      const activities = await this.getAll({ limit: limitCount });
      
      const byType: Record<string, number> = {};
      const byAction: Record<string, number> = {};
      const byUser: Record<string, number> = {};

      activities.forEach(activity => {
        byType[activity.type] = (byType[activity.type] || 0) + 1;
        byAction[activity.action] = (byAction[activity.action] || 0) + 1;
        byUser[activity.userName] = (byUser[activity.userName] || 0) + 1;
      });

      return {
        total: activities.length,
        byType,
        byAction,
        byUser,
        recent: activities.slice(0, 10),
      };
    } catch (error) {
      logger.error('Error getting activity stats', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  /**
   * Hilfsfunktionen für häufige Aktivitäten
   */
  async logUserActivity(
    userId: string,
    userName: string,
    userRole: Activity['userRole'],
    action: Activity['action'],
    entityType: string,
    entityId: string,
    entityName: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.create({
        userId,
        userName,
        userRole,
        type: 'user',
        action,
        entityType,
        entityId,
        entityName,
        description,
        companyId: '', // Will be set automatically in create()
        metadata,
      });
    } catch (error) {
      logger.error('Error logging user activity', error instanceof Error ? error : new Error(String(error)));
      // Don't throw - activity logging should not break the main flow
    }
  },

  async logShiftActivity(
    userId: string,
    userName: string,
    userRole: Activity['userRole'],
    action: Activity['action'],
    shiftId: string,
    shiftTitle: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.create({
        userId,
        userName,
        userRole,
        type: 'shift',
        action,
        entityType: 'Shift',
        entityId: shiftId,
        entityName: shiftTitle,
        description,
        companyId: '', // Will be set automatically in create()
        metadata,
      });
    } catch (error) {
      logger.error('Error logging shift activity', error instanceof Error ? error : new Error(String(error)));
    }
  },

  async logAssignmentActivity(
    userId: string,
    userName: string,
    userRole: Activity['userRole'],
    action: Activity['action'],
    assignmentId: string,
    assignmentDescription: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.create({
        userId,
        userName,
        userRole,
        type: 'assignment',
        action,
        entityType: 'Assignment',
        entityId: assignmentId,
        entityName: assignmentDescription,
        description,
        companyId: '', // Will be set automatically in create()
        metadata,
      });
    } catch (error) {
      logger.error('Error logging assignment activity', error instanceof Error ? error : new Error(String(error)));
    }
  },

  async logTimesheetActivity(
    userId: string,
    userName: string,
    userRole: Activity['userRole'],
    action: Activity['action'],
    timesheetId: string,
    timesheetDescription: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.create({
        userId,
        userName,
        userRole,
        type: 'timesheet',
        action,
        entityType: 'Timesheet',
        entityId: timesheetId,
        entityName: timesheetDescription,
        description,
        companyId: '', // Will be set automatically in create()
        metadata,
      });
    } catch (error) {
      logger.error('Error logging timesheet activity', error instanceof Error ? error : new Error(String(error)));
    }
  },

  async logDocumentActivity(
    userId: string,
    userName: string,
    userRole: Activity['userRole'],
    action: Activity['action'],
    documentId: string,
    documentName: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.create({
        userId,
        userName,
        userRole,
        type: 'document',
        action,
        entityType: 'Document',
        entityId: documentId,
        entityName: documentName,
        description,
        companyId: '', // Will be set automatically in create()
        metadata,
      });
    } catch (error) {
      logger.error('Error logging document activity', error instanceof Error ? error : new Error(String(error)));
    }
  },

  async logFacilityActivity(
    userId: string,
    userName: string,
    userRole: Activity['userRole'],
    action: Activity['action'],
    facilityId: string,
    facilityName: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.create({
        userId,
        userName,
        userRole,
        type: 'facility',
        action,
        entityType: 'Facility',
        entityId: facilityId,
        entityName: facilityName,
        description,
        companyId: '', // Will be set automatically in create()
        metadata,
      });
    } catch (error) {
      logger.error('Error logging facility activity', error instanceof Error ? error : new Error(String(error)));
    }
  },

  async logSystemActivity(
    action: Activity['action'],
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.create({
        userId: 'system',
        userName: 'System',
        userRole: 'admin',
        type: 'system',
        action,
        entityType: 'System',
        entityId: 'system',
        entityName: 'System',
        description,
        companyId: '', // Will be set automatically in create()
        metadata,
      });
    } catch (error) {
      logger.error('Error logging system activity', error instanceof Error ? error : new Error(String(error)));
    }
  },
};
