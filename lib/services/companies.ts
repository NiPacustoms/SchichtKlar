import { db, getDb } from '@/lib/firebase';
import { Company } from '@/lib/types';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'companies';

export const companyService = {
  async create(companyName: string, adminUserId: string): Promise<Company> {
    if (!db) throw new Error('Firestore not initialized');
    const col = collection(getDb(), COLLECTION_NAME);
    const now = new Date();
    const docRef = await addDoc(col, {
      name: companyName,
      createdByUserId: adminUserId,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      name: companyName,
      createdByUserId: adminUserId,
      createdAt: now,
    };
  },

  async setWithId(companyId: string, companyName: string, adminUserId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    const ref = doc(getDb(), COLLECTION_NAME, companyId);
    await setDoc(ref, {
      name: companyName,
      createdByUserId: adminUserId,
      createdAt: serverTimestamp(),
    });
  },

  async getById(companyId: string): Promise<Company | null> {
    if (!db) throw new Error('Firestore not initialized');
    const snapshot = await getDoc(doc(getDb(), COLLECTION_NAME, companyId));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      createdByUserId: data.createdByUserId,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  },
};

export default companyService;


