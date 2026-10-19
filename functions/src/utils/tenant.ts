import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';

/**
 * Mandantenisolation für Callable Functions.
 *
 * Grundsatz: fail-closed. Kann die Firma des Aufrufers nicht ermittelt werden,
 * wird abgelehnt – nie "durchgewunken". Rollenprüfungen allein ("ist Admin")
 * reichen seit der echten Multi-Tenancy nicht mehr aus: ein Admin darf nur
 * Daten der eigenen Firma sehen und ändern.
 *
 * HttpsError aus v2 ist mit v1-onCall kompatibel (gleiche Fehlerklasse).
 */

type TokenLike = { role?: string; companyId?: string; claims?: { companyId?: string } } & Record<
  string,
  unknown
>;

export interface CallerContext {
  uid: string;
  role: string | undefined;
  companyId: string;
  isAdmin: boolean;
}

/** Ermittelt Rolle + Firma des Aufrufers (Claims, Fallback: users/{uid}). */
export async function getCaller(auth: { uid: string; token: unknown } | undefined | null): Promise<CallerContext> {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  const token = (auth.token || {}) as TokenLike;
  let companyId = token.companyId || token.claims?.companyId;
  let role = token.role;

  if (!companyId || !role) {
    const userSnap = await admin.firestore().collection('users').doc(auth.uid).get();
    const data = userSnap.exists ? userSnap.data() : undefined;
    companyId = companyId || (data?.companyId as string | undefined);
    role = role || (data?.role as string | undefined);
  }

  if (!companyId) {
    throw new HttpsError('permission-denied', 'Keine Firmenzuordnung für diesen Nutzer');
  }

  return { uid: auth.uid, role, companyId, isAdmin: role === 'admin' };
}

/** Wirft permission-denied, wenn die Ressource nicht zur Firma des Aufrufers gehört. */
export function assertSameCompany(caller: CallerContext, resourceCompanyId: unknown): void {
  if (typeof resourceCompanyId !== 'string' || resourceCompanyId !== caller.companyId) {
    throw new HttpsError('permission-denied', 'Ressource gehört nicht zu Ihrer Firma');
  }
}

/** Wie getCaller, verlangt zusätzlich Admin-Rolle. */
export async function requireAdmin(auth: { uid: string; token: unknown } | undefined | null): Promise<CallerContext> {
  const caller = await getCaller(auth);
  if (!caller.isAdmin) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }
  return caller;
}
