import { db, getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { logger } from '@/lib/logging';

export interface Document {
  id: string;
  userId: string;
  type: 'certificate' | 'id_card' | 'vaccination' | 'contract' | 'other';
  name: string;
  url: string;
  fileSize: number;
  mimeType: string;
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  expiryDate?: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentFilters {
  userId?: string;
  type?: string;
  status?: string;
  verified?: boolean;
  expiringSoon?: boolean; // Documents expiring within 30 days
}

export interface DocumentUpload {
  userId: string;
  type: Document['type'];
  name: string;
  url: string;
  fileSize: number;
  mimeType: string;
  expiryDate?: Date;
  notes?: string;
}

const COLLECTION_NAME = 'documents';

export const documentService = {
  /**
   * Erstellt ein neues Dokument
   */
  async create(data: DocumentUpload): Promise<Document> {
      // Hole companyId aus dem User
      let companyId: string | null = null;
      if (data.userId) {
        const userDoc = await getDoc(doc(getDb(), 'users', data.userId));
        if (userDoc.exists()) {
          companyId = userDoc.data().companyId || null;
        }
      }
      if (!companyId) {
        companyId = await getCompanyIdFromAuth();
      }
      if (!companyId) {
        throw new Error('No companyId found for document');
      }

      const now = Timestamp.now();
      const docData = {
        ...data,
        companyId: companyId,
        status: this.calculateStatus(data.expiryDate),
        verified: false,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), docData);
      
      return {
        id: docRef.id,
        ...docData,
        createdAt: docData.createdAt.toDate(),
        updatedAt: docData.updatedAt.toDate(),
        expiryDate: data.expiryDate,
      };
  },

  /**
   * Holt ein Dokument anhand der ID
   */
  async getById(id: string): Promise<Document | null> {
    if (!db) {
      logger.warn('Firebase not initialized, returning null');
      return null;
    }
    try {
      const docRef = doc(getDb(), COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data() as {
        createdAt: Timestamp;
        updatedAt: Timestamp;
        expiryDate?: Timestamp;
        verifiedAt?: Timestamp;
        companyId?: string;
      } & Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'expiryDate' | 'verifiedAt' | 'companyId'>;
      return {
        id: docSnap.id,
        ...data,
        companyId: data.companyId || '',
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        expiryDate: data.expiryDate?.toDate(),
        verifiedAt: data.verifiedAt?.toDate(),
      } as Document;
    } catch (error) {
      logger.error('Error getting document by ID', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  },

  /**
   * Holt alle Dokumente mit optionalen Filtern
   */
  async getAll(filters: DocumentFilters = {}): Promise<Document[]> {
    // Prüfe, ob wir im Browser sind (clientseitig)
    if (typeof window === 'undefined') {
      logger.warn('getAll can only be called client-side');
      return [];
    }

    if (!db) {
      logger.warn('Firebase not initialized, returning empty array');
      return [];
    }
    try {
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) {
        logger.warn('No companyId found, returning empty array');
        return [];
      }

      const constraints: QueryConstraint[] = [
        where('companyId', '==', companyId)
      ];

      // Filter nach User
      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }

      // Filter nach Typ
      if (filters.type) {
        constraints.push(where('type', '==', filters.type));
      }

      // Filter nach Status
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      // Filter nach Verifizierungsstatus
      if (filters.verified !== undefined) {
        constraints.push(where('verified', '==', filters.verified));
      }

      // Sortierung nach Erstellungsdatum (neueste zuerst)
      // WICHTIG: orderBy muss nach allen where-Constraints kommen
      // Temporär: Sortierung entfernt, um Index-Fehler zu vermeiden
      // Die Sortierung wird clientseitig durchgeführt
      // TODO: Sobald der Index fertig ist, kann orderBy wieder aktiviert werden
      // constraints.push(orderBy('createdAt', 'desc'));

      const q = query(collection(getDb(), COLLECTION_NAME), ...constraints);
      const querySnapshot = await getDocs(q);

      const documents = querySnapshot.docs.map(doc => {
        const data = doc.data() as {
          createdAt: Timestamp;
          updatedAt: Timestamp;
          expiryDate?: Timestamp;
          verifiedAt?: Timestamp;
          companyId?: string;
        } & Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'expiryDate' | 'verifiedAt' | 'companyId'>;
        return {
          id: doc.id,
          ...data,
          companyId: data.companyId || '',
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          expiryDate: data.expiryDate?.toDate(),
          verifiedAt: data.verifiedAt?.toDate(),
        } as Document;
      });

      // Clientseitige Sortierung nach createdAt (neueste zuerst)
      return documents.sort((a, b) => {
        const dateA = a.createdAt.getTime();
        const dateB = b.createdAt.getTime();
        return dateB - dateA; // DESCENDING
      });
    } catch (error: unknown) {
      logger.error('Error getting all documents', error instanceof Error ? error : new Error(String(error)));
      // Wenn es ein Index-Fehler ist, gib eine hilfreichere Fehlermeldung zurück
      if ((error as { code?: string; message?: string })?.code === 'failed-precondition' || (error as { message?: string })?.message?.includes('index')) {
        logger.error('Firestore index missing. Please create the required index', error instanceof Error ? error : new Error(String(error)));
        // Return empty array instead of throwing to prevent app crash
        return [];
      }
      // Return empty array instead of throwing
      return [];
    }
  },

  /**
   * Holt Dokumente für einen bestimmten User
   */
  async getByUserId(userId: string): Promise<Document[]> {
    return this.getAll({ userId });
  },

  /**
   * Holt ablaufende Dokumente (innerhalb der nächsten 30 Tage)
   */
  async getExpiringDocuments(daysAhead: number = 30): Promise<Document[]> {
    if (!db) {
      logger.warn('Firebase not initialized, returning empty array');
      return [];
    }
    try {
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) {
        logger.warn('No companyId found, returning empty array');
        return [];
      }

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + daysAhead);

      const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('expiryDate', '>=', Timestamp.fromDate(now)),
        where('expiryDate', '<=', Timestamp.fromDate(futureDate)),
        orderBy('expiryDate', 'asc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data() as {
          createdAt: Timestamp;
          updatedAt: Timestamp;
          expiryDate?: Timestamp;
          verifiedAt?: Timestamp;
          companyId?: string;
        } & Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'expiryDate' | 'verifiedAt' | 'companyId'>;
        return {
          id: doc.id,
          ...data,
          companyId: data.companyId || '',
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          expiryDate: data.expiryDate?.toDate(),
          verifiedAt: data.verifiedAt?.toDate(),
        } as Document;
      });
    } catch (error) {
      logger.error('Error getting expiring documents', error instanceof Error ? error : new Error(String(error)));
      return []; // Return empty array instead of throwing
    }
  },

  /**
   * Aktualisiert ein Dokument
   */
  async update(id: string, data: Partial<Document>): Promise<void> {
      const docRef = doc(getDb(), COLLECTION_NAME, id);
      
      const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      // Status neu berechnen wenn expiryDate geändert wurde
      if (data.expiryDate) {
        updateData.status = this.calculateStatus(data.expiryDate);
      }

      await updateDoc(docRef, updateData);
  },

  /**
   * Verifiziert ein Dokument
   */
  async verify(id: string, verifiedBy: string, rejectionReason?: string): Promise<void> {
      const docRef = doc(getDb(), COLLECTION_NAME, id);
      
      const updateData = {
        verified: !rejectionReason,
        verifiedBy,
        verifiedAt: Timestamp.now(),
        rejectionReason: rejectionReason || null,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(docRef, updateData);
  },

  /**
   * Löscht ein Dokument
   */
  async delete(id: string): Promise<void> {
      const docRef = doc(getDb(), COLLECTION_NAME, id);
      await deleteDoc(docRef);
  },

  /**
   * Berechnet den Status eines Dokuments basierend auf dem Ablaufdatum
   */
  calculateStatus(expiryDate?: Date): Document['status'] {
    if (!expiryDate) {
      return 'valid';
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (expiryDate < now) {
      return 'expired';
    } else if (expiryDate <= thirtyDaysFromNow) {
      return 'expiring';
    } else {
      return 'valid';
    }
  },

  /**
   * Aktualisiert den Status aller Dokumente (für Batch-Updates)
   */
  async updateAllStatuses(): Promise<void> {
      const documents = await this.getAll();
      
      for (const doc of documents) {
        const newStatus = this.calculateStatus(doc.expiryDate);
        if (newStatus !== doc.status) {
          await this.update(doc.id, { status: newStatus });
        }
      }
  },

  /**
   * Holt Dokument-Statistiken für einen User
   */
  async getUserDocumentStats(userId: string): Promise<{
    total: number;
    valid: number;
    expiring: number;
    expired: number;
    verified: number;
    unverified: number;
  }> {
    const documents = await this.getByUserId(userId);
      
      return {
        total: documents.length,
        valid: documents.filter(d => d.status === 'valid').length,
        expiring: documents.filter(d => d.status === 'expiring').length,
        expired: documents.filter(d => d.status === 'expired').length,
        verified: documents.filter(d => d.verified).length,
        unverified: documents.filter(d => !d.verified).length,
      };
  },

  /**
   * Holt Dokument-Statistiken für alle User (Admin)
   */
  async getAllDocumentStats(): Promise<{
    total: number;
    valid: number;
    expiring: number;
    expired: number;
    verified: number;
    unverified: number;
    byType: Record<string, number>;
  }> {
    const documents = await this.getAll();
      
      const byType: Record<string, number> = {};
      documents.forEach(doc => {
        byType[doc.type] = (byType[doc.type] || 0) + 1;
      });

      return {
        total: documents.length,
        valid: documents.filter(d => d.status === 'valid').length,
        expiring: documents.filter(d => d.status === 'expiring').length,
        expired: documents.filter(d => d.status === 'expired').length,
        verified: documents.filter(d => d.verified).length,
        unverified: documents.filter(d => !d.verified).length,
        byType,
      };
  },
};