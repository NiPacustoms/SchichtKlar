import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';

export interface DocumentType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateDocumentTypeData {
  name: string;
  description?: string;
  createdBy: string;
}

export interface UpdateDocumentTypeData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const documentTypeService = {
  /**
   * Alle aktiven Dokumententypen abrufen
   */
  async getActiveTypes(): Promise<DocumentType[]> {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const dbInstance = getDb();
      const collectionRef = collection(dbInstance, 'documentTypes');
      
      // Versuche zuerst mit orderBy (benötigt Index)
      let snapshot;
      try {
        const q = query(collectionRef, orderBy('name', 'asc'));
        snapshot = await getDocs(q);
      } catch (orderByError: unknown) {
        // Falls orderBy fehlschlägt (z.B. fehlender Index), versuche ohne orderBy
        // und sortiere clientseitig
        logger.warn('orderBy fehlgeschlagen, verwende clientseitige Sortierung', {}, { error: orderByError instanceof Error ? orderByError.message : String(orderByError) });
        snapshot = await getDocs(collectionRef);
      }

      const types = snapshot.docs
        .map(doc => {
          const data = doc.data() as Record<string, unknown>;
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.() || new Date(),
            updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate?.() || new Date(),
          } as DocumentType;
        })
        .filter(type => type.isActive)
        .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));

      return types;
    } catch (error) {
      logger.error('Fehler beim Laden der Dokumententypen', error instanceof Error ? error : new Error(String(error)));
      // Gib leeres Array zurück statt zu werfen, damit die UI nicht crasht
      return [];
    }
  },

  /**
   * Alle Dokumententypen abrufen (auch inaktive)
   */
  async getAllTypes(): Promise<DocumentType[]> {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const dbInstance = getDb();
      const collectionRef = collection(dbInstance, 'documentTypes');
      
      // Versuche zuerst mit orderBy (benötigt Index)
      let snapshot;
      try {
        const q = query(collectionRef, orderBy('name', 'asc'));
        snapshot = await getDocs(q);
      } catch (orderByError: unknown) {
        // Falls orderBy fehlschlägt (z.B. fehlender Index), versuche ohne orderBy
        // und sortiere clientseitig
        logger.warn('orderBy fehlgeschlagen, verwende clientseitige Sortierung', {}, { error: orderByError instanceof Error ? orderByError.message : String(orderByError) });
        snapshot = await getDocs(collectionRef);
      }

      return snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description,
            isActive: data.isActive ?? true,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            createdBy: data.createdBy || '',
          } as DocumentType;
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
    } catch (error) {
      logger.error('Fehler beim Laden aller Dokumententypen', error instanceof Error ? error : new Error(String(error)));
      // Gib leeres Array zurück statt zu werfen, damit die UI nicht crasht
      return [];
    }
  },

  /**
   * Neuen Dokumententyp erstellen
   */
  async createType(data: CreateDocumentTypeData): Promise<DocumentType> {
    try {
      const now = new Date();
      const docData = {
        ...data,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(getDb(), 'documentTypes'), docData);

      return {
        id: docRef.id,
        ...docData,
      };
    } catch (_error) {
      throw new Error('Fehler beim Erstellen des Dokumententyps');
    }
  },

  /**
   * Dokumententyp aktualisieren
   */
  async updateType(id: string, data: UpdateDocumentTypeData): Promise<void> {
    try {
      const docRef = doc(getDb(), 'documentTypes', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      });
    } catch (_error) {
      throw new Error('Fehler beim Aktualisieren des Dokumententyps');
    }
  },

  /**
   * Dokumententyp deaktivieren (soft delete)
   */
  async deactivateType(id: string): Promise<void> {
    try {
      await this.updateType(id, { isActive: false });
    } catch (_error) {
      throw new Error('Fehler beim Deaktivieren des Dokumententyps');
    }
  },

  /**
   * Dokumententyp löschen (hard delete)
   */
  async deleteType(id: string): Promise<void> {
    try {
      const docRef = doc(getDb(), 'documentTypes', id);
      await deleteDoc(docRef);
    } catch (_error) {
      throw new Error('Fehler beim Löschen des Dokumententyps');
    }
  },

  /**
   * Standard-Dokumententypen initialisieren (falls noch keine vorhanden)
   */
  async initializeDefaultTypes(createdBy: string): Promise<void> {
    try {
      const existingTypes = await this.getAllTypes();

      if (existingTypes.length === 0) {
        const defaultTypes = [
          { name: 'Impfpass', description: 'Impfausweis und Impfzertifikate' },
          { name: 'Arbeitszeugnis', description: 'Arbeitszeugnisse und Referenzen' },
          { name: 'Qualifikation', description: 'Berufliche Qualifikationen und Abschlüsse' },
          { name: 'Zertifikat', description: 'Zertifikate und Lizenzen' },
          { name: 'Sonstiges', description: 'Andere relevante Dokumente' },
        ];

        for (const type of defaultTypes) {
          await this.createType({
            ...type,
            createdBy,
          });
        }
      }
    } catch (_error) {
      throw new Error('Fehler beim Initialisieren der Standard-Dokumententypen');
    }
  },
};
