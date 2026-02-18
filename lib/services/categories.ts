import { db, getDb } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

export interface Categories {
  roles: string[];
  groups: string[];
  qualifications: string[];
  jobTitles: string[];
  updatedAt?: Date;
}

const COLLECTION = 'config';
const DOC_ID = 'categories';

export const categoriesService = {
  async get(): Promise<Categories> {
    if (!db) {
      const defaults: Categories = {
        roles: ['nurse', 'admin'],
        groups: ['Intensivstation', 'Operationssaal', 'Geriatrie', 'Pädiatrie'],
        qualifications: ['Krankenpfleger', 'Intensivpflege', 'OP-Pflege', 'Geriatrie'],
        jobTitles: ['Pflegefachkraft', 'Stationsleitung', 'Praxisanleiter', 'Pflegeassistenz'],
        updatedAt: new Date(),
      };
      return defaults;
    }
    const ref = doc(getDb(), COLLECTION, DOC_ID);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const defaults: Categories = {
        roles: ['nurse', 'admin'],
        groups: ['Intensivstation', 'Operationssaal', 'Geriatrie', 'Pädiatrie'],
        qualifications: ['Krankenpfleger', 'Intensivpflege', 'OP-Pflege', 'Geriatrie'],
        jobTitles: ['Pflegefachkraft', 'Stationsleitung', 'Praxisanleiter', 'Pflegeassistenz'],
        updatedAt: new Date(),
      };
      await setDoc(ref, {
        ...defaults,
        updatedAt: serverTimestamp(),
      });
      return defaults;
    }
    const data = snap.data() as Record<string, unknown>;
    return {
      roles: Array.isArray(data.roles) ? data.roles : [],
      groups: Array.isArray(data.groups) ? data.groups : [],
      qualifications: Array.isArray(data.qualifications) ? data.qualifications : [],
      jobTitles: Array.isArray(data.jobTitles) ? data.jobTitles : ['Pflegefachkraft', 'Stationsleitung', 'Praxisanleiter'],
      updatedAt: (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date(),
    };
  },

  async set(categories: Categories): Promise<void> {
    const ref = doc(getDb(), COLLECTION, DOC_ID);
    await setDoc(ref, { ...categories, updatedAt: serverTimestamp() }, { merge: true });
  },

  async update(partial: Partial<Categories>): Promise<void> {
    const ref = doc(getDb(), COLLECTION, DOC_ID);
    await updateDoc(ref, { ...partial, updatedAt: serverTimestamp() });
  },
};


