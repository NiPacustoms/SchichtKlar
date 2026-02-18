/**
 * Service für Auth-spezifische Firestore-Operationen.
 * Kapselt getOrCreate User-Dokument, Role-Rectification, CompanyId-Backfill.
 * SOTA: Kein direkter Firestore-Zugriff in AuthContext.
 */
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, getDb } from '@/lib/firebase';
import { User } from '@/lib/types';
import { SINGLE_COMPANY_ID } from '@/lib/constants/company';
import { logger } from '@/lib/logging';
import { AuthService } from './authService';

const DEFAULT_NOTIFICATION_SETTINGS = {
  emailNotifications: true,
  pushNotifications: true,
  shiftReminders: true,
  documentExpiry: true,
  systemAnnouncements: true,
} as const;

function getFirestoreErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as { code?: string }).code;
  }
  return undefined;
}

function isPermissionDeniedError(error: unknown): boolean {
  return getFirestoreErrorCode(error) === 'permission-denied';
}

function buildDefaultUserDocumentPayload(firebaseUser: FirebaseUser, includeCreatedAt = true) {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName:
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'Unbekannter Benutzer',
    role: 'nurse',
    companyId: SINGLE_COMPANY_ID,
    active: true,
    qualifications: [],
    documents: [],
    notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
    ...(includeCreatedAt ? { createdAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  };
}

export function buildFallbackUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName:
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'Unbekannter Benutzer',
    role: 'nurse',
    companyId: SINGLE_COMPANY_ID,
    qualifications: [],
    documents: [],
    active: true,
    notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function getDate(timestamp: unknown): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (
    typeof timestamp === 'object' &&
    timestamp !== null &&
    'toDate' in timestamp &&
    typeof (timestamp as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (timestamp as { toDate: () => Date }).toDate();
  }
  return new Date();
}

/**
 * Lädt oder erstellt das User-Dokument in Firestore.
 * Behandelt permission-denied, Retries, Role-Rectification, CompanyId-Backfill.
 * @returns User oder null bei Fehlern (Caller nutzt dann buildFallbackUser)
 */
export async function getOrCreateAuthUser(firebaseUser: FirebaseUser): Promise<User | null> {
  if (!db) return null;

  let userDoc: Awaited<ReturnType<typeof getDoc>> | null = null;
  let retries = 3;
  let lastError: unknown = null;
  let attemptedDefaultDocCreation = false;
  const userDocRef = doc(getDb(), 'users', firebaseUser.uid);

  while (retries > 0) {
    try {
      const docSnapshot = await getDoc(userDocRef);
      userDoc = docSnapshot;

      if (!userDoc.exists() && !attemptedDefaultDocCreation) {
        try {
          await setDoc(userDocRef, buildDefaultUserDocumentPayload(firebaseUser), {
            merge: true,
          });
          attemptedDefaultDocCreation = true;
          const newDocSnapshot = await getDoc(userDocRef);
          userDoc = newDocSnapshot;
          if (userDoc?.exists()) break;
          continue;
        } catch (creationError: unknown) {
          lastError = creationError;
          const code = getFirestoreErrorCode(creationError);
          if (code !== 'permission-denied') {
            logger.warn('Failed to create default user document', {}, {
              error: creationError instanceof Error ? creationError.message : String(creationError),
            });
          }
        }
      }
      break;
    } catch (error: unknown) {
      lastError = error;
      const errorCode = getFirestoreErrorCode(error);
      if (errorCode === 'permission-denied' && !attemptedDefaultDocCreation) {
        try {
          await setDoc(userDocRef, buildDefaultUserDocumentPayload(firebaseUser), {
            merge: true,
          });
          attemptedDefaultDocCreation = true;
          continue;
        } catch (creationError: unknown) {
          lastError = creationError;
          if (getFirestoreErrorCode(creationError) !== 'permission-denied') {
            logger.warn('Failed to create default user document after permission error', {}, {
              error: creationError instanceof Error ? creationError.message : String(creationError),
            });
          }
        }
      }
      if (errorCode === 'permission-denied' && retries > 1) {
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          await firebaseUser.getIdToken(true);
        } catch {
          // ignorieren
        }
        continue;
      }
      if (errorCode === 'permission-denied' && retries === 1) {
        userDoc = null;
        break;
      }
      if (errorCode !== 'permission-denied') throw error;
      userDoc = null;
      break;
    }
  }

  if (!userDoc && isPermissionDeniedError(lastError)) {
    try {
      await AuthService.syncClaimsFromServer(firebaseUser, 'permission-denied-retry');
      await firebaseUser.getIdToken(true);
      const retrySnapshot = await getDoc(userDocRef);
      if (retrySnapshot.exists()) userDoc = retrySnapshot;
    } catch {
      // Sync fehlgeschlagen
    }
    if (!userDoc) return null;
  }

  if (!userDoc) throw lastError || new Error('Failed to load user document after retries');

  if (!userDoc.exists()) return null;

  const userData = userDoc.data() as Record<string, unknown>;
  const rawRole = userData.role as string;
  const effectiveRole: User['role'] =
    rawRole === 'admin' || rawRole === 'nurse'
      ? (rawRole as User['role'])
      : 'admin';

  if (effectiveRole !== rawRole) {
    try {
      await updateDoc(doc(getDb(), 'users', firebaseUser.uid), {
        role: effectiveRole,
        updatedAt: new Date(),
      });
    } catch (migrationError: unknown) {
      logger.error('Failed to rectify user role', migrationError instanceof Error ? migrationError : new Error(String(migrationError)));
    }
  }

  const companyId = (userData.companyId as string) || SINGLE_COMPANY_ID;
  if (!userData.companyId) {
    try {
      await updateDoc(doc(getDb(), 'users', firebaseUser.uid), {
        companyId: SINGLE_COMPANY_ID,
        updatedAt: new Date(),
      });
    } catch (companyError: unknown) {
      logger.warn('Failed to backfill companyId on user document', {}, {
        error: companyError instanceof Error ? companyError.message : String(companyError),
      });
    }
  }

  const customRoleId = (userData.customRoleId as string) || undefined;

  const finalUser: User = {
    id: userDoc.id,
    email: (userData.email as string) || '',
    displayName: (userData.displayName as string) || '',
    role: effectiveRole,
    customRoleId,
    companyId,
    qualifications: (userData.qualifications as string[]) || [],
    documents: (userData.documents as string[]) || [],
    active: userData.active !== undefined ? Boolean(userData.active) : true,
    notificationSettings: (userData.notificationSettings as User['notificationSettings']) || {
      ...DEFAULT_NOTIFICATION_SETTINGS,
    },
    createdAt: getDate(userData.createdAt),
    updatedAt: getDate(userData.updatedAt),
  };

  return finalUser;
}

