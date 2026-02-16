import { z } from 'zod';

/**
 * Zod-Schemas für Template-API-Validierung
 */

export const templateChannelSchema = z.enum(['app', 'email']);

export const templateStatusSchema = z.enum(['draft', 'published']);

/**
 * Schema für Template-Erstellung (POST /api/templates)
 */
export const createTemplateSchema = z.object({
  key: z.string().min(1, 'Schlüssel ist erforderlich').trim(),
  channel: templateChannelSchema,
  name: z.string().min(1, 'Name ist erforderlich').trim(),
  description: z.string().trim().optional(),
  locale: z.string().min(1, 'Sprache ist erforderlich').trim().default('de'),
  title: z.string().trim().nullable().optional(),
  message: z.string().trim().nullable().optional(),
  subject: z.string().trim().nullable().optional(),
  bodyHtml: z.string().trim().nullable().optional(),
  actionText: z.string().trim().nullable().optional(),
  status: templateStatusSchema.default('draft'),
  tags: z.array(z.string().trim()).default([]),
  category: z.string().trim().nullable().optional(),
}).refine(
  (data) => {
    // Für App-Templates: title und message sind erforderlich
    if (data.channel === 'app') {
      return data.title && data.title.length > 0 && data.message && data.message.length > 0;
    }
    return true;
  },
  {
    message: 'Für App-Templates sind title und message erforderlich',
    path: ['title'],
  }
).refine(
  (data) => {
    // Für E-Mail-Templates: subject und bodyHtml sind erforderlich
    if (data.channel === 'email') {
      return data.subject && data.subject.length > 0 && data.bodyHtml && data.bodyHtml.length > 0;
    }
    return true;
  },
  {
    message: 'Für E-Mail-Templates sind subject und bodyHtml erforderlich',
    path: ['subject'],
  }
);

/**
 * Schema für Template-Update (PUT /api/templates/[templateId])
 */
export const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').trim().optional(),
  description: z.string().trim().optional(),
  locale: z.string().min(1, 'Sprache ist erforderlich').trim().optional(),
  title: z.string().trim().nullable().optional(),
  message: z.string().trim().nullable().optional(),
  subject: z.string().trim().nullable().optional(),
  bodyHtml: z.string().trim().nullable().optional(),
  actionText: z.string().trim().nullable().optional(),
  status: templateStatusSchema.optional(),
  tags: z.array(z.string().trim()).optional(),
  category: z.string().trim().nullable().optional(),
});

/**
 * Schema für Template-Query-Parameter (GET /api/templates)
 */
export const templateQuerySchema = z.object({
  channel: templateChannelSchema.optional(),
  status: templateStatusSchema.optional(),
  locale: z.string().trim().optional(),
  key: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

