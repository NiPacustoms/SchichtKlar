import { SINGLE_COMPANY_ID } from '@/lib/constants/company';

/**
 * Die App läuft vollständig Single-Tenant.
 * Wir geben daher überall den statischen Identifier zurück.
 */
export async function getCompanyIdFromAuth(): Promise<string | null> {
  return SINGLE_COMPANY_ID;
}

export async function refreshTokenAndGetCompanyId(): Promise<string | null> {
  return SINGLE_COMPANY_ID;
}

export function getCompanyIdFromAuthSync(): string | null {
  return SINGLE_COMPANY_ID;
}