const ALLOWED_ROLES: Array<User['role']> = ['admin', 'nurse'];

/**
 * Wendet Token-Claims (Rolle, companyId) auf ein bereits geladenes User-Dokument an.
 * Für Login: erlaubt paralleles Session-Setzen und getOrCreateAuthUser, danach ein Aufruf.
 */
export async function applyClaimsToUser(
  firebaseUser: FirebaseUser,
  user: User
): Promise<User> {
  let latestTokenResult: Awaited<ReturnType<FirebaseUser['getIdTokenResult']>> | null = null;
  try {
    latestTokenResult = await firebaseUser.getIdTokenResult(false);
    const expiryTime = latestTokenResult.expirationTime ? new Date(latestTokenResult.expirationTime).getTime() : null;
    const now = Date.now();
    if (expiryTime && expiryTime - now < 5 * 60 * 1000) {
      await firebaseUser.getIdToken(true);
      latestTokenResult = await firebaseUser.getIdTokenResult(false);
    }
  } catch (tokenError) {
    const msg = tokenError instanceof Error ? tokenError.message : String(tokenError);
    if (!msg.includes('400') && !msg.includes('Bad Request')) {
      logger.warn('Failed to refresh token, continuing anyway', {}, { error: msg });
    }
  }

  let effectiveRole: User['role'] = user.role;
  const claimsRole = latestTokenResult?.claims?.role as string | undefined;
  if (claimsRole && ALLOWED_ROLES.includes(claimsRole as User['role'])) {
    effectiveRole = claimsRole as User['role'];
  } else if (!ALLOWED_ROLES.includes(user.role)) {
    effectiveRole = 'nurse';
    try {
      await updateDoc(doc(getDb(), 'users', firebaseUser.uid), {
        role: effectiveRole,
        updatedAt: new Date(),
      });
    } catch (migrationError: unknown) {
      logger.error('Failed to rectify user role', migrationError instanceof Error ? migrationError : new Error(String(migrationError)));
    }
  }

  let companyId = user.companyId || SINGLE_COMPANY_ID;
  try {
    let tokenResult = latestTokenResult ?? (await firebaseUser.getIdTokenResult(false));
    const hasCompanyClaim = Boolean(tokenResult.claims.companyId);
    const hasRoleClaim = Boolean(tokenResult.claims.role);
    if ((!hasCompanyClaim || !hasRoleClaim) && companyId) {
      const refreshed = await AuthService.syncClaimsFromServer(
        firebaseUser,
        hasCompanyClaim ? 'missing-role' : 'missing-company'
      );
      if (refreshed) {
        tokenResult = refreshed;
      }
    }
    const claimsCompanyId = tokenResult.claims.companyId as string | undefined;
    if (claimsCompanyId) companyId = claimsCompanyId;
  } catch (tokenError: unknown) {
    logger.warn('Failed to get companyId from token claims', {}, {
      error: tokenError instanceof Error ? tokenError.message : String(tokenError),
    });
  }

  if (process.env.NODE_ENV === 'development') {
    logger.debug('User role loaded', {}, {
      userId: firebaseUser.uid,
      email: user.email,
      firestoreRole: user.role,
      claimsRole,
      effectiveRole,
    });
  }

  return { ...user, role: effectiveRole, companyId };
}

/**
 * Lädt den Auth-User inkl. Token-Claims (Rolle, companyId).
 * Sollte nach onAuthStateChanged aufgerufen werden.
 * @returns User oder null (z. B. bei permission-denied); Caller nutzt dann buildFallbackUser.
 */
export async function loadUserForAuth(firebaseUser: FirebaseUser): Promise<User | null> {
  const user = await getOrCreateAuthUser(firebaseUser);
  if (!user) return null;
  return applyClaimsToUser(firebaseUser, user);
}

/**
 * Aktualisiert Benutzerfelder (für self-service Profilbearbeitung).
 */
export async function updateAuthUserProfile(uid: string, data: Partial<User>): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const userRef = doc(getDb(), 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: new Date(),
  });
}

export const authUserService = {
  getOrCreateAuthUser,
  loadUserForAuth,
  applyClaimsToUser,
  updateAuthUserProfile,
  buildFallbackUser,
};
