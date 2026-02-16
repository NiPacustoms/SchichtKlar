/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth, db, getDb } from '@/lib/firebase';
import { Facility, PaginatedResponse, Station } from '@/lib/types';
import { logger } from '@/lib/logging';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { AppError, ErrorCode, ErrorSeverity } from '@/lib/errors';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { writeAuditLog } from '@/lib/services/auditLogService';

const COLLECTION_NAME = 'facilities';

export const facilityService = {
  // Get facility by ID
  async getById(id: string): Promise<Facility | null> {
    if (!db || typeof window === 'undefined') {
      logger.warn('Firebase not initialized or called server-side, returning null');
      return null;
    }
    try {
      const facilityDoc = await getDoc(doc(getDb(), COLLECTION_NAME, id));
      if (!facilityDoc.exists()) return null;

      const data = facilityDoc.data() as {
        companyId?: string;
        name: string;
        address: string;
        contactPerson: string;
        phone: string;
        email: string;
        stations?: unknown[];
        colorCode?: string;
        debtorNumber?: string;
        billingAddress?: string;
        billingEmail?: string;
        billingPhone?: string;
        paymentTerms?: string;
        taxId?: string;
        vatId?: string;
        createdAt?: { toDate: () => Date };
        updatedAt?: { toDate: () => Date };
      };
      return {
        id: facilityDoc.id,
        companyId: data.companyId || '',
        name: data.name,
        address: data.address,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        stations: (data.stations as Station[]) || [],
        colorCode: data.colorCode || '#005f73',
        debtorNumber: data.debtorNumber || '',
        billingAddress: data.billingAddress || '',
        billingEmail: data.billingEmail || '',
        billingPhone: data.billingPhone || '',
        paymentTerms: data.paymentTerms || '',
        taxId: data.taxId || '',
        vatId: data.vatId || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      logger.error('Error getting facility by ID', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  },

  // Get all facilities
  async getAll(companyId?: string): Promise<Facility[]> {
    if (!db || typeof window === 'undefined') {
      return [];
    }

    try {
      const resolvedCompanyId = companyId ?? (await getCompanyIdFromAuth());

      if (!resolvedCompanyId) {
        throw new AppError(
          ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
          'Es konnte keine companyId für den Facility-Load ermittelt werden.',
          ErrorSeverity.ERROR,
          { route: 'facilityService.getAll' }
        );
      }

      const facilitiesCollection = collection(getDb(), COLLECTION_NAME);
      const facilitiesQuery = query(
        facilitiesCollection,
        where('companyId', '==', resolvedCompanyId),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(facilitiesQuery);
      const facilities: Facility[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data() as {
          companyId?: string;
          name: string;
          address: string;
          contactPerson: string;
          phone: string;
          email: string;
          stations?: unknown[];
          colorCode?: string;
          debtorNumber?: string;
          billingAddress?: string;
          billingEmail?: string;
          billingPhone?: string;
          paymentTerms?: string;
          taxId?: string;
          vatId?: string;
          createdAt?: { toDate: () => Date };
          updatedAt?: { toDate: () => Date };
        };

        facilities.push({
          id: docSnap.id,
          companyId: data.companyId || '',
          name: data.name,
          address: data.address,
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email,
          stations: (data.stations as Station[]) || [],
          colorCode: data.colorCode || '#005f73',
          debtorNumber: data.debtorNumber || '',
          billingAddress: data.billingAddress || '',
          billingEmail: data.billingEmail || '',
          billingPhone: data.billingPhone || '',
          paymentTerms: data.paymentTerms || '',
          taxId: data.taxId || '',
          vatId: data.vatId || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return facilities;
    } catch (error) {
      logger.error('Error getting facilities', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  },

  // Get all facilities with pagination
  async getAllPaginated(page = 1, pageSize = 50, companyId?: string): Promise<PaginatedResponse<Facility>> {
      const resolvedCompanyId = companyId ?? (await getCompanyIdFromAuth());
      if (!resolvedCompanyId) {
        throw new AppError(
          ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
          'Es konnte keine companyId für den Facility-Load ermittelt werden.',
          ErrorSeverity.ERROR,
          { route: 'facilityService.getAllPaginated' }
        );
      }

      const facilitiesCollection = collection(getDb(), COLLECTION_NAME);
      const q = query(
        facilitiesCollection,
        where('companyId', '==', resolvedCompanyId),
        orderBy('name', 'asc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const facilities: Facility[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as {
          companyId?: string;
          name: string;
          address: string;
          contactPerson: string;
          phone: string;
          email: string;
          stations?: unknown[];
          colorCode?: string;
          debtorNumber?: string;
          billingAddress?: string;
          billingEmail?: string;
          billingPhone?: string;
          paymentTerms?: string;
          taxId?: string;
          vatId?: string;
          createdAt?: { toDate: () => Date };
          updatedAt?: { toDate: () => Date };
        };
        facilities.push({
          id: doc.id,
          companyId: data.companyId || '',
          name: data.name,
          address: data.address,
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email,
          stations: (data.stations as Station[]) || [],
          colorCode: data.colorCode || '#005f73',
          debtorNumber: data.debtorNumber || '',
          billingAddress: data.billingAddress || '',
          billingEmail: data.billingEmail || '',
          billingPhone: data.billingPhone || '',
          paymentTerms: data.paymentTerms || '',
          taxId: data.taxId || '',
          vatId: data.vatId || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return {
        data: facilities,
        total: facilities.length,
        page,
        limit: pageSize,
        hasMore: facilities.length === pageSize,
      };
  },

  // Create facility
  async create(data: Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
      const resolvedCompanyId = data.companyId || (await getCompanyIdFromAuth());
      if (!resolvedCompanyId) {
        throw new Error('companyId ist erforderlich, um eine Einrichtung anzulegen');
      }

      const payload = {
        ...data,
        companyId: resolvedCompanyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), payload);

      // Best-effort Audit Log (client-side)
      try {
        const auditAfter = {
          ...data,
          companyId: resolvedCompanyId,
        } as Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>;

        await writeAuditLog({
          actorUid: auth?.currentUser?.uid || 'unknown',
          companyId: resolvedCompanyId,
          action: 'facility.create',
          target: { collection: COLLECTION_NAME, id: docRef.id },
          after: auditAfter,
        } as {
          actorUid: string;
          companyId: string;
          action: string;
          target: { collection: string; id: string };
          after: Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>;
        });
      } catch {
        // Audit log failed, but continue
      }
      return docRef.id;
  },

  // Update facility
  async update(id: string, data: Partial<Facility>): Promise<void> {
      const facilityRef = doc(getDb(), COLLECTION_NAME, id);
      await updateDoc(facilityRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      try {
        const facilityDoc = await getDoc(doc(getDb(), COLLECTION_NAME, id));
        const facilityCompanyId = facilityDoc.exists() ? (facilityDoc.data() as any).companyId : null;
        await writeAuditLog({
          actorUid: auth?.currentUser?.uid || 'unknown',
          companyId: facilityCompanyId || await getCompanyIdFromAuth() || 'unknown',
          action: 'facility.update',
          target: { collection: COLLECTION_NAME, id },
          after: { ...data },
        } as {
          actorUid: string;
          companyId: string;
          action: string;
          target: { collection: string; id: string };
          after: Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>;
        });
      } catch {
        // Audit log failed, but continue
      }
    },

  // Add station to facility
  async addStation(
    facilityId: string,
    station: { id: string; name: string; requiredQualifications: string[]; maxStaff: number }
  ): Promise<void> {
      const facilityRef = doc(getDb(), COLLECTION_NAME, facilityId);
      const facilityDoc = await getDoc(facilityRef);

      if (!facilityDoc.exists()) {
        throw new Error('Facility not found');
      }

      const currentData = facilityDoc.data() as {
        stations?: Array<{ id: string; name: string; requiredQualifications: string[]; maxStaff: number }>;
      };
      const stations = currentData.stations || [];
      stations.push(station);

      await updateDoc(facilityRef, {
        stations,
        updatedAt: serverTimestamp(),
      });
  },

  // Update station in facility
  async updateStation(
    facilityId: string,
    stationId: string,
    stationData: Partial<{ name: string; requiredQualifications: string[]; maxStaff: number }>
  ): Promise<void> {
      const facilityRef = doc(getDb(), COLLECTION_NAME, facilityId);
      const facilityDoc = await getDoc(facilityRef);

      if (!facilityDoc.exists()) {
        throw new Error('Facility not found');
      }

      const currentData = facilityDoc.data() as {
        stations?: Array<{ id: string; name: string; requiredQualifications: string[]; maxStaff: number }>;
      };
      const stations = currentData.stations || [];
      const stationIndex = stations.findIndex((s: { id: string }) => s.id === stationId);

      if (stationIndex === -1) {
        throw new Error('Station not found');
      }

      stations[stationIndex] = { ...stations[stationIndex], ...stationData };

      await updateDoc(facilityRef, {
        stations,
        updatedAt: serverTimestamp(),
      });
  },

  // Remove station from facility
  async removeStation(facilityId: string, stationId: string): Promise<void> {
      const facilityRef = doc(getDb(), COLLECTION_NAME, facilityId);
      const facilityDoc = await getDoc(facilityRef);

      if (!facilityDoc.exists()) {
        throw new Error('Facility not found');
      }

      const currentData = facilityDoc.data() as {
        stations?: Array<{ id: string; name: string; requiredQualifications: string[]; maxStaff: number }>;
      };
      const stations = currentData.stations || [];
      const filteredStations = stations.filter((s: { id: string }) => s.id !== stationId);

      await updateDoc(facilityRef, {
        stations: filteredStations,
        updatedAt: serverTimestamp(),
      });
  },

  // Delete facility
  async delete(id: string): Promise<void> {
    const facilityDoc = await getDoc(doc(getDb(), COLLECTION_NAME, id));
    const facilityCompanyId = facilityDoc.exists() ? (facilityDoc.data() as any).companyId : null;
    await deleteDoc(doc(getDb(), COLLECTION_NAME, id));
    try {
      await writeAuditLog({
        actorUid: auth?.currentUser?.uid || 'unknown',
        companyId: facilityCompanyId || await getCompanyIdFromAuth() || 'unknown',
        action: 'facility.delete',
        target: { collection: COLLECTION_NAME, id },
      } as {
        actorUid: string;
        companyId: string;
        action: string;
        target: { collection: string; id: string };
      });
    } catch {
      // Audit log failed, but continue
    }
  },
};
