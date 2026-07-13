import { getAuthSafe } from '@/lib/firebase';

/**
 * Ermittelt die companyId des aktuell angemeldeten Nutzers aus den
 * Firebase-Auth-Custom-Claims (echtes Multi-Tenant-Verhalten).
 *
 * Quelle der Wahrheit ist der `companyId`-Claim, den register-admin /
 * accept-invite / sync-claims serverseitig setzen. Ist kein Nutzer angemeldet
 * oder der Claim (noch) nicht gesetzt, wird `null` zurückgegeben – Aufrufer
 * dürfen dann KEINE unternehmensweiten Queries ausführen.
 */
export async function getCompanyIdFromAuth(): Promise<string | null> {
  const auth = getAuthSafe();
  const user = auth?.currentUser;
  if (!user) return null;
  try {
    const tokenResult = await user.getIdTokenResult();
    const companyId = tokenResult.claims.companyId;
    return typeof companyId === 'string' && companyId.length > 0 ? companyId : null;
  } catch {
    return null;
  }
}

/**
 * Erzwingt einen Token-Refresh und liest die companyId danach neu aus den
 * Claims. Nützlich unmittelbar nach Registrierung/Einladungsannahme, wenn der
 * Claim serverseitig gerade erst gesetzt wurde und der gecachte Token ihn noch
 * nicht enthält.
 */
export async function refreshTokenAndGetCompanyId(): Promise<string | null> {
  const auth = getAuthSafe();
  const user = auth?.currentUser;
  if (!user) return null;
  try {
    const tokenResult = await user.getIdTokenResult(true);
    const companyId = tokenResult.claims.companyId;
    return typeof companyId === 'string' && companyId.length > 0 ? companyId : null;
  } catch {
    return null;
  }
}

/**
 * Synchroner Zugriff ist auf die Claims nicht möglich (getIdTokenResult ist
 * async). Aufrufer, die die companyId synchron brauchen, sollten sie aus dem
 * bereits geladenen `user`-Objekt (AuthContext) beziehen.
 */
export function getCompanyIdFromAuthSync(): string | null {
  return null;
}
