import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import type { User } from '@/lib/types/user';

const COLLECTION_NAME = 'users';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (
    value != null &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}

function mapDocToUser(docId: string, data: Record<string, unknown>): User {
  const notificationSettings = (data.notificationSettings as User['notificationSettings']) ?? {
    emailNotifications: true,
    pushNotifications: true,
    shiftReminders: true,
    documentExpiry: true,
    systemAnnouncements: true,
  };
  return {
    id: docId,
    email: String(data.email ?? ''),
    displayName: String(data.displayName ?? data.email ?? ''),
    role: (data.role as User['role']) ?? 'nurse',
    customRoleId: data.customRoleId != null ? String(data.customRoleId) : undefined,
    companyId: data.companyId != null ? String(data.companyId) : undefined,
    qualifications: Array.isArray(data.qualifications) ? (data.qualifications as string[]) : [],
    documents: Array.isArray(data.documents) ? (data.documents as string[]) : [],
    active: data.active !== false,
    notificationSettings,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

import type { IUserRepository } from '@/src/application/ports/IUserRepository';

export class UserRepo implements IUserRepository {
  async getById(id: string): Promise<User | null> {
    const db = getDb();
    if (!db) return null;
    const snap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!snap.exists()) return null;
    return mapDocToUser(snap.id, snap.data() as Record<string, unknown>);
  }

  async listByCompanyId(
    companyId: string,
    options?: { limit?: number }
  ): Promise<User[]> {
    const db = getDb();
    if (!db) return [];
    const limitCount = options?.limit ?? 100;
    const q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId),
      orderBy('displayName', 'asc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const result: User[] = [];
    snapshot.forEach((d) => {
      result.push(mapDocToUser(d.id, d.data() as Record<string, unknown>));
    });
    return result;
  }
}
