/**
 * Zentrale Export-Datei für alle Zod-Validierungsschemas
 */

export * from './templates';
export * from './chat';
export * from './admin';
export * from './auth';
export * from './authForms'; // Frontend-Form-Schemas (Login, Register, Password)
export * from './invitations';
export * from './forms';
export * from './staff';

/**
 * Helper-Funktion für Request-Validierung
 */
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export async function validateRequest<T extends z.ZodType>(
  request: NextRequest,
  schema: T,
  source: 'body' | 'query' = 'body'
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
  try {
    let rawData: unknown;

    if (source === 'body') {
      rawData = await request.json().catch(() => null);
      if (!rawData || typeof rawData !== 'object') {
        return {
          success: false,
          response: NextResponse.json(
            { message: 'Ungültiger Request-Body' },
            { status: 400 }
          ),
        };
      }
    } else {
      const searchParams = request.nextUrl.searchParams;
      rawData = Object.fromEntries(searchParams.entries());
    }

    const result = schema.safeParse(rawData);

    if (!result.success) {
      const errors = result.error.issues.map((err: z.ZodIssue) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        response: NextResponse.json(
          {
            message: 'Validierungsfehler',
            errors,
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        {
          message: 'Fehler bei der Request-Validierung',
          error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        },
        { status: 400 }
      ),
    };
  }
}

