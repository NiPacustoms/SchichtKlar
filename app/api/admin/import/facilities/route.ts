import { NextRequest, NextResponse } from 'next/server';
import {
  adminDb,
  verifyIdToken,
  getRoleFromToken,
  getCompanyIdFromToken,
} from '@/lib/server/firebaseAdmin';
import { createAuthErrorResponse, createValidationErrorResponse } from '@/lib/errors';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

const ROUTE = '/api/admin/import/facilities';
const COLLECTION_NAME = 'facilities';

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      const parts: string[] = [];
      while (end < line.length) {
        const next = line.indexOf('"', end);
        if (next === -1) {
          parts.push(line.slice(end));
          end = line.length;
          break;
        }
        if (line[next + 1] === '"') {
          parts.push(line.slice(end, next) + '"');
          end = next + 2;
        } else {
          parts.push(line.slice(end, next));
          end = next + 1;
          break;
        }
      }
      out.push(parts.join('').trim());
      i = end;
      if (line[i] === ',') i++;
    } else {
      const comma = line.indexOf(',', i);
      const value = (comma === -1 ? line.slice(i) : line.slice(i, comma)).trim();
      out.push(value);
      i = comma === -1 ? line.length : comma + 1;
    }
  }
  return out;
}

function parseCsv(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  return lines.map(l => parseCsvLine(l));
}

const DEFAULT_COLOR = '#4CAF50';

/**
 * POST /api/admin/import/facilities
 *
 * Body: application/json mit { csv: string } oder multipart/form-data mit "file".
 * CSV: Name, Adresse, Ansprechpartner, Telefon, E-Mail, Debitornummer [, Farbe, Typ]
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);

    const decoded = await verifyIdToken(authHeader);
    if (!decoded || !adminDb) return createAuthErrorResponse('UNAUTHORIZED', ROUTE);

    const role = getRoleFromToken(decoded);
    if (role !== 'admin' && role !== 'dispatcher')
      return createAuthErrorResponse('UNAUTHORIZED', ROUTE);

    let companyId = getCompanyIdFromToken(decoded) ?? '';
    if (!companyId) {
      try {
        const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
        companyId = (userDoc.data()?.companyId as string) || '';
      } catch {
        // ignore
      }
    }
    if (!companyId) {
      return createValidationErrorResponse(
        'companyId konnte nicht ermittelt werden',
        undefined,
        ROUTE
      );
    }

    let csvRaw: string;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      if (typeof body.csv === 'string') csvRaw = body.csv;
      else
        return createValidationErrorResponse(
          'Body muss "csv" (string) enthalten',
          undefined,
          ROUTE
        );
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file || typeof file.text !== 'function') {
        return createValidationErrorResponse(
          'Formularfeld "file" (CSV-Datei) fehlt',
          undefined,
          ROUTE
        );
      }
      csvRaw = await file.text();
    } else {
      return createValidationErrorResponse(
        'Content-Type: application/json oder multipart/form-data erwartet',
        undefined,
        ROUTE
      );
    }

    const rows = parseCsv(csvRaw);
    if (rows.length === 0) {
      return NextResponse.json(
        { created: 0, errors: [{ row: 0, message: 'Keine Zeilen in der CSV-Datei' }] },
        { status: 200 }
      );
    }

    const isHeader =
      rows[0].length >= 2 &&
      (String(rows[0][0]).toLowerCase() === 'name' ||
        String(rows[0][1]).toLowerCase().includes('dresse'));
    const dataRows = isHeader ? rows.slice(1) : rows;

    const errors: { row: number; message: string }[] = [];
    let created = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = isHeader ? i + 2 : i + 1;
      const [
        name = '',
        address = '',
        contactPerson = '',
        phone = '',
        email = '',
        debtorNumber = '',
        colorCode = '',
        type = '',
      ] = row;

      const nameTrim = name.trim();
      if (!nameTrim) {
        errors.push({ row: rowNum, message: 'Name fehlt' });
        continue;
      }

      try {
        await adminDb.collection(COLLECTION_NAME).add({
          companyId,
          name: nameTrim,
          address: (address || '').trim(),
          contactPerson: (contactPerson || '').trim(),
          phone: (phone || '').trim(),
          email: (email || '').trim(),
          debtorNumber: (debtorNumber || '').trim(),
          colorCode: (colorCode || '').trim() || DEFAULT_COLOR,
          type: (type || '').trim() || undefined,
          stations: [],
          status: 'active',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        created++;
      } catch (_e) {
        const msg = _e instanceof Error ? _e.message : String(_e);
        errors.push({ row: rowNum, message: `Speichern fehlgeschlagen: ${msg}` });
      }
    }

    return NextResponse.json({ created, errors });
  } catch (_e) {
    const err = _e instanceof Error ? _e : new Error(String(_e));
    logger.error('Import facilities failed', err, { route: ROUTE });
    return NextResponse.json({ error: err.message, created: 0, errors: [] }, { status: 500 });
  }
}
