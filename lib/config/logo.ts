/**
 * Zentrale Logo-Konfiguration für die App.
 * Alle Logo- und Favicon-Pfade werden hier verwaltet (Single Source of Truth).
 */

/** Fallback-App-Logo, wenn kein Firmenlogo (companyLogo) gesetzt ist. URL-sicher, kein Sonderzeichen. */
export const DEFAULT_APP_LOGO = '/logo-default.png';

/** App-Name für Alt-Texte und Fallbacks */
export const APP_NAME = 'JobFlow';

/**
 * Gibt die anzuzeigende Logo-URL zurück: Firmenlogo oder Fallback.
 * @param companyLogo - Optional: vom Branding hochgeladenes Logo
 */
export function getAppLogoUrl(companyLogo?: string | null): string {
  return companyLogo && companyLogo.trim() !== '' ? companyLogo : DEFAULT_APP_LOGO;
}

/**
 * Alt-Text für das App-Logo (Barrierefreiheit).
 */
export function getAppLogoAlt(companyName?: string | null): string {
  return (companyName && companyName.trim() !== '' ? companyName : APP_NAME) + ' Logo';
}

/** Favicon/App-Icons: einheitlich aus /icons/ für PWA, Notifications und Layout. */
export const LOGO_ICONS = {
  /** Browser-Tab, Favicon */
  favicon: '/favicon.svg',
  faviconIco: '/favicon.ico',
  /** Größen für metadata.icons und Legacy */
  size32: '/favicon-32.png',
  size96: '/favicon-96.png',
  /** PWA & Push-Notifications (einheitlich mit manifest) */
  size192: '/icons/icon-192x192.png',
  size512: '/icons/icon-512x512.png',
} as const;
