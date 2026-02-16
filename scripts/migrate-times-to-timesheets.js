#!/usr/bin/env node

/**
 * Migration: times → timesheets (sick & vacation)
 *
 * Kopiert bestehende Einträge vom Typ "sick" und "vacation" aus der
 * Firestore-Collection "times" in die Collection "timesheets" (entryType sick/vacation).
 * Einmalig ausführen; danach werden Krank und Urlaub nur noch in timesheets gepflegt.
 *
 * Voraussetzung: .env.local mit NEXT_PUBLIC_FIREBASE_* gesetzt.
 * Ausführung: node scripts/migrate-times-to-timesheets.js
 *
 * Optional: DRY_RUN=1 nur anzeigen, keine Schreibvorgänge.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} = require('firebase/firestore');

const DRY_RUN = process.env.DRY_RUN === '1';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function toDate(v) {
  if (!v) return undefined;
  if (v && typeof v.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  return new Date(v);
}

function run() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('Fehler: NEXT_PUBLIC_FIREBASE_API_KEY und NEXT_PUBLIC_FIREBASE_PROJECT_ID müssen gesetzt sein (z.B. aus .env.local).');
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  async function migrate() {
    const timesRef = collection(db, 'times');
    const timesheetsRef = collection(db, 'timesheets');

    const q = query(timesRef, where('type', 'in', ['sick', 'vacation']));
    const snapshot = await getDocs(q);
    const entries = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      entries.push({
        id: docSnap.id,
        userId: d.userId,
        companyId: d.companyId || undefined,
        type: d.type,
        status: d.status || 'draft',
        startDate: toDate(d.startDate),
        endDate: toDate(d.endDate),
        date: toDate(d.date),
        days: d.days,
        reason: d.reason,
        doctor: d.doctor,
      });
    });

    if (entries.length === 0) {
      console.log('Keine sick/vacation-Einträge in "times" gefunden. Migration übersprungen.');
      return;
    }

    console.log(`Gefunden: ${entries.length} Einträge (sick/vacation). ${DRY_RUN ? '(DRY_RUN – keine Schreibvorgänge)' : ''}`);

    let created = 0;
    for (const e of entries) {
      const startDate = e.startDate || e.date || new Date();
      const endDate = e.endDate || e.startDate || e.date || new Date();
      const days = e.days != null ? e.days : 1;

      const payload = {
        userId: e.userId,
        companyId: e.companyId || null,
        entryType: e.type,
        date: startDate,
        startTime: '00:00',
        endTime: '00:00',
        breakMinutes: 0,
        totalHours: 0,
        startDate,
        endDate,
        days,
        reason: e.type === 'sick' ? (e.reason || null) : null,
        doctor: e.type === 'sick' ? (e.doctor || null) : null,
        status: e.status === 'approved' || e.status === 'rejected' ? e.status : 'submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (DRY_RUN) {
        console.log(`  [DRY] Würde anlegen: userId=${e.userId} entryType=${e.type} ${startDate.toISOString().slice(0, 10)}–${endDate.toISOString().slice(0, 10)} days=${days}`);
        created++;
        continue;
      }

      await addDoc(timesheetsRef, payload);
      created++;
      console.log(`  Migriert: ${e.id} → timesheets (${e.type})`);
    }

    console.log(`Fertig: ${created} Einträge ${DRY_RUN ? 'würden erstellt' : 'in timesheets angelegt'}.`);
  }

  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration fehlgeschlagen:', err);
      process.exit(1);
    });
}

run();
