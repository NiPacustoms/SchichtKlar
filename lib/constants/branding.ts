/**
 * Zentrale Branding-Konstanten (Single Source of Truth für Logo & App-Namen).
 * Für alle Stellen, die ein Fallback-Logo oder den App-Namen brauchen
 * (UI-Komponenten, PDF-Generierung, SSR).
 */

/** Öffentlicher Pfad zum Standard-App-Logo (Fallback, wenn kein Firmenlogo gesetzt ist). */
export const DEFAULT_APP_LOGO_URL = '/logo.svg';

/** Anzeigename der App, wenn kein Firmenname in den Einstellungen gesetzt ist. */
export const DEFAULT_APP_NAME = 'JobFlow';

/**
 * Ermittelt die effektive Logo-URL: Firmenlogo oder Fallback.
 * Nutzbar in nicht-React-Kontexten (z. B. documentGeneration).
 */
export function getEffectiveLogoUrl(companyLogo?: string | null): string {
  return companyLogo?.trim() || DEFAULT_APP_LOGO_URL;
}

/**
 * Ermittelt den effektiven Anzeigenamen: Firmenname oder Fallback.
 */
export function getEffectiveAppName(companyName?: string | null): string {
  return companyName?.trim() || DEFAULT_APP_NAME;
}
