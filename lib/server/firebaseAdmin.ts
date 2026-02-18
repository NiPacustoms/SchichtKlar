import { Buffer } from 'node:buffer';
import * as admin from 'firebase-admin';
import { SINGLE_COMPANY_ID } from '@/lib/constants/company';

type ServiceAccountJSON = {
  project_id?: string;
  private_key?: string;
  client_email?: string;
};

function parseJson<T = ServiceAccountJSON>(raw: string | undefined | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizePrivateKey(key: string | undefined) {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
}

function getServiceAccountFromEnv(): admin.ServiceAccount | null {
  const base64 =
    process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64 ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const rawJson =
    process.env.FIREBASE_ADMIN_CREDENTIALS ||
    (base64 ? Buffer.from(base64, 'base64').toString('utf8') : undefined);

  const parsed = parseJson<ServiceAccountJSON>(rawJson);
  if (!parsed?.client_email || !parsed.private_key) {
    return null;
  }

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: normalizePrivateKey(parsed.private_key),
  };
}

const projectIdFromEnv =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT;

// Initialize once per process
if (!admin.apps.length) {
  const serviceAccount = getServiceAccountFromEnv();

  try {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId || projectIdFromEnv,
      });
    } else {
      // Prefer application default credentials if available
      const credential = admin.credential.applicationDefault();
      admin.initializeApp({ credential, projectId: projectIdFromEnv });
    }
  } catch {
    try {
      // Fallback: initialize without explicit options (may still work if env is configured)
      admin.initializeApp();
    } catch {
      // Avoid crash in build environments; API routes should fail gracefully if missing
    }
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;

/**
 * Extended Firebase Auth Token with Custom Claims
 * Custom Claims können direkt auf dem Token oder in customClaims sein
 */
export interface FirebaseAuthToken {
  uid: string;
  email?: string;
  role?: 'admin' | 'mitarbeiter';
  companyId?: string;
  customClaims?: {
    role?: 'admin' | 'mitarbeiter';
    companyId?: string;
  };
  [key: string]: unknown; // Für andere Firebase Token Properties
}

/**
 * Helper-Funktion zum Extrahieren der Role aus einem Firebase Auth Token
 */
export function getRoleFromToken(token: admin.auth.DecodedIdToken | null): 'admin' | 'mitarbeiter' | null {
  if (!token) return null;
  const raw = (token as FirebaseAuthToken).role ?? (token as FirebaseAuthToken).customClaims?.role;
  if (raw === 'admin' || raw === 'mitarbeiter') return raw;
  return null;
}

/**
 * Helper-Funktion zum Extrahieren der CompanyId aus einem Firebase Auth Token
 */
export function getCompanyIdFromToken(_: admin.auth.DecodedIdToken | null): string | null {
  return SINGLE_COMPANY_ID;
}

export async function verifyIdToken(authorizationHeader?: string) {
  if (!adminAuth) return null;
  if (!authorizationHeader) return null;
  const token = authorizationHeader.replace(/^Bearer\s+/i, '');
  try {
    return await adminAuth.verifyIdToken(token, true);
  } catch {
    return null;
  }
}


