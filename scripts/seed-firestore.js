#!/usr/bin/env node

/**
 * Firestore Seed Script
 * Erstellt Test-Daten für die JobFlow App
 * 
 * ⚠️ WICHTIG: Dieses Script sollte NUR manuell ausgeführt werden!
 * 
 * Es erstellt Test-Daten (Users, Facilities, Shifts, Assignments, Documents),
 * die für alle Firmen sichtbar sind, da sie keine companyId haben.
 * 
 * Für Produktion:
 * - Verwende dieses Script NUR für Entwicklung/Testing
 * - Neue Benutzer sollten KEINE vorgefertigten Daten sehen
 * - Alle Daten müssen manuell über die UI gepflegt werden
 * 
 * Ausführung:
 *   npm run seed
 *   oder
 *   npm run seed:dev
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  Timestamp,
} = require('firebase/firestore');
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} = require('firebase/auth');

// Firebase Konfiguration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB__nXEaSa4Hx_0up_onhmIdUMkx4tcuYk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "jobflow25.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "jobflow25",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "jobflow25.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "350790971531",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:350790971531:web:ac2a19940aa9317a54e48e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Emulator-Verbindungen wurden vollständig entfernt. Seeding erfolgt gegen das konfigurierte Projekt.

// Test-Daten
const testUsers = [
  {
    email: 'admin@jobflow.de',
    password: 'admin123',
    displayName: 'Admin User',
    role: 'admin',
    phone: '+49 123 456789',
    qualifications: ['Intensivpflege', 'Anästhesie', 'Notfallmedizin'],
    active: true,
    birthDate: new Date('1985-03-15'),
    notificationSettings: {
      emailNotifications: true,
      pushNotifications: true,
      shiftReminders: true,
      documentExpiry: true,
      systemAnnouncements: true,
    }
  },
  {
    email: 'dispatcher@jobflow.de',
    password: 'dispatcher123',
    displayName: 'Disponent',
    role: 'dispatcher',
    phone: '+49 123 456790',
    qualifications: ['Pflegemanagement', 'Personalführung'],
    active: true,
    birthDate: new Date('1988-07-22'),
    notificationSettings: {
      emailNotifications: true,
      pushNotifications: true,
      shiftReminders: true,
      documentExpiry: true,
      systemAnnouncements: true,
    }
  },
  {
    email: 'nurse1@jobflow.de',
    password: 'nurse123',
    displayName: 'Maria Schmidt',
    role: 'nurse',
    phone: '+49 123 456791',
    qualifications: ['Intensivpflege', 'Pädiatrie'],
    active: true,
    birthDate: new Date('1990-11-08'),
    notificationSettings: {
      emailNotifications: true,
      pushNotifications: true,
      shiftReminders: true,
      documentExpiry: true,
      systemAnnouncements: false,
    }
  },
  {
    email: 'nurse2@jobflow.de',
    password: 'nurse123',
    displayName: 'Thomas Müller',
    role: 'nurse',
    phone: '+49 123 456792',
    qualifications: ['Chirurgie', 'Orthopädie'],
    active: true,
    birthDate: new Date('1987-05-14'),
    notificationSettings: {
      emailNotifications: true,
      pushNotifications: false,
      shiftReminders: true,
      documentExpiry: true,
      systemAnnouncements: true,
    }
  }
];

const testFacilities = [
  {
    name: 'Klinikum München',
    address: 'Maximilianstraße 1, 80539 München',
    phone: '+49 89 12345678',
    email: 'info@klinikum-muenchen.de',
    type: 'hospital',
    capacity: 500,
    specialties: ['Intensivmedizin', 'Chirurgie', 'Pädiatrie'],
    coordinates: { latitude: 48.1351, longitude: 11.5820 },
    active: true,
    contactPerson: 'Dr. Anna Weber',
    notes: 'Großes Universitätsklinikum mit 24/7 Notfallversorgung'
  },
  {
    name: 'Seniorenheim Sonnenhof',
    address: 'Sonnenstraße 15, 80331 München',
    phone: '+49 89 87654321',
    email: 'kontakt@seniorenheim-sonnenhof.de',
    type: 'nursing_home',
    capacity: 120,
    specialties: ['Geriatrie', 'Palliativmedizin'],
    coordinates: { latitude: 48.1374, longitude: 11.5755 },
    active: true,
    contactPerson: 'Maria Fischer',
    notes: 'Moderne Pflegeeinrichtung mit hohem Betreuungsschlüssel'
  },
  {
    name: 'Praxis Dr. Müller',
    address: 'Hauptstraße 42, 80335 München',
    phone: '+49 89 11223344',
    email: 'praxis@dr-mueller.de',
    type: 'clinic',
    capacity: 50,
    specialties: ['Allgemeinmedizin', 'Orthopädie'],
    coordinates: { latitude: 48.1398, longitude: 11.5689 },
    active: true,
    contactPerson: 'Dr. Hans Müller',
    notes: 'Familienpraxis mit moderner Ausstattung'
  }
];

const testShifts = [
  {
    title: 'Frühschicht Intensivstation',
    description: 'Frühschicht auf der Intensivstation, Überwachung kritisch kranker Patienten',
    startTime: '06:00',
    endTime: '14:00',
    date: new Date('2024-01-15'),
    facilityId: '', // Wird nach Facility-Erstellung gesetzt
    type: 'intensive_care',
    requiredQualifications: ['Intensivpflege'],
    capacity: 2,
    maxStaff: 2,
    status: 'open',
    notes: 'Besondere Aufmerksamkeit für Patient Zimmer 12'
  },
  {
    title: 'Spätschicht Chirurgie',
    description: 'Spätschicht auf der chirurgischen Station',
    startTime: '14:00',
    endTime: '22:00',
    date: new Date('2024-01-15'),
    facilityId: '', // Wird nach Facility-Erstellung gesetzt
    type: 'surgery',
    requiredQualifications: ['Chirurgie'],
    capacity: 3,
    maxStaff: 3,
    status: 'open',
    notes: 'Postoperative Betreuung'
  },
  {
    title: 'Nachtschicht Pädiatrie',
    description: 'Nachtschicht auf der Kinderstation',
    startTime: '22:00',
    endTime: '06:00',
    date: new Date('2024-01-15'),
    facilityId: '', // Wird nach Facility-Erstellung gesetzt
    type: 'pediatrics',
    requiredQualifications: ['Pädiatrie'],
    capacity: 1,
    maxStaff: 1,
    status: 'filled',
    notes: 'Ruhige Nacht erwartet'
  }
];

const testDocuments = [
  {
    userId: '', // Wird nach User-Erstellung gesetzt
    type: 'certificate',
    name: 'Intensivpflege-Zertifikat',
    url: 'https://example.com/certificate.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    status: 'valid',
    expiryDate: new Date('2025-12-31'),
    verified: true,
    verifiedBy: 'admin',
    verifiedAt: new Date(),
    notes: 'Gültig bis Ende 2025'
  },
  {
    userId: '', // Wird nach User-Erstellung gesetzt
    type: 'id_card',
    name: 'Personalausweis',
    url: 'https://example.com/id.pdf',
    fileSize: 512000,
    mimeType: 'application/pdf',
    status: 'valid',
    expiryDate: new Date('2030-06-15'),
    verified: true,
    verifiedBy: 'admin',
    verifiedAt: new Date(),
    notes: 'Gültiger Personalausweis'
  }
];

// Hilfsfunktionen
async function createUser(userData) {
  try {
    console.log(`Creating user: ${userData.email}`);
    
    // User in Firebase Auth erstellen
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;
    
    // Display Name setzen
    await updateProfile(user, {
      displayName: userData.displayName
    });
    
    // User-Dokument in Firestore erstellen
    const userDoc = {
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      phone: userData.phone,
      qualifications: userData.qualifications,
      active: userData.active,
      birthDate: Timestamp.fromDate(userData.birthDate),
      notificationSettings: userData.notificationSettings,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    await setDoc(doc(db, 'users', user.uid), userDoc);
    
    console.log(`✅ User created: ${userData.email} (${user.uid})`);
    return user.uid;
  } catch (error) {
    // Falls der Nutzer bereits existiert, einloggen und UID verwenden
    const message = error && error.message ? error.message : String(error);
    if (message.includes('auth/email-already-in-use')) {
      try {
        const existing = await signInWithEmailAndPassword(auth, userData.email, userData.password);
        const existingUser = existing.user;
        // Sicherstellen, dass ein User-Dokument existiert/aktualisiert wird
        const userDoc = {
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          phone: userData.phone,
          qualifications: userData.qualifications,
          active: userData.active,
          birthDate: Timestamp.fromDate(userData.birthDate),
          notificationSettings: userData.notificationSettings,
          updatedAt: Timestamp.now(),
        };
        await setDoc(doc(db, 'users', existingUser.uid), userDoc, { merge: true });
        console.log(`ℹ️ User exists, reusing: ${userData.email} (${existingUser.uid})`);
        return existingUser.uid;
      } catch (signinErr) {
        console.error(`❌ Error reusing existing user ${userData.email}:`, signinErr.message || signinErr);
        return null;
      }
    }
    console.error(`❌ Error creating user ${userData.email}:`, message);
    return null;
  }
}

async function createFacility(facilityData) {
  try {
    console.log(`Creating facility: ${facilityData.name}`);
    
    const facilityDoc = {
      ...facilityData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'facilities'), facilityDoc);
    console.log(`✅ Facility created: ${facilityData.name} (${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Error creating facility ${facilityData.name}:`, error.message);
    return null;
  }
}

async function createShift(shiftData, facilityId) {
  try {
    console.log(`Creating shift: ${shiftData.title}`);
    
    const shiftDoc = {
      ...shiftData,
      facilityId: facilityId,
      date: Timestamp.fromDate(shiftData.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'shifts'), shiftDoc);
    console.log(`✅ Shift created: ${shiftData.title} (${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Error creating shift ${shiftData.title}:`, error.message);
    return null;
  }
}

async function createDocument(documentData, userId) {
  try {
    console.log(`Creating document: ${documentData.name}`);
    
    const documentDoc = {
      ...documentData,
      userId: userId,
      expiryDate: Timestamp.fromDate(documentData.expiryDate),
      verifiedAt: Timestamp.fromDate(documentData.verifiedAt),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'documents'), documentDoc);
    console.log(`✅ Document created: ${documentData.name} (${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Error creating document ${documentData.name}:`, error.message);
    return null;
  }
}

// Hauptfunktion
async function seedFirestore() {
  console.log('🌱 Starting Firestore seeding...\n');
  console.log('⚠️  WARNUNG: Dieses Script erstellt Test-Daten OHNE companyId!');
  console.log('⚠️  Diese Daten sind für ALLE Firmen sichtbar.\n');
  
  try {
    // 1. Users erstellen
    console.log('📝 Creating users...');
    const userIds = [];
    for (const userData of testUsers) {
      const userId = await createUser(userData);
      if (userId) {
        userIds.push(userId);
      }
    }
    
    // 2. Facilities erstellen
    console.log('\n🏥 Creating facilities...');
    const facilityIds = [];
    for (const facilityData of testFacilities) {
      const facilityId = await createFacility(facilityData);
      if (facilityId) {
        facilityIds.push(facilityId);
      }
    }
    
    // 3. Shifts erstellen
    console.log('\n⏰ Creating shifts...');
    const shiftIds = [];
    for (let i = 0; i < testShifts.length; i++) {
      const shiftData = testShifts[i];
      const facilityId = facilityIds[i % facilityIds.length]; // Rotiere durch Facilities
      const shiftId = await createShift(shiftData, facilityId);
      if (shiftId) {
        shiftIds.push(shiftId);
      }
    }
    
    // 4. Documents erstellen
    console.log('\n📄 Creating documents...');
    for (let i = 0; i < testDocuments.length; i++) {
      const documentData = testDocuments[i];
      const userId = userIds[i % userIds.length]; // Rotiere durch Users
      await createDocument(documentData, userId);
    }
    
    // 5. Assignments erstellen
    console.log('\n👥 Creating assignments...');
    for (let i = 0; i < shiftIds.length; i++) {
      const shiftId = shiftIds[i];
      const userId = userIds[i % userIds.length];
      
      try {
        const assignmentDoc = {
          userId: userId,
          shiftId: shiftId,
          status: i === 2 ? 'accepted' : 'pending', // Letzter Shift ist bereits angenommen
          assignedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        const docRef = await addDoc(collection(db, 'assignments'), assignmentDoc);
        console.log(`✅ Assignment created: User ${userId} -> Shift ${shiftId} (${docRef.id})`);
      } catch (error) {
        console.error(`❌ Error creating assignment:`, error.message);
      }
    }
    
    console.log('\n🎉 Firestore seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users created: ${userIds.length}`);
    console.log(`- Facilities created: ${facilityIds.length}`);
    console.log(`- Shifts created: ${shiftIds.length}`);
    console.log(`- Documents created: ${testDocuments.length}`);
    console.log(`- Assignments created: ${shiftIds.length}`);
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('Admin: admin@jobflow.de / admin123');
    console.log('Disponent: dispatcher@jobflow.de / dispatcher123');
    console.log('Nurse 1: nurse1@jobflow.de / nurse123');
    console.log('Nurse 2: nurse2@jobflow.de / nurse123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Auth signout
    try {
      await signOut(auth);
    } catch (error) {
      // Ignore signout errors
    }
  }
}

// Script ausführen
if (require.main === module) {
  seedFirestore().then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { seedFirestore };
