/**
 * Zentrale Branding-Konstanten (Single Source of Truth für Logo & App-Namen).
 * Für alle Stellen, die ein Fallback-Logo oder den App-Namen brauchen
 * (UI-Komponenten, PDF-Generierung, SSR).
 */

/** Öffentlicher Pfad zum Standard-App-Logo (Fallback, wenn kein Firmenlogo gesetzt ist). */
export const DEFAULT_APP_LOGO_URL = '/logo.svg';

/** Anzeigename der App, wenn kein Firmenname in den Einstellungen gesetzt ist. */
export const DEFAULT_APP_NAME = 'Schichtklar';

/**
 * Zentrale Marken-/Produktkonfiguration (Single Source of Truth).
 * Sichtbare Produktbezeichnungen ausschließlich von hier beziehen.
 */
export const branding = {
  /** Offizieller Produktname (sichtbar). */
  appName: 'Schichtklar',
  /** Kleinschreibung für URL-/technik-nahe Darstellung. */
  appNameLowercase: 'schichtklar',
  /** Kurzname (z. B. PWA short_name). */
  appShortName: 'Schichtklar',
  /** Produktbeschreibung (SEO/Manifest/Onboarding). */
  appDescription:
    'Einsatzplanung, Zeiterfassung und digitale Nachweise für moderne Personaldienstleister.',
} as const;

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
