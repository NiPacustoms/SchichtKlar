import {
  QueryConstraint,
  Timestamp,
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
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../firebase';

export class FirestoreService {
  // Generische Methode zum Abrufen aller Dokumente aus einer Sammlung
  static async getCollection<T extends Record<string, unknown>>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<Array<{ id: string } & T>> {
    const q = query(collection(getDb(), collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({
      id: d.id,
      ...(d.data() as T),
    }));
  }

  // Einzelnes Dokument abrufen
  static async getDocument<T extends Record<string, unknown>>(
    collectionName: string,
    docId: string
  ): Promise<({ id: string } & T) | null> {
    const docRef = doc(getDb(), collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...(docSnap.data() as T),
      };
    }
    return null;
  }

  // Neues Dokument erstellen
  static async createDocument<T extends Record<string, unknown>>(
    collectionName: string,
    data: T
  ): Promise<string> {
    const docRef = await addDoc(collection(getDb(), collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  // Dokument aktualisieren
  static async updateDocument<T extends Partial<Record<string, unknown>>>(
    collectionName: string,
    docId: string,
    data: T
  ): Promise<void> {
    const docRef = doc(getDb(), collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  }

  // Dokument löschen
  static async deleteDocument(collectionName: string, docId: string): Promise<void> {
    const docRef = doc(getDb(), collectionName, docId);
    await deleteDoc(docRef);
  }

  // Real-time Listener für eine Sammlung
  static subscribeToCollection<T extends Record<string, unknown>>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
    callback: (data: Array<{ id: string } & T>) => void
  ): () => void {
    const q = query(collection(getDb(), collectionName), ...constraints);
    return onSnapshot(q, querySnapshot => {
      const data = querySnapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as T),
      }));
      callback(data);
    });
  }

  // Real-time Listener für ein einzelnes Dokument
  static subscribeToDocument<T extends Record<string, unknown>>(
    collectionName: string,
    docId: string,
    callback: (data: ({ id: string } & T) | null) => void
  ): () => void {
    const docRef = doc(getDb(), collectionName, docId);
    return onSnapshot(docRef, docSnap => {
      if (docSnap.exists()) {
        callback({
          id: docSnap.id,
          ...(docSnap.data() as T),
        });
      } else {
        callback(null);
      }
    });
  }

  // Spezifische Methoden für JobFlow

  // Einrichtungen abrufen
  static async getFacilities(): Promise<Array<{ id: string } & Record<string, unknown>>> {
    return this.getCollection('facilities', [orderBy('name')]);
  }

  // Dokumente abrufen
  static async getDocuments(
    facilityId?: string
  ): Promise<Array<{ id: string } & Record<string, unknown>>> {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    if (facilityId) {
      constraints.push(where('facilityId', '==', facilityId));
    }
    return this.getCollection('documents', constraints);
  }

  // Audit Logs abrufen
  static async getAuditLogs(
    limitCount: number = 100
  ): Promise<Array<{ id: string } & Record<string, unknown>>> {
    return this.getCollection('auditLogs', [orderBy('timestamp', 'desc'), limit(limitCount)]);
  }

  // Benutzer abrufen
  static async getUsers(): Promise<Array<{ id: string } & Record<string, unknown>>> {
    return this.getCollection('users', [orderBy('displayName')]);
  }
}
