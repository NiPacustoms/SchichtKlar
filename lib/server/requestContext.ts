import { adminDb, verifyIdToken } from '@/lib/server/firebaseAdmin';

/**
 * Authentifizierter Request-Kontext für API-Routen.
 *
 * companyId ist die maßgebliche Mandanten-Kennung des Aufrufers. Sie wird
 * aus dem Firestore-User-Dokument gelesen (autoritativ, immer aktuell) und
 * fällt bei Bedarf auf den Token-Claim zurück. Niemals eine Konstante.
 */
export type AuthContext = {
  uid: string;
  email?: string;
  role: string;
  companyId: string;
};

/** Wird geworfen, wenn der Request nicht erfüllt werden kann; enthält eine fertige Response. */
export class HttpError extends Error {
  response: Response;
  constructor(status: number, message: string) {
    super(message);
    this.response = new Response(JSON.stringify({ message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

type RequireOptions = {
  /** Wenn gesetzt, muss der Aufrufer diese Rolle haben (sonst 403). */
  role?: 'admin';
};

/**
 * Verifiziert das Bearer-Token, lädt das User-Dokument und liefert einen
 * garantiert mandantengebundenen Kontext. Wirft HttpError (mit fertiger
 * Response) bei fehlender Auth / fehlendem Unternehmen / fehlender Rolle.
 *
 * Verwendung in Routen:
 *   try { const ctx = await requireAuthContext(req, { role: 'admin' }); ... }
 *   catch (e) { if (e instanceof HttpError) return e.response; throw e; }
 */
export async function requireAuthContext(
  request: Request,
  options: RequireOptions = {}
): Promise<AuthContext> {
  const authHeader = request.headers.get('authorization') || undefined;
  const decoded = await verifyIdToken(authHeader);
  if (!decoded) {
    throw new HttpError(401, 'Nicht authentifiziert.');
  }
  if (!adminDb) {
    throw new HttpError(500, 'Datenbank nicht initialisiert.');
  }

  const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
  const userData = (userSnap.exists ? userSnap.data() : undefined) as
    | Record<string, unknown>
    | undefined;

  const decodedRecord = decoded as Record<string, unknown>;
  const claimCustom = (decodedRecord.customClaims ?? {}) as Record<string, unknown>;

  const docRole = typeof userData?.role === 'string' ? (userData.role as string) : undefined;
  const claimRole =
    typeof decodedRecord.role === 'string'
      ? (decodedRecord.role as string)
      : typeof claimCustom.role === 'string'
        ? (claimCustom.role as string)
        : undefined;
  const role = claimRole || docRole;
  if (!role) {
    throw new HttpError(403, 'Keine Rolle zugeordnet.');
  }
  if (options.role && role !== options.role) {
    throw new HttpError(403, 'Keine Berechtigung.');
  }

  const docCompanyId =
    typeof userData?.companyId === 'string' ? (userData.companyId as string) : undefined;
  const claimCompanyId =
    typeof decodedRecord.companyId === 'string'
      ? (decodedRecord.companyId as string)
      : typeof claimCustom.companyId === 'string'
        ? (claimCustom.companyId as string)
        : undefined;
  const companyId = docCompanyId || claimCompanyId;
  if (!companyId) {
    throw new HttpError(400, 'Kein Unternehmen zugeordnet.');
  }

  return {
    uid: decoded.uid,
    email: typeof decoded.email === 'string' ? decoded.email : undefined,
    role,
    companyId,
  };
}
