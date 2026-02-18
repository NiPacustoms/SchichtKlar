import { NextRequest, NextResponse } from 'next/server';
import {
  adminDb,
  verifyIdToken,
  getRoleFromToken,
  getCompanyIdFromToken,
} from '@/lib/server/firebaseAdmin';
import {
  createAuthErrorResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from '@/lib/errors';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

const ROUTE = '/api/admin/import/employees';

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

function normalizeRole(value: string): 'nurse' | 'admin' | 'dispatcher' | null {
  const v = value.trim().toLowerCase();
  if (v === 'nurse' || v === 'mitarbeiter' || v === 'pflege') return 'nurse';
  if (v === 'admin' || v === 'administrator') return 'admin';
  if (v === 'dispatcher' || v === 'disponent') return 'dispatcher';
  return null;
}

function normalizeActive(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v === 'ja' || v === 'yes' || v === 'true' || v === '1' || v === 'x') return true;
  if (v === 'nein' || v === 'no' || v === 'false' || v === '0' || v === '') return false;
  return true;
}

/**
 * POST /api/admin/import/employees
 *
 * Body: multipart/form-data mit Feld "file" (CSV) ODER application/json mit { csv: string }.
 * CSV-Format: Name, E-Mail, Telefon, Jobtitel, Rolle, Aktiv, Gruppe (Header optional, wird übersprungen wenn erste Zeile = CSV_HEADER).
 *
 * Erstellt nur Firestore-Benutzerdokumente (keine Firebase-Auth-Accounts). companyId wird vom Aufrufer übernommen.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const decoded = await verifyIdToken(authHeader);
    if (!decoded || !adminDb) {
      return createAuthErrorResponse('UNAUTHORIZED', ROUTE);
    }

    const role = getRoleFromToken(decoded);
    if (role !== 'admin' && role !== 'dispatcher') {
      return createAuthErrorResponse('UNAUTHORIZED', ROUTE);
    }

    let companyId = getCompanyIdFromToken(decoded) ?? '';
    if (!companyId) {
      try {
        const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
        const userData = userDoc.data();
        companyId = (userData?.companyId as string) || '';
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
      if (typeof body.csv === 'string') {
        csvRaw = body.csv;
      } else if (Array.isArray(body.rows) && body.rows.length > 0) {
        csvRaw = body.rows
          .map((row: string[] | unknown) => (Array.isArray(row) ? row.map(String).join(',') : ''))
          .join('\n');
      } else {
        return createValidationErrorResponse(
          'Body muss "csv" (string) oder "rows" (string[][]) enthalten',
          undefined,
          ROUTE
        );
      }
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
      (rows[0][0]?.toLowerCase() === 'name' || rows[0][1]?.toLowerCase().includes('mail'));
    const dataRows = isHeader ? rows.slice(1) : rows;

    const errors: { row: number; message: string }[] = [];
    let created = 0;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = isHeader ? i + 2 : i + 1;
      const [
        name = '',
        email = '',
        phone = '',
        jobTitle = '',
        roleStr = '',
        activeStr = '',
        group = '',
      ] = row;

      const emailTrim = email.trim();
      if (!emailTrim) {
        errors.push({ row: rowNum, message: 'E-Mail fehlt' });
        continue;
      }
      if (!emailRegex.test(emailTrim)) {
        errors.push({ row: rowNum, message: `Ungültige E-Mail: ${emailTrim}` });
        continue;
      }

      const roleNorm = normalizeRole(roleStr);
      if (roleNorm === null && roleStr.trim() !== '') {
        errors.push({
          row: rowNum,
          message: `Ungültige Rolle: ${roleStr} (erlaubt: Mitarbeiter, Admin, Disponent)`,
        });
        continue;
      }
      const finalRole = roleNorm ?? 'nurse';

      const displayName = (name || emailTrim.split('@')[0] || 'Unbekannt').trim();

      try {
        const snapshot = await adminDb
          .collection('users')
          .where('email', '==', emailTrim)
          .limit(1)
          .get();
        if (!snapshot.empty) {
          errors.push({ row: rowNum, message: `E-Mail bereits vergeben: ${emailTrim}` });
          continue;
        }
      } catch (_e) {
        logger.warn(
          'Import: Prüfung E-Mail-Duplikat fehlgeschlagen',
          {},
          { email: emailTrim, err: _e }
        );
      }

      try {
        await adminDb.collection('users').add({
          email: emailTrim,
          displayName,
          role: finalRole,
          jobTitle: (jobTitle || '').trim(),
          group: (group || '').trim(),
          phone: (phone || '').trim(),
          qualifications: [],
          documents: [],
          active: normalizeActive(activeStr),
          companyId,
          notificationSettings: {
            emailNotifications: true,
            pushNotifications: true,
            shiftReminders: true,
            documentExpiry: true,
            systemAnnouncements: true,
          },
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
    logger.error('Import employees failed', err, { route: ROUTE }, { component: 'POST /api/admin/import/employees' });
    return createErrorResponse(createAppError(err, ErrorCode.INTERNAL_ERROR, { route: ROUTE }));
  }
}
