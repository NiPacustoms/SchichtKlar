import { db, getDb } from '@/lib/firebase';
import { Invitation } from '@/lib/types';
import {
  addDoc,
  collection,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';

const COLLECTION_NAME = 'invitations';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateToken(length = 32): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return toBase64Url(bytes);
  }
  // Fallback (Node SSR ohne Web Crypto) – ausreichend für Nicht‑Kritik, aber besser via API absichern
  const arr = Array.from({ length }, () => Math.floor(Math.random() * 256));
  return toBase64Url(Uint8Array.from(arr));
}

export const invitationService = {
  async create(companyId: string, email: string, createdByUserId: string): Promise<Invitation> {
    if (!db) throw new Error('Firestore not initialized');

    // Optional: Duplikatprüfung offene Einladungen
    const openExisting = await getDocs(
      query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('email', '==', email)
      )
    );
    const firstOpen = openExisting.docs.find(d => {
      const data = d.data() as Record<string, unknown>;
      return !data.acceptedAt;
    });
    if (firstOpen) {
      const data = firstOpen.data();
      return {
        id: firstOpen.id,
        companyId: data.companyId,
        email: data.email,
        token: data.token,
        expiresAt: data.expiresAt?.toDate?.() || new Date(Date.now() + 24 * 3600 * 1000),
        acceptedAt: data.acceptedAt?.toDate?.(),
        createdByUserId: data.createdByUserId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    }

    const token = generateToken(48);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), {
      companyId,
      email,
      token,
      expiresAt,
      acceptedAt: null,
      createdByUserId,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      companyId,
      email,
      token,
      expiresAt,
      createdByUserId,
      createdAt: new Date(),
    };
  },

  async getByToken(token: string): Promise<Invitation | null> {
    if (!db) throw new Error('Firestore not initialized');
    const q = query(collection(getDb(), COLLECTION_NAME), where('token', '==', token));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    const data = d.data();
    return {
      id: d.id,
      companyId: data.companyId,
      email: data.email,
      token: data.token,
      expiresAt: data.expiresAt?.toDate?.() || new Date(),
      acceptedAt: data.acceptedAt?.toDate?.(),
      createdByUserId: data.createdByUserId,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  },

  async markAcceptedByToken(token: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    await runTransaction(db, async (trx) => {
      const q = query(collection(getDb(), COLLECTION_NAME), where('token', '==', token));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('Invitation not found');
      const ref = doc(getDb(), COLLECTION_NAME, snap.docs[0].id);
      const current = await trx.get(ref);
      if (!current.exists()) throw new Error('Invitation not found');
      const data = current.data() as Record<string, unknown>;
      const now = Date.now();
      const expiresAtValue = data.expiresAt as { toDate?: () => Date } | Date | string | undefined;
      const expiryMs = expiresAtValue && typeof expiresAtValue === 'object' && 'toDate' in expiresAtValue
        ? expiresAtValue.toDate?.()?.getTime()
        : expiresAtValue
        ? new Date(expiresAtValue as Date | string).getTime()
        : undefined;
      if (data.acceptedAt) throw new Error('Invitation already accepted');
      if (expiryMs && now > expiryMs) throw new Error('Invitation expired');
      trx.update(ref, { acceptedAt: serverTimestamp() });
    });
  },
};

export default invitationService;


