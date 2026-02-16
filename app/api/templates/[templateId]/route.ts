import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import type { TemplateStatus } from '@/lib/types';
import { adminDb } from '@/lib/server/firebaseAdmin';
import {
  ensureChannelSpecificFields,
  getRequestContext,
  mapTemplateDoc,
  validateStatus,
} from '../utils';
import { checkRateLimit, addRateLimitHeaders } from '@/lib/middleware/rateLimit';
import { validateRequest, updateTemplateSchema } from '@/lib/validations';
import { logger } from '@/lib/errors';
import { createErrorResponse, createNotFoundErrorResponse, createValidationErrorResponse } from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const runtime = 'nodejs';

const ROUTE = '/api/templates/[templateId]';

async function loadTemplateDocument(templateId: string) {
  if (!adminDb) {
    return null;
  }
  return adminDb.collection('companyTemplates').doc(templateId).get();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const requestContext = await getRequestContext(request);

    // Rate Limiting prüfen
    const rateLimitResponse = checkRateLimit(request, requestContext.uid);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { templateId } = await context.params;
    if (!templateId) {
      return createValidationErrorResponse('Template-ID fehlt.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    const doc = await loadTemplateDocument(templateId);
    if (doc === null) {
      return createErrorResponse(createAppError(new Error('Database not initialized'), ErrorCode.SERVICE_UNAVAILABLE, { route: ROUTE }));
    }
    if (!doc.exists) {
      return createNotFoundErrorResponse('Template nicht gefunden.', ROUTE);
    }

    const data = doc.data() as Record<string, unknown>;
    if (data.companyId !== requestContext.companyId) {
      return createNotFoundErrorResponse('Template nicht gefunden.', ROUTE);
    }

    const response = NextResponse.json({ data: mapTemplateDoc(doc) });
    return addRateLimitHeaders(response, request, requestContext.uid);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    logger.error(
      'Fehler beim Laden des Templates',
      error instanceof Error ? error : undefined,
      { route: '/api/templates/[templateId]', timestamp: new Date() },
      { component: 'GET /api/templates/[templateId]' }
    );
    return createErrorResponse(createAppError(error instanceof Error ? error : new Error('Interner Serverfehler'), ErrorCode.INTERNAL_ERROR, { route: ROUTE }));
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const requestContext = await getRequestContext(request);

    // Rate Limiting prüfen
    const rateLimitResponse = checkRateLimit(request, requestContext.uid);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { templateId } = await context.params;
    if (!templateId) {
      return createValidationErrorResponse('Template-ID fehlt.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    const doc = await loadTemplateDocument(templateId);
    if (doc === null) {
      return createErrorResponse(createAppError(new Error('Database not initialized'), ErrorCode.SERVICE_UNAVAILABLE, { route: ROUTE }));
    }
    if (!doc.exists) {
      return createNotFoundErrorResponse('Template nicht gefunden.', ROUTE);
    }

    const existing = doc.data() as Record<string, unknown>;
    if (existing.companyId !== requestContext.companyId) {
      return createNotFoundErrorResponse('Template nicht gefunden.', ROUTE);
    }

    const channel = existing.channel as 'app' | 'email';

    // Request-Body validieren
    const validation = await validateRequest(request, updateTemplateSchema);
    if (!validation.success) {
      return validation.response;
    }
    const payload = validation.data;

    if ('channel' in payload && payload.channel !== channel) {
      return createValidationErrorResponse('channel kann nicht geändert werden.', ErrorCode.VALIDATION_INVALID_FORMAT, ROUTE);
    }

    if ('key' in payload && payload.key !== existing.key) {
      return createValidationErrorResponse('key kann nicht geändert werden.', ErrorCode.VALIDATION_INVALID_FORMAT, ROUTE);
    }

    const updates: Record<string, unknown> = {};
    let hasChanges = false;

    if ('name' in payload) {
      const name = typeof payload.name === 'string' ? payload.name.trim() : '';
      if (!name) {
        return createValidationErrorResponse('name darf nicht leer sein.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
      }
      updates.name = name;
      hasChanges = true;
    }

    if ('description' in payload) {
      const description =
        typeof payload.description === 'string' ? payload.description.trim() : undefined;
      updates.description = description || null;
      hasChanges = true;
    }

    if ('locale' in payload) {
      const nextLocale = typeof payload.locale === 'string' ? payload.locale.trim() : '';
      if (!nextLocale) {
        return createValidationErrorResponse('locale darf nicht leer sein.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
      }
      if (nextLocale !== existing.locale) {
        const duplicateSnapshot = await adminDb!
          .collection('companyTemplates')
          .where('companyId', '==', requestContext.companyId)
          .where('key', '==', existing.key)
          .where('channel', '==', channel)
          .where('locale', '==', nextLocale)
          .limit(1)
          .get();

        if (!duplicateSnapshot.empty) {
          return createValidationErrorResponse(
            'Template für diesen Kanal, Key und Sprache existiert bereits.',
            ErrorCode.VALIDATION_DUPLICATE_VALUE,
            ROUTE
          );
        }
      }

      updates.locale = nextLocale;
      hasChanges = true;
    }

    if ('title' in payload) {
      const nextTitle = typeof payload.title === 'string' ? payload.title : null;
      updates.title = nextTitle;
      hasChanges = true;
    }

    if ('subject' in payload) {
      const nextSubject = typeof payload.subject === 'string' ? payload.subject : null;
      updates.subject = nextSubject;
      hasChanges = true;
    }

    if ('bodyHtml' in payload) {
      const nextBodyHtml = typeof payload.bodyHtml === 'string' ? payload.bodyHtml : null;
      updates.bodyHtml = nextBodyHtml;
      hasChanges = true;
    }

    if ('message' in payload) {
      const nextMessage = typeof payload.message === 'string' ? payload.message : null;
      updates.message = nextMessage;
      hasChanges = true;
    }

    if ('actionText' in payload) {
      const nextActionText = typeof payload.actionText === 'string' ? payload.actionText : null;
      updates.actionText = nextActionText;
      hasChanges = true;
    }

    if ('tags' in payload) {
      if (!Array.isArray(payload.tags)) {
        return createValidationErrorResponse('tags muss ein Array sein.', ErrorCode.VALIDATION_INVALID_FORMAT, ROUTE);
      }
      const tags = payload.tags.filter(tag => typeof tag === 'string');
      updates.tags = tags;
      hasChanges = true;
    }

    if ('category' in payload) {
      const category = typeof payload.category === 'string' ? payload.category : null;
      updates.category = category;
      hasChanges = true;
    }

    if ('status' in payload) {
      validateStatus(payload.status);
      updates.status = (payload.status as TemplateStatus) ?? 'draft';
      hasChanges = true;
    }

    if (!hasChanges) {
      return createValidationErrorResponse('Keine Änderungen erkannt.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    // Validierung kombinierter Felder (z.B. title/message bei App)
    const effectivePayload = {
      title: updates.title ?? existing.title,
      message: updates.message ?? existing.message ?? existing.bodyText,
      subject: updates.subject ?? existing.subject,
      bodyHtml: updates.bodyHtml ?? existing.bodyHtml,
    };
    ensureChannelSpecificFields(channel, effectivePayload);

    const version = typeof existing.version === 'number' ? existing.version + 1 : 2;

    await adminDb!
      .collection('companyTemplates')
      .doc(templateId)
      .update({
        ...updates,
        version,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: requestContext.uid,
      });

    const updatedDoc = await loadTemplateDocument(templateId);
    if (updatedDoc === null || !updatedDoc.exists) {
      return createErrorResponse(createAppError(new Error('Database not initialized'), ErrorCode.SERVICE_UNAVAILABLE, { route: ROUTE }));
    }
    const response = NextResponse.json({ data: mapTemplateDoc(updatedDoc) });
    return addRateLimitHeaders(response, request, requestContext.uid);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    logger.error(
      'Fehler beim Aktualisieren des Templates',
      error instanceof Error ? error : undefined,
      { route: '/api/templates/[templateId]', timestamp: new Date() },
      { component: 'PATCH /api/templates/[templateId]' }
    );
    return createErrorResponse(createAppError(error instanceof Error ? error : new Error('Interner Serverfehler'), ErrorCode.INTERNAL_ERROR, { route: ROUTE }));
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const requestContext = await getRequestContext(request);

    // Rate Limiting prüfen
    const rateLimitResponse = checkRateLimit(request, requestContext.uid);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { templateId } = await context.params;
    if (!templateId) {
      return createValidationErrorResponse('Template-ID fehlt.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    const doc = await loadTemplateDocument(templateId);
    if (doc === null) {
      return createErrorResponse(createAppError(new Error('Database not initialized'), ErrorCode.SERVICE_UNAVAILABLE, { route: ROUTE }));
    }
    if (!doc.exists) {
      return createNotFoundErrorResponse('Template nicht gefunden.', ROUTE);
    }

    const data = doc.data() as Record<string, unknown>;
    if (data.companyId !== requestContext.companyId) {
      return createNotFoundErrorResponse('Template nicht gefunden.', ROUTE);
    }

    await adminDb!.collection('companyTemplates').doc(templateId).delete();
    const response = NextResponse.json({ success: true }, { status: 200 });
    return addRateLimitHeaders(response, request, requestContext.uid);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    logger.error(
      'Fehler beim Löschen des Templates',
      error instanceof Error ? error : undefined,
      { route: '/api/templates/[templateId]', timestamp: new Date() },
      { component: 'DELETE /api/templates/[templateId]' }
    );
    return createErrorResponse(createAppError(error instanceof Error ? error : new Error('Interner Serverfehler'), ErrorCode.INTERNAL_ERROR, { route: ROUTE }));
  }
}
