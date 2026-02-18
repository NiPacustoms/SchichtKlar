import { db, getDb } from '@/lib/firebase';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { offlineQueueService } from '../offlineQueue';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { TimesheetForm } from './types';
import type { FirestoreTimesheetData } from './types';
import { COLLECTION_NAME } from './types';

export async function create(userId: string, data: TimesheetForm): Promise<string> {
  let companyId: string | null = null;
  const userDoc = await getDoc(doc(getDb(), 'users', userId));
  if (userDoc.exists()) companyId = userDoc.data().companyId || null;
  if (!companyId) companyId = await getCompanyIdFromAuth();
  if (!companyId) throw new Error('No companyId found for timesheet');
  const startTime = new Date(`2000-01-01T${data.startTime}`);
  const endTime = new Date(`2000-01-01T${data.endTime}`);
  let totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  const totalHours = (totalMinutes - data.breakMinutes) / 60;
  const timesheetData = {
    userId,
    companyId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    breakMinutes: data.breakMinutes,
    totalHours: Math.round(totalHours * 100) / 100,
    notes: data.notes,
    facilityId: data.facilityId,
    station: data.station,
    location: data.location,
    status: 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return await offlineQueueService.addToQueue('timesheet', 'create', timesheetData);
  }
  if (!db) return await offlineQueueService.addToQueue('timesheet', 'create', timesheetData);
  try {
    const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), timesheetData);
    return docRef.id;
  } catch (error) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      let fallbackCompanyId: string | null = null;
      try {
        const userDoc = await getDoc(doc(getDb(), 'users', userId));
        if (userDoc.exists()) fallbackCompanyId = userDoc.data().companyId || null;
        if (!fallbackCompanyId) fallbackCompanyId = await getCompanyIdFromAuth();
      } catch {
        // ignore
      }
      const fallbackData = {
        userId,
        companyId: fallbackCompanyId || '',
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        breakMinutes: data.breakMinutes,
        notes: data.notes,
        location: data.location,
        status: 'draft',
      };
      return await offlineQueueService.addToQueue('timesheet', 'create', fallbackData);
    }
    throw error;
  }
}

export async function update(id: string, data: Partial<TimesheetForm>): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await offlineQueueService.addToQueue('timesheet', 'update', { id, ...data });
    return;
  }
  const timesheetRef = doc(getDb(), COLLECTION_NAME, id);
  const currentDoc = await getDoc(timesheetRef);
  if (!currentDoc.exists()) throw new Error('Timesheet not found');
  const currentData = currentDoc.data() as FirestoreTimesheetData;
  if (currentData.status === 'approved' || currentData.status === 'submitted') {
    throw new Error('Cannot update approved or submitted timesheet. GoBD-Konformität: Belege müssen nach Genehmigung unveränderlich sein.');
  }
  const updateData: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
  if (data.startTime || data.endTime || data.breakMinutes !== undefined) {
    const startTime = data.startTime || currentData.startTime;
    const endTime = data.endTime || currentData.endTime;
    const breakMinutes = data.breakMinutes !== undefined ? data.breakMinutes : (currentData.breakMinutes ?? 0);
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    updateData.totalHours = Math.round(((totalMinutes - breakMinutes) / 60) * 100) / 100;
  }
  await updateDoc(timesheetRef, updateData);
}

export async function submit(id: string): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTION_NAME, id), {
    status: 'submitted',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function approve(id: string, approvedBy: string): Promise<void> {
  const timesheetRef = doc(getDb(), COLLECTION_NAME, id);
  const currentDoc = await getDoc(timesheetRef);
  if (!currentDoc.exists()) throw new Error('Timesheet not found');
  const currentData = currentDoc.data() as FirestoreTimesheetData;
  if (currentData.status === 'approved') throw new Error('Timesheet already approved');
  await updateDoc(timesheetRef, {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy,
    updatedAt: serverTimestamp(),
  });
}

