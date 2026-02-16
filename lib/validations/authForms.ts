import { z } from 'zod';

/**
 * SOTA: Zentrale Validierungsschemas für Authentifizierung (Frontend Forms)
 * Nach Frontend-Rules: Zod + react-hook-form für alle Formulare
 * 
 * NOTE: Diese Schemas sind für Frontend-Formulare. Für API-Validierung siehe auth.ts
 */

// Login-Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse')
    .max(254, 'E-Mail-Adresse ist zu lang'),
  password: z
    .string()
    .min(1, 'Passwort ist erforderlich')
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
    .max(128, 'Passwort ist zu lang'),
});

// Registrierungs-Schema
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(100, 'Name ist zu lang')
    .regex(/^[a-zA-ZäöüÄÖÜß\s-]+$/, 'Name enthält ungültige Zeichen'),
  email: z
    .string()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse')
    .max(254, 'E-Mail-Adresse ist zu lang'),
  password: z
    .string()
    .min(1, 'Passwort ist erforderlich')
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .max(128, 'Passwort ist zu lang')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben und eine Zahl enthalten'
    ),
  confirmPassword: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

// Passwort-Reset-Schema
export const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse')
    .max(254, 'E-Mail-Adresse ist zu lang'),
});

// Passwort-Änderung-Schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: z
    .string()
    .min(1, 'Neues Passwort ist erforderlich')
    .min(8, 'Neues Passwort muss mindestens 8 Zeichen lang sein')
    .max(128, 'Neues Passwort ist zu lang')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Neues Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben und eine Zahl enthalten'
    ),
  confirmNewPassword: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Neue Passwörter stimmen nicht überein',
  path: ['confirmNewPassword'],
});

// TypeScript-Types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Utility-Funktionen für Validierung
export const validateEmail = (email: string): boolean => {
  return loginSchema.shape.email.safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return loginSchema.shape.password.safeParse(password).success;
};

// Error-Message-Mapping für Firebase-Auth-Fehler
export const firebaseAuthErrorMessages: Record<string, string> = {
  'auth/user-not-found': 'Benutzer nicht gefunden',
  'auth/wrong-password': 'Falsches Passwort',
  'auth/invalid-email': 'Ungültige E-Mail-Adresse',
  'auth/user-disabled': 'Benutzerkonto wurde deaktiviert',
  'auth/too-many-requests': 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte versuchen Sie es später erneut',
  'auth/network-request-failed': 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung',
  'auth/invalid-credential': 'Ungültige Anmeldedaten',
  'auth/email-already-in-use': 'E-Mail-Adresse wird bereits verwendet',
  'auth/weak-password': 'Passwort ist zu schwach',
  'auth/operation-not-allowed': 'Anmeldung ist derzeit nicht erlaubt',
  'auth/requires-recent-login': 'Bitte melden Sie sich erneut an, um diese Aktion durchzuführen',
};

