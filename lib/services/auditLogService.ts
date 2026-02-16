export type AuditLogEntry = {
  actorUid: string;
  companyId: string;
  action: string; // e.g., 'facility.update', 'shift.create', 'user.delete'
  target: { collection: string; id: string };
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  requestId?: string;
  createdAt: number;
};

/** Eintrag für die Anzeige (mit id und optional Firestore-Timestamp) */
export type AuditLogViewItem = {
  id: string;
  actorUid: string;
  companyId: string;
  action: string;
  target?: { collection: string; id: string };
  requestId?: string;
  createdAt?: { seconds: number; nanoseconds: number } | Date;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
};

import { auth, getDb } from '@/lib/firebase';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { logger } from '@/lib/logging';
import { AppError, ErrorCode, ErrorSeverity, createAppError } from '@/lib/errors';

type CompanySource = Record<string, unknown> | undefined;

const extractCompanyIdFromEntry = (source: CompanySource): string | undefined => {
  if (!source) return undefined;
  const record = source as Record<string, unknown>;
  const rawCompany = record['companyId'] as unknown;
  if (typeof rawCompany === 'string' && rawCompany.trim() && rawCompany !== 'unknown') {
    return rawCompany.trim();
  }
  return undefined;
};

// Helper function to sanitize data for JSON serialization
const sanitizeForJSON = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return null;
  }
  
  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  // Handle Firestore Timestamps (client-side)
  if (data && typeof data === 'object' && 'toDate' in data && typeof (data as { toDate: () => Date }).toDate === 'function') {
    try {
      return (data as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  
  // Skip functions and undefined
  if (typeof data === 'function' || data === undefined) {
    return undefined;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForJSON(item)).filter(item => item !== undefined);
  }
  
  // Handle objects
  if (data && typeof data === 'object' && data.constructor === Object) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const sanitizedValue = sanitizeForJSON(value);
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    }
    return sanitized;
  }
  
  // Return primitives as-is
  return data;
};

export async function writeAuditLog(entry: Omit<AuditLogEntry, 'createdAt'>): Promise<void> {
  try {
    if (!auth?.currentUser) {
      logger.warn('Kein authentifizierter Benutzer, Audit Log wird übersprungen');
      return;
    }

    const [token, tokenResult] = await Promise.all([
      auth.currentUser.getIdToken(),
      auth.currentUser.getIdTokenResult().catch(() => null),
    ]);

    const companyIdFromClaims = (tokenResult?.claims as Record<string, unknown>)?.companyId;
    let companyId = (entry.companyId && entry.companyId !== 'unknown'
      ? entry.companyId
      : typeof companyIdFromClaims === 'string'
        ? companyIdFromClaims
        : null) as string | undefined;

    if (!companyId) {
      companyId = await getCompanyIdFromAuth() || undefined;
    }

    if (!companyId) {
      companyId = extractCompanyIdFromEntry(entry.after) || extractCompanyIdFromEntry(entry.before);
    }

    if (!companyId) {
      logger.warn('Keine Company-ID verfügbar, Audit Log wird übersprungen');
      return;
    }

    // Sanitize before/after data before sending
    const sanitizedEntry = {
      ...entry,
      actorUid: auth.currentUser.uid,
      companyId,
      before: entry.before ? sanitizeForJSON(entry.before) as Record<string, unknown> : undefined,
      after: entry.after ? sanitizeForJSON(entry.after) as Record<string, unknown> : undefined,
    };

    const response = await fetch('/api/audit/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sanitizedEntry),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorCode = errorBody.code || (response.status === 503 ? ErrorCode.SERVICE_UNAVAILABLE : ErrorCode.UNKNOWN_ERROR);
      const errorMessage = errorBody.message || `HTTP ${response.status}`;
      
      // Create appropriate AppError based on status code
      const appError = new AppError(
        errorCode,
        errorMessage,
        ErrorSeverity.ERROR,
        {},
        { 
          retryable: response.status === 503 || response.status >= 500,
          originalError: new Error(`HTTP ${response.status}: ${errorMessage}`)
        }
      );
      
      throw appError;
    }
  } catch (error) {
    // Don't throw - audit logging should not break the application
    // But log the error properly with AppError
    const appError = error instanceof AppError 
      ? error 
      : createAppError(error, ErrorCode.UNKNOWN_ERROR, {});
    
    logger.error('Failed to write audit log', appError);
  }
}

const AUDIT_LOGS_COLLECTION = 'auditLogs';
const DEFAULT_LIMIT = 100;

/**
 * Abonniert Audit-Logs in Echtzeit (nur Client-seitig).
 * Gibt eine Unsubscribe-Funktion zurück.
 */
export function subscribeAuditLogs(
  options: { companyId?: string; limit?: number } | undefined,
  callback: (logs: AuditLogViewItem[]) => void
): () => void {
  const db = getDb();
  if (!db) {
    callback([]);
    return () => {};
  }
  const limitCount = options?.limit ?? DEFAULT_LIMIT;
  let q = query(
    collection(db, AUDIT_LOGS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  if (options?.companyId) {
    q = query(
      collection(db, AUDIT_LOGS_COLLECTION),
      where('companyId', '==', options.companyId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
  }
  const unsub = onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as AuditLogViewItem[];
    callback(data);
  });
  return () => unsub();
}
