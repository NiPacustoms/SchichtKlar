'use server';
import { logger } from '@/lib/logging';

/**
 * Server Action: Cloud Function createWithMatching aufrufen.
 * Umgeht die API-Route (Browser-POST liefert hier 404, Server Action nicht).
 */
export type CreateAssignmentPayload = {
  facilityId: string;
  companyId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  qualification?: string;
  hours?: number;
  limit?: number;
  selectedUserIds?: string[];
};

export type CreateAssignmentResult = {
  success: boolean;
  assignmentId: string;
  candidateCount: number;
};

/** Rückgabe: Erfolg mit Daten oder Fehler als String – kein Throw, damit kein 500. */
export type CreateAssignmentActionResult =
  | { ok: true; data: CreateAssignmentResult }
  | { ok: false; error: string };

function getProjectId(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    ''
  );
}

export async function createAssignmentWithMatchingAction(
  payload: CreateAssignmentPayload,
  idToken: string
): Promise<CreateAssignmentActionResult> {
  if (!idToken) {
    return { ok: false, error: 'Nicht angemeldet' };
  }

  const projectId = getProjectId();
  if (!projectId) {
    logger.error('[createAssignmentWithMatchingAction] Firebase project ID not configured');
    return { ok: false, error: 'Firebase-Projekt nicht konfiguriert' };
  }

  const cfUrl = `https://us-central1-${projectId}.cloudfunctions.net/createWithMatching`;

  let res: Response;
  try {
    res = await fetch(cfUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ data: payload }),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('[createAssignmentWithMatchingAction] fetch failed', message, e);
    return { ok: false, error: `Verbindung zur Cloud Function fehlgeschlagen: ${message}` };
  }

  const raw = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    if (!res.ok) {
      const errMsg =
        res.status === 404
          ? 'Cloud Function „createWithMatching“ nicht gefunden (404). Bitte prüfen: Ist die Function deployed? Stimmt die Firebase-Projekt-ID?'
          : res.statusText || raw.slice(0, 200) || 'Ungültige Antwort';
      return { ok: false, error: errMsg };
    }
  }

  const err = json.error as { status?: string; message?: string } | undefined;
  if (err && typeof err === 'object') {
    const message = String(err.message ?? 'Cloud Function Fehler');
    if (err.status === 'unauthenticated') return { ok: false, error: 'Nicht angemeldet' };
    if (err.status === 'permission-denied')
      return { ok: false, error: 'Nur Admins dürfen Einsätze erstellen' };
    if (err.status === 'invalid-argument') return { ok: false, error: message };
    return { ok: false, error: message };
  }

  if (!res.ok) {
    const msg =
      res.status === 404
        ? 'Cloud Function „createWithMatching“ nicht gefunden (404). Bitte prüfen: Ist die Function deployed? Stimmt die Firebase-Projekt-ID?'
        : ((json.error as { message?: string } | undefined)?.message ?? res.statusText);
    return { ok: false, error: String(msg || 'Fehler beim Erstellen des Einsatzes') };
  }

  const result = json.result as
    | {
        success?: boolean;
        assignmentId?: string;
        candidateUserIds?: string[];
        candidateCount?: number;
      }
    | undefined;

  if (!result) {
    return { ok: false, error: 'Ungültige Antwort von createWithMatching' };
  }

  return {
    ok: true,
    data: {
      success: result.success ?? false,
      assignmentId: String(result.assignmentId ?? ''),
      candidateCount:
        result.candidateCount ??
        (Array.isArray(result.candidateUserIds) ? result.candidateUserIds.length : 0),
    },
  };
}
