import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/server/firebaseAdmin';
import {
  ensureChannelSpecificFields,
  getRequestContext,
  mapTemplateDoc,
  validateChannel,
  validateStatus,
} from './utils';
import { checkRateLimit, addRateLimitHeaders } from '@/lib/middleware/rateLimit';
import { validateRequest, createTemplateSchema, templateQuerySchema } from '@/lib/validations';
import { logger } from '@/lib/errors';
import { createErrorResponse } from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext(request);

    // Rate Limiting prüfen
    const rateLimitResponse = checkRateLimit(request, context.uid);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Query-Parameter validieren
    const validation = await validateRequest(request, templateQuerySchema, 'query');
    if (!validation.success) {
      return validation.response;
    }
    const queryParams = validation.data;

    const channelParam = queryParams.channel;
    const statusParam = queryParams.status;
    const localeParam = queryParams.locale;
    const keyParam = queryParams.key;
    const searchParam = queryParams.search;

    let queryRef = adminDb!
      .collection('companyTemplates')
      .where('companyId', '==', context.companyId);

    if (channelParam) {
      validateChannel(channelParam);
      queryRef = queryRef.where('channel', '==', channelParam);
    }

    if (statusParam) {
      validateStatus(statusParam);
      queryRef = queryRef.where('status', '==', statusParam);
    }

    if (localeParam) {
      queryRef = queryRef.where('locale', '==', localeParam);
    }

    if (keyParam) {
      queryRef = queryRef.where('key', '==', keyParam);
    }

    const snapshot = await queryRef.orderBy('updatedAt', 'desc').limit(200).get();

    let templates = snapshot.docs.map(mapTemplateDoc);

    if (searchParam) {
      const searchLower = searchParam.toLowerCase();
      templates = templates.filter(
        template =>
          template.name.toLowerCase().includes(searchLower) ||
          template.key.toLowerCase().includes(searchLower) ||
          (template.description?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    const response = NextResponse.json({ data: templates });
    return addRateLimitHeaders(response, request, context.uid);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    logger.error(
      'Fehler beim Abrufen der Templates',
      error instanceof Error ? error : undefined,
      { route: '/api/templates', timestamp: new Date() },
      { component: 'GET /api/templates' }
    );
    return createErrorResponse(createAppError(error instanceof Error ? error : new Error('Interner Serverfehler'), ErrorCode.INTERNAL_ERROR, { route: '/api/templates' }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getRequestContext(request);

    // Rate Limiting prüfen
    const rateLimitResponse = checkRateLimit(request, context.uid);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Request-Body validieren
    const validation = await validateRequest(request, createTemplateSchema);
    if (!validation.success) {
      return validation.response;
    }
    const payload = validation.data;

    // Zusätzliche Validierung für Channel-spezifische Felder (bereits in Schema enthalten, aber für Sicherheit)
    validateChannel(payload.channel);
    validateStatus(payload.status);
    ensureChannelSpecificFields(payload.channel, payload);

    // Prüfen auf Duplikate
    const duplicateSnapshot = await adminDb!
      .collection('companyTemplates')
      .where('companyId', '==', context.companyId)
      .where('key', '==', payload.key)
      .where('channel', '==', payload.channel)
      .where('locale', '==', payload.locale)
      .limit(1)
      .get();

    if (!duplicateSnapshot.empty) {
      return NextResponse.json(
        { message: 'Template für diesen Kanal, Key und Sprache existiert bereits' },
        { status: 409 }
      );
    }

    const now = FieldValue.serverTimestamp();
    const templateData = {
      companyId: context.companyId,
      key: payload.key,
      channel: payload.channel,
      name: payload.name,
      description: payload.description || null,
      locale: payload.locale,
      title: payload.title || null,
      message: payload.message || null,
      subject: payload.subject || null,
      bodyHtml: payload.bodyHtml || null,
      actionText: payload.actionText || null,
      status: payload.status,
      version: 1,
      tags: payload.tags || [],
      category: payload.category || null,
      createdAt: now,
      createdBy: context.uid,
      updatedAt: now,
      updatedBy: context.uid,
    };

    const docRef = await adminDb!.collection('companyTemplates').add(templateData);
    const createdDoc = await docRef.get();
    const createdTemplate = mapTemplateDoc(createdDoc);

    const response = NextResponse.json({ data: createdTemplate }, { status: 201 });
    return addRateLimitHeaders(response, request, context.uid);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    logger.error(
      'Fehler beim Erstellen des Templates',
      error instanceof Error ? error : undefined,
      { route: '/api/templates', timestamp: new Date() },
      { component: 'POST /api/templates' }
    );
    return createErrorResponse(createAppError(error instanceof Error ? error : new Error('Interner Serverfehler'), ErrorCode.INTERNAL_ERROR, { route: '/api/templates' }));
  }
}
