import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage as getFirebaseStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { logger } from '@/lib/utils/logger';
// Messaging wird komplett dynamisch importiert, da es nur im Browser verfügbar ist
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Messaging = any;

const _requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const _envProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string;
const _envStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: _envProjectId,
  storageBucket: _envStorageBucket || (_envProjectId ? `${_envProjectId}.appspot.com` : ''),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
};

const hasAllRequiredValues = 
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId && 
  firebaseConfig.storageBucket && 
  firebaseConfig.messagingSenderId && 
  firebaseConfig.appId;

// Initialize Firebase safely (avoid crashing in development when env vars are missing)
let app: ReturnType<typeof initializeApp> | null = null;
try {
  // Initialisiere nur im Browser
  if (typeof window !== 'undefined' && hasAllRequiredValues) {
    app = initializeApp(firebaseConfig);
    logger.info('✅ Firebase wurde erfolgreich initialisiert');
  }
} catch (error) {
  // Bei Fehlern nicht crashen
  if (typeof window !== 'undefined') {
    logger.error('❌ Firebase initialization failed:', error);
  }
}

// Initialize Firebase services only if app exists
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;
// Messaging wird nicht mehr hier initialisiert, da es in pushNotifications.ts
// eigenständig initialisiert wird. Dies verhindert Webpack-Chunk-Probleme.
const messaging: Messaging | null = null;

// Initialize Firebase services only in browser
if (typeof window !== 'undefined' && app) {
  try {
    auth = getAuth(app);
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    });
    storage = getFirebaseStorage(app);
    functions = getFunctions(app);
    
    // Messaging wird nicht mehr hier initialisiert, um Webpack-Chunk-Probleme zu vermeiden
    // Verwende stattdessen pushNotifications.ts für Messaging-Initialisierung
  } catch (error) {
    logger.warn('⚠️ Firebase services initialization failed:', error);
  }
}

// Exportiere alle Services
export { auth, db, storage, functions, messaging };

// Optionale Emulator-Anbindung
if (typeof window !== 'undefined') {
  try {
    const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';
    if (useEmulators && app && auth && db && storage) {
      const host = process.env.NEXT_PUBLIC_EMULATOR_HOST || '127.0.0.1';
      const firestorePort = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || 8080);
      const authPort = Number(process.env.NEXT_PUBLIC_AUTH_EMULATOR_PORT || 9099);
      const storagePort = Number(process.env.NEXT_PUBLIC_STORAGE_EMULATOR_PORT || 9199);

      connectFirestoreEmulator(db, host, firestorePort);
      connectAuthEmulator(auth, `http://${host}:${authPort}`, { disableWarnings: true });
      connectStorageEmulator(storage, host, storagePort);
      logger.info('🔌 Firebase Emulator verbunden');
    }
  } catch (e) {
    logger.warn('Emulator-Verbindung fehlgeschlagen oder nicht aktiv:', e);
  }
}

// Unterdrücke erwartete Permission-Denied-Fehler und harmlose Firestore-Verbindungsfehler
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  
  // Hilfsfunktion zum Prüfen, ob ein Fehler harmlos ist
  const isHarmlessFirestoreError = (errorText: string): boolean => {
    const lowerText = errorText.toLowerCase();
    
    // Alle Firestore Permission-Denied-Fehler unterdrücken (Listener/Queries; Rules-Fallback läuft über User-Dokument)
    const isExpectedPermissionError =
      (lowerText.includes('permission-denied') ||
       lowerText.includes('missing or insufficient permissions') ||
       lowerText.includes('[code=permission-denied]')) &&
      (lowerText.includes('snapshot listener') ||
       lowerText.includes('@firebase/firestore') ||
       lowerText.includes('firestore') ||
       lowerText.includes('users/') ||
       lowerText.includes('users') ||
       lowerText.includes('authcontext') ||
       lowerText.includes('getdoc'));
    
    // Harmlose Firestore-Verbindungsfehler beim Schließen von Listenern unterdrücken
    // Diese Fehler treten auf, wenn Listener versuchen, sich zu trennen, aber die Verbindung bereits geschlossen ist
    const isHarmlessConnectionError = 
      // Prüfe auf 400 Bad Request
      lowerText.includes('400') &&
      // Prüfe auf Bad Request oder den spezifischen Firestore-Endpoint
      (lowerText.includes('bad request') ||
       lowerText.includes('firestore.googleapis.com')) &&
      // Prüfe auf Listen-Endpoint oder terminate-Parameter oder webchannel
      (lowerText.includes('listen') ||
       lowerText.includes('/listen/') ||
       lowerText.includes('terminate') ||
       lowerText.includes('type=terminate') ||
       lowerText.includes('webchannel') ||
       lowerText.includes('webchannel_blob') ||
       lowerText.includes('webchannel_blob_es2018'));
    
    return isExpectedPermissionError || isHarmlessConnectionError;
  };
  
  // Console.error Handler
  console.error = (...args: unknown[]) => {
    const first = args[0];
    const errorMessage =
      (first && typeof first === 'object' && 'message' in first
        ? String((first as Error).message)
        : first?.toString()) || '';
    const errorStack =
      (first && typeof first === 'object' && 'stack' in first
        ? String((first as Error).stack)
        : args.length > 1 ? args[1]?.toString() : '') || '';
    const allErrorText = `${errorMessage} ${errorStack}`;
    
    if (isHarmlessFirestoreError(allErrorText)) {
      return;
    }
    
    originalConsoleError.apply(console, args);
  };
  
  // Globaler Error Handler für unhandled errors
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const errorText = `${message} ${source} ${error?.message || ''} ${error?.stack || ''}`;
    if (isHarmlessFirestoreError(errorText)) {
      return true; // Fehler als behandelt markieren
    }
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };
  
  // Handler für unhandled promise rejections
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = ((event: PromiseRejectionEvent) => {
    const errorText = `${event.reason?.message || ''} ${event.reason?.stack || ''} ${String(event.reason || '')}`;
    if (isHarmlessFirestoreError(errorText)) {
      event.preventDefault(); // Verhindere, dass der Fehler in der Konsole erscheint
      return;
    }
    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(window, event);
    }
  }) as typeof window.onunhandledrejection;
}

export function getDb(): Firestore {
  if (typeof window === 'undefined') {
    throw new Error('Firestore kann nur clientseitig initialisiert werden.');
  }
  if (!app) {
    throw new Error('Firestore ist nicht initialisiert.');
  }
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    });
  } catch (error) {
    throw new Error('Firestore konnte nicht initialisiert werden: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
  }
}

export function getStorage(): FirebaseStorage {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Storage kann nur clientseitig initialisiert werden.');
  }
  if (!app) {
    throw new Error('Firebase Storage ist nicht initialisiert.');
  }
  try {
    return getFirebaseStorage(app);
  } catch (error) {
    throw new Error('Firebase Storage konnte nicht initialisiert werden: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
  }
}

// Exportiere Firebase-Konfiguration für Services, die sie benötigen
export function getFirebaseConfig() {
  return firebaseConfig;
}

// Re-export Firestore functions that are used in API routes
export { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

export default app;
