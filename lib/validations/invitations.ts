import { z } from 'zod';

/**
 * Zod-Schemas für Invitation-API-Validierung
 */

/**
 * Schema für Einladung erstellen (POST /api/invitations)
 */
export const createInvitationSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  role: z.enum(['employee', 'dispatcher', 'admin']),
  facilityIds: z.array(z.string()).optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

/**
 * Schema für Einladung-Query (GET /api/invitations)
 */
export const invitationsQuerySchema = z.object({
  status: z.enum(['pending', 'accepted', 'expired']).optional(),
  role: z.enum(['employee', 'dispatcher', 'admin']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).optional().default(50),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0)).optional().default(0),
});

