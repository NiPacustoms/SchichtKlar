import { DocumentData } from 'firebase/firestore';

export function isAdmin(userDoc: DocumentData | undefined | null): boolean {
  if (!userDoc) return false;
  return userDoc.role === 'admin';
}

export function ensureSameCompany(userDoc: DocumentData | undefined | null, companyId: string | undefined | null): boolean {
  if (!userDoc || !companyId) return false;
  return userDoc.companyId === companyId;
}

export function maskEmail(email: string): string {
  return email.replace(/(^.).*(@.*$)/, (_m, p1, p2) => `${p1}***${p2}`);
}


