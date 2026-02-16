import { z } from 'zod';

/**
 * Zod-Schemas für Auth-API-Validierung
 */

/**
 * Schema für Admin-Registrierung (POST /api/auth/register-admin)
 * Hinweis: uid kommt aus Token, nicht aus Body
 */
export const registerAdminSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse').optional(),
  companyName: z.string().min(1, 'Firmenname ist erforderlich').trim(),
  displayName: z.string().min(1, 'Anzeigename ist erforderlich').trim().optional(),
  firstName: z.string().min(1, 'Vorname ist erforderlich').trim().optional(),
  lastName: z.string().min(1, 'Nachname ist erforderlich').trim().optional(),
  // Für Rückwärtskompatibilität: firstName/lastName oder displayName
}).refine(
  (data) => data.displayName || (data.firstName && data.lastName) || data.email,
  {
    message: 'displayName oder firstName/lastName oder email ist erforderlich',
    path: ['displayName'],
  }
);

/**
 * Schema für Einladung annehmen (POST /api/auth/accept-invite)
 */
export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token ist erforderlich'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  firstName: z.string().min(1, 'Vorname ist erforderlich').trim().optional(),
  lastName: z.string().min(1, 'Nachname ist erforderlich').trim().optional(),
});

