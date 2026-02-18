import { db, getDb } from '@/lib/firebase';
import { Alert, AlertRule, AlertSettings } from '@/lib/types/alert';
import { Document } from '@/lib/types';
import { Shift } from '@/lib/services/shifts';
import { User } from '@/lib/types';
import { logger } from '@/lib/logging';
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
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';

const ALERTS_COLLECTION = 'alerts';
const ALERT_RULES_COLLECTION = 'alertRules';
const ALERT_SETTINGS_COLLECTION = 'alertSettings';

export const alertService = {
  // Create a new alert
  async create(alertData: Omit<Alert, 'id' | 'createdAt' | 'acknowledged'>): Promise<Alert> {
    if (!db) {
      logger.warn('Firebase not initialized, cannot create alert');
      throw new Error('Firebase not initialized - cannot create alert');
    }
    try {
      // Hole companyId aus dem User oder Auth
      let companyId = alertData.companyId;
      if (!companyId && alertData.userId) {
        const userDoc = await getDoc(doc(getDb(), 'users', alertData.userId));
        if (userDoc.exists()) {
          companyId = userDoc.data().companyId || '';
        }
      }
      if (!companyId) {
        const authCompanyId = await getCompanyIdFromAuth();
        companyId = authCompanyId || '';
      }
      if (!companyId) {
        throw new Error('No companyId found for alert');
      }

      const alert = {
        ...alertData,
        companyId: companyId,
        acknowledged: false,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(getDb(), ALERTS_COLLECTION), alert);
      
      return {
        id: docRef.id,
        ...alertData,
        acknowledged: false,
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error('Error creating alert', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  // Get alerts for a user or all alerts (admin)
  async getAlerts(userId?: string, limitCount: number = 50, companyIdParam?: string): Promise<Alert[]> {
    if (!db) {
      logger.warn('Firebase not initialized, returning empty alerts array');
      return [];
    }
    try {
      // Hole companyId aus Auth, falls nicht übergeben
      let companyId = companyIdParam;
      if (!companyId) {
        companyId = await getCompanyIdFromAuth() || undefined;
      }
      if (!companyId) {
        logger.warn('No companyId found, returning empty array');
        return [];
      }

      let q;
      
      if (userId) {
        q = query(
          collection(getDb(), ALERTS_COLLECTION),
          where('companyId', '==', companyId),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else {
        // Filter nach companyId: Hole zuerst alle User-IDs der Firma
        const usersQuery = query(
          collection(getDb(), 'users'),
          where('companyId', '==', companyId)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const userIds = usersSnapshot.docs.map(doc => doc.id);
        // Wenn keine User für diese Firma existieren, gibt es auch keine Alerts
        if (userIds.length === 0) {
          return [];
        }
        // Firestore unterstützt nur 'in' mit max. 10 Werten
        // Wenn mehr als 10 User, müssen wir mehrere Queries machen
        if (userIds.length <= 10) {
          q = query(
            collection(getDb(), ALERTS_COLLECTION),
            where('companyId', '==', companyId),
            where('userId', 'in', userIds),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          );
        } else {
          // Für mehr als 10 User: Mehrere Queries ausführen
          const chunks: string[][] = [];
          for (let i = 0; i < userIds.length; i += 10) {
            chunks.push(userIds.slice(i, i + 10));
          }
          const allAlerts: Alert[] = [];
          for (const chunk of chunks) {
            const chunkQuery = query(
              collection(getDb(), ALERTS_COLLECTION),
              where('companyId', '==', companyId),
              where('userId', 'in', chunk),
              orderBy('createdAt', 'desc'),
              limit(limitCount)
            );
            const chunkSnapshot = await getDocs(chunkQuery);
            allAlerts.push(...chunkSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              acknowledgedAt: doc.data().acknowledgedAt?.toDate(),
              expiresAt: doc.data().expiresAt?.toDate(),
            })) as Alert[]);
          }
          // Sortiere nach createdAt und begrenze auf limit
          allAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          return allAlerts.slice(0, limitCount);
        }
      }
      
      if (!q) {
        return [];
      }
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          companyId: data.companyId || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          acknowledgedAt: data.acknowledgedAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
        } as Alert;
      });
    } catch (error) {
      logger.error('Error fetching alerts', error instanceof Error ? error : new Error(String(error)));
      return []; // Return empty array instead of throwing
    }
  },

  // Acknowledge an alert
  async acknowledge(alertId: string, userId: string): Promise<void> {
    if (!db) {
      logger.warn('Firebase not initialized, skipping alert acknowledgement');
      return;
    }
    try {
      const alertRef = doc(getDb(), ALERTS_COLLECTION, alertId);
      
      await updateDoc(alertRef, {
        acknowledged: true,
        acknowledgedAt: serverTimestamp(),
        acknowledgedBy: userId,
      });
    } catch (error) {
      logger.error('Error acknowledging alert', error instanceof Error ? error : new Error(String(error)));
      // Don't throw - alert acknowledgement should not break the application
    }
  },

  // Delete an alert
  async delete(alertId: string): Promise<void> {
    if (!db) {
      logger.warn('Firebase not initialized, skipping alert deletion');
      return;
    }
    try {
      const alertRef = doc(getDb(), ALERTS_COLLECTION, alertId);
      await deleteDoc(alertRef);
    } catch (error) {
      logger.error('Error deleting alert', error instanceof Error ? error : new Error(String(error)));
      // Don't throw - alert deletion should not break the application
    }
  },

  // Real-time alerts subscription
  subscribeToAlerts(userId: string | null, callback: (alerts: Alert[]) => void, companyIdParam?: string): () => void {
    if (!db) {
      logger.warn('Firebase not initialized, returning no-op unsubscribe function');
      callback([]); // Call with empty array immediately
      return () => {}; // Return no-op unsubscribe function
    }

    let q;
    
    try {
      // Hole companyId aus Auth, falls nicht übergeben
      const companyId = companyIdParam;
      if (!companyId) {
        // Versuche companyId synchron zu holen (nur wenn möglich)
        // Für async-Holung müsste die Funktion async sein, was die Signatur ändert
        // Daher wird companyId als Parameter erwartet
      }
      
      if (userId) {
        // Filter nach userId und acknowledged
        const constraints = [
          where('userId', '==', userId),
          where('acknowledged', '==', false)
        ];
        // Füge companyId-Filter hinzu, falls verfügbar
        if (companyId) {
          constraints.unshift(where('companyId', '==', companyId));
        }
        q = query(
          collection(getDb(), ALERTS_COLLECTION),
          ...constraints,
          limit(50)
        );
      } else {
        // Für Admin: Filter nach acknowledged und companyId (falls verfügbar)
        const constraints = [where('acknowledged', '==', false)];
        if (companyId) {
          constraints.unshift(where('companyId', '==', companyId));
        }
        q = query(
          collection(getDb(), ALERTS_COLLECTION),
          ...constraints,
          limit(50)
        );
      }

      return onSnapshot(q, (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          acknowledgedAt: doc.data().acknowledgedAt?.toDate(),
          expiresAt: doc.data().expiresAt?.toDate(),
        })) as Alert[];
        
        // Client-side sorting and limiting
        const sortedAlerts = alerts
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, userId ? 20 : 50);
        
        callback(sortedAlerts);
      }, (error) => {
        // Permission errors are expected in some cases - only log as warning
        const isPermissionError = error?.code === 'permission-denied' || 
                                  error?.message?.includes('permission') ||
                                  error?.message?.includes('Permission');
        if (isPermissionError) {
          logger.warn('Alerts subscription: Permission denied');
        } else {
          logger.error('Error in alerts subscription', error instanceof Error ? error : new Error(String(error)));
        }
        callback([]); // Call with empty array on error
      });
    } catch (error) {
      logger.error('Error setting up alerts subscription', error instanceof Error ? error : new Error(String(error)));
      callback([]); // Call with empty array on error
      return () => {}; // Return no-op unsubscribe function
    }
  },

  // Alert generation methods
  async checkDocumentAlerts(): Promise<void> {
    try {
      // Check for expiring documents
      const expiringDocs = await this.getExpiringDocuments();
      
      for (const doc of expiringDocs) {
        await this.create({
          type: 'document',
          severity: 'medium',
          title: 'Dokument läuft bald ab',
          message: `Das Dokument "${doc.type}" von ${doc.userId} läuft bald ab.`,
          userId: doc.userId,
          companyId: '', // Will be set automatically in create()
          metadata: { documentId: doc.id, documentType: doc.type },
          expiresAt: new Date(), // Would need to be calculated from document data
        });
      }

      // Check for expired documents
      const expiredDocs = await this.getExpiredDocuments();
      
      for (const doc of expiredDocs) {
        await this.create({
          type: 'document',
          severity: 'high',
          title: 'Dokument abgelaufen',
          message: `Das Dokument "${doc.type}" von ${doc.userId} ist abgelaufen.`,
          userId: doc.userId,
          companyId: '', // Will be set automatically in create()
          metadata: { documentId: doc.id, documentType: doc.type },
        });
      }
    } catch (error) {
      logger.error('Error checking document alerts', error instanceof Error ? error : new Error(String(error)));
    }
  },

  async checkShiftAlerts(): Promise<void> {
    try {
      // Check for shifts starting in 24 hours
      const upcomingShifts = await this.getUpcomingShifts();
      
      for (const shift of upcomingShifts) {
        await this.create({
          type: 'shift',
          severity: 'low',
          title: 'Schicht beginnt morgen',
          message: `Die Schicht "${shift.title}" beginnt morgen um ${shift.startTime}.`,
          companyId: '', // Will be set automatically in create()
          metadata: { shiftId: shift.id, facilityId: shift.facilityId },
        });
      }

      // Check for unfilled shifts
      const unfilledShifts = await this.getUnfilledShifts();
      
      for (const shift of unfilledShifts) {
        await this.create({
          type: 'shift',
          severity: 'medium',
          title: 'Schicht noch nicht besetzt',
          message: `Die Schicht "${shift.title}" ist noch nicht besetzt.`,
          companyId: '', // Will be set automatically in create()
          metadata: { shiftId: shift.id, facilityId: shift.facilityId },
        });
      }
    } catch (error) {
      logger.error('Error checking shift alerts', error instanceof Error ? error : new Error(String(error)));
    }
  },

  async checkOvertimeAlerts(): Promise<void> {
    try {
      // Check for daily overtime (>10 hours)
      const overtimeUsers = await this.getDailyOvertimeUsers();
      
      for (const user of overtimeUsers) {
        await this.create({
          type: 'overtime',
          severity: 'medium',
          title: 'Tägliche Überstunden',
          message: `${user.displayName} hat heute Überstunden gearbeitet.`,
          userId: user.id,
          companyId: '', // Will be set automatically in create()
          metadata: { dailyHours: 0 }, // Would need to be calculated
        });
      }

      // Check for weekly overtime (>48 hours)
      const weeklyOvertimeUsers = await this.getWeeklyOvertimeUsers();
      
      for (const user of weeklyOvertimeUsers) {
        await this.create({
          type: 'overtime',
          severity: 'high',
          title: 'Wöchentliche Überstunden',
          message: `${user.displayName} hat diese Woche Überstunden gearbeitet.`,
          userId: user.id,
          companyId: '', // Will be set automatically in create()
          metadata: { weeklyHours: 0 }, // Would need to be calculated
        });
      }
    } catch (error) {
      logger.error('Error checking overtime alerts', error instanceof Error ? error : new Error(String(error)));
    }
  },

  // Helper methods for alert generation
  async getExpiringDocuments(): Promise<Document[]> {
    // This would query documents expiring in the next 7 days
    // Implementation depends on your document service
    return [];
  },

  async getExpiredDocuments(): Promise<Document[]> {
    // This would query expired documents
    // Implementation depends on your document service
    return [];
  },

  async getUpcomingShifts(): Promise<Shift[]> {
    // This would query shifts starting in 24 hours
    // Implementation depends on your shift service
    return [];
  },

  async getUnfilledShifts(): Promise<Shift[]> {
    // This would query unfilled shifts
    // Implementation depends on your shift service
    return [];
  },

  async getDailyOvertimeUsers(): Promise<User[]> {
    // This would query users with >10 hours today
    // Implementation depends on your timesheet service
    return [];
  },

  async getWeeklyOvertimeUsers(): Promise<User[]> {
    // This would query users with >48 hours this week
    // Implementation depends on your timesheet service
    return [];
  },

  // Alert rules management
  async getAlertRules(): Promise<AlertRule[]> {
    try {
      const q = query(
        collection(getDb(), ALERT_RULES_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as AlertRule[];
    } catch (error) {
      logger.error('Error fetching alert rules', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  async createAlertRule(ruleData: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertRule> {
    try {
      const rule = {
        ...ruleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(getDb(), ALERT_RULES_COLLECTION), rule);
      
      return {
        id: docRef.id,
        ...ruleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Error creating alert rule', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  // Alert settings
  async getAlertSettings(userId: string): Promise<AlertSettings | null> {
    try {
      const docRef = doc(getDb(), ALERT_SETTINGS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return docSnap.data() as AlertSettings;
    } catch (error) {
      logger.error('Error fetching alert settings', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  async updateAlertSettings(userId: string, settings: AlertSettings): Promise<void> {
    try {
      const docRef = doc(getDb(), ALERT_SETTINGS_COLLECTION, userId);
      
      await updateDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Error updating alert settings', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },
};
