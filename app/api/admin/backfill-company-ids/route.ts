import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { requireAuthContext, HttpError } from '@/lib/server/requestContext';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

const ROUTE = '/api/admin/backfill-company-ids';

/**
 * EINMALIGE Migration: stempelt `companyId` auf alle Dokumente, denen es fehlt.
 *
 * Hintergrund: Vor der Multi-Tenancy-Umstellung wurden manche Dokumente evtl.
 * ohne companyId angelegt. Unter den neuen, strikten Client-Queries
 * (`where('companyId','==', …)`) würden solche Legacy-Dokumente nicht mehr
 * auftauchen. Diese Route setzt `companyId = <companyId des aufrufenden Admins>`
 * auf jedes Dokument OHNE companyId.
 *
 * WICHTIG: Nur ausführen, solange es genau EINEN Mandanten gibt (bzw. bevor ein
 * zweiter Mandant Daten hat) – companyId-lose Altdaten lassen sich sonst keinem
 * Mandanten mehr eindeutig zuordnen.
 *
 * Sicherheit: nur Admin (requireAuthContext), zusätzlich Bestätigung per
 * ?confirm=BACKFILL. Idempotent – berührt nur Dokumente, denen companyId fehlt.
 *
 * Aufruf (im Browser als eingeloggter Admin, DevTools-Konsole):
 *   const t = await firebase.auth().currentUser.getIdToken();
 *   await fetch('/api/admin/backfill-company-ids?confirm=BACKFILL', {
 *     method: 'POST', headers: { Authorization: `Bearer ${t}` }
 *   }).then(r => r.json());
 */
const COLLECTIONS = [
  'shifts',
  'facilities',
  'timesheets',
  'assignments',
  'documents',
  'reports',
  'employeeReports',
  'alerts',
  'notifications',
  'activities',
  'invitations',
  'adminAnnouncements',
  'limitIncreaseRequests',
  'times',
  'staffGroups',
  'users',
];

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireAuthContext(req, { role: 'admin' });
  } catch (e) {
    if (e instanceof HttpError) return e.response;
    throw e;
  }

  const { searchParams } = new URL(req.url);
  if (searchParams.get('confirm') !== 'BACKFILL') {
    return NextResponse.json(
      { message: 'Bestätigung fehlt. Aufruf mit ?confirm=BACKFILL wiederholen.' },
      { status: 400 }
    );
  }

  if (!adminDb) {
    return NextResponse.json({ message: 'DB nicht initialisiert' }, { status: 500 });
  }

  const companyId = ctx.companyId;
  const result: Record<string, number> = {};

  try {
    for (const coll of COLLECTIONS) {
      // Dokumente ohne companyId finden: '==' null trifft fehlende Felder in
      // Firestore nicht zuverlässig, daher lesen wir seitenweise und prüfen im Code.
      let updated = 0;
      let lastId: string | null = null;
      // Sicherheitsobergrenze gegen Endlosschleifen bei sehr großen Collections.
      for (let page = 0; page < 200; page++) {
        let q = adminDb.collection(coll).orderBy('__name__').limit(400);
        if (lastId) q = q.startAfter(lastId);
        const snap = await q.get();
        if (snap.empty) break;

        const batch = adminDb.batch();
        let batchCount = 0;
        for (const docSnap of snap.docs) {
          const data = docSnap.data() as Record<string, unknown>;
          const existing = data.companyId;
          if (typeof existing !== 'string' || existing.length === 0) {
            batch.update(docSnap.ref, { companyId });
            batchCount++;
          }
        }
        if (batchCount > 0) {
          await batch.commit();
          updated += batchCount;
        }
        lastId = snap.docs[snap.docs.length - 1].id;
        if (snap.size < 400) break;
      }
      result[coll] = updated;
    }

    logger.info('Backfill companyId abgeschlossen', { route: ROUTE }, { companyId, result });
    return NextResponse.json({ ok: true, companyId, updated: result });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    logger.error('Backfill companyId fehlgeschlagen', err, { route: ROUTE });
    return NextResponse.json(
      { ok: false, error: err.message, partial: result },
      { status: 500 }
    );
  }
}
