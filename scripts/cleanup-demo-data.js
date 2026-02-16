#!/usr/bin/env node

/**
 * Entfernt die mit dem Seed-Script angelegten Demo-Datensätze.
 * Löscht gezielt bekannte Demo-User, -Einrichtungen, -Schichten,
 * zugehörige Assignments sowie Dokumente.
 *
 * Ausführung:
 *   npm run cleanup:demo
 *
 * Voraussetzung:
 *   GOOGLE_APPLICATION_CREDENTIALS muss auf ein Service-Account-JSON zeigen
 *   oder `firebase login` wurde ausgeführt (wie bei den anderen Admin-Skripten).
 */

const admin = require('firebase-admin');

const DEMO_USER_EMAILS = [
  'admin@jobflow.de',
  'dispatcher@jobflow.de',
  'nurse1@jobflow.de',
  'nurse2@jobflow.de',
];

const DEMO_FACILITY_NAMES = [
  'Klinikum München',
  'Seniorenheim Sonnenhof',
  'Praxis Dr. Müller',
];

const DEMO_SHIFT_TITLES = [
  'Frühschicht Intensivstation',
  'Spätschicht Chirurgie',
  'Nachtschicht Pädiatrie',
];

const DEMO_DOCUMENT_NAMES = [
  'Intensivpflege-Zertifikat',
  'Personalausweis',
];

const chunkArray = (values, size = 10) => {
  const chunks = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
};

async function queryByField(db, collectionName, field, values) {
  if (!values.length) {
    return [];
  }

  const snapshots = [];
  for (const chunk of chunkArray(values, 10)) {
    const snapshot = await db.collection(collectionName).where(field, 'in', chunk).get();
    snapshots.push(...snapshot.docs);
  }
  return snapshots;
}

async function deleteDocs(docs, label) {
  for (const doc of docs) {
    await doc.ref.delete();
  }
  if (docs.length > 0) {
    console.log(`🗑️  ${label}: ${docs.length} Dokument(e) gelöscht.`);
  }
  return docs.length;
}

async function cleanupDemoData() {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('❌ Firebase Admin konnte nicht initialisiert werden:', error.message);
    console.log('\nBitte setze GOOGLE_APPLICATION_CREDENTIALS oder melde dich via `firebase login` an.');
    process.exit(1);
  }

  const db = admin.firestore();
  const summary = {
    users: 0,
    facilities: 0,
    shifts: 0,
    assignments: 0,
    documents: 0,
  };

  console.log('🔍 Suche nach Demo-Datensätzen …');

  // Users
  const demoUsers = await queryByField(db, 'users', 'email', DEMO_USER_EMAILS);
  const demoUserIds = demoUsers.map(doc => doc.id);
  summary.users += await deleteDocs(demoUsers, 'Users');

  // Facilities
  const demoFacilities = await queryByField(db, 'facilities', 'name', DEMO_FACILITY_NAMES);
  summary.facilities += await deleteDocs(demoFacilities, 'Facilities');

  // Shifts
  const demoShifts = await queryByField(db, 'shifts', 'title', DEMO_SHIFT_TITLES);
  const demoShiftIds = demoShifts.map(doc => doc.id);
  summary.shifts += await deleteDocs(demoShifts, 'Shifts');

  // Assignments (nach ShiftId + UserId)
  const assignmentRefs = new Map();
  const assignmentsByShift = await queryByField(db, 'assignments', 'shiftId', demoShiftIds);
  assignmentsByShift.forEach(doc => assignmentRefs.set(doc.id, doc));

  const assignmentsByUser = await queryByField(db, 'assignments', 'userId', demoUserIds);
  assignmentsByUser.forEach(doc => assignmentRefs.set(doc.id, doc));

  summary.assignments += await deleteDocs([...assignmentRefs.values()], 'Assignments');

  // Documents (nach Name + UserId)
  const documentRefs = new Map();
  const documentsByName = await queryByField(db, 'documents', 'name', DEMO_DOCUMENT_NAMES);
  documentsByName.forEach(doc => documentRefs.set(doc.id, doc));

  const documentsByUser = await queryByField(db, 'documents', 'userId', demoUserIds);
  documentsByUser.forEach(doc => documentRefs.set(doc.id, doc));

  summary.documents += await deleteDocs([...documentRefs.values()], 'Documents');

  console.log('\n✅ Cleanup abgeschlossen.');
  console.table(summary);
}

cleanupDemoData().catch(error => {
  console.error('❌ Cleanup fehlgeschlagen:', error.message);
  process.exit(1);
});

