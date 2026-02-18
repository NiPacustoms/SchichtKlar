/**
 * Definierte Berechtigungen für benutzerdefinierte Rollen.
 * Admins können in den Einstellungen Rollen anlegen und diese Berechtigungen zuweisen.
 */

export interface PermissionOption {
  key: string;
  label: string;
  group: string;
}

/** Gruppierte Berechtigungen für die App (Admin-Bereich) */
export const PERMISSION_OPTIONS: PermissionOption[] = [
  // Zugang & Übersicht
  { key: 'access_admin_area', label: 'Admin-Bereich betreten', group: 'Zugang' },
  { key: 'view_dashboard', label: 'Übersicht / Dashboard ansehen', group: 'Zugang' },
  // Schichten & Dienstplan
  { key: 'view_shifts', label: 'Schichten ansehen', group: 'Dienstplan' },
  { key: 'manage_shifts', label: 'Schichten erstellen & bearbeiten', group: 'Dienstplan' },
  // Einsätze
  { key: 'view_assignments', label: 'Einsätze ansehen', group: 'Einsätze' },
  { key: 'manage_assignments', label: 'Einsätze erstellen & zuweisen', group: 'Einsätze' },
  // Mitarbeiter
  { key: 'view_staff', label: 'Mitarbeiter ansehen', group: 'Mitarbeiter' },
  { key: 'manage_staff', label: 'Mitarbeiter anlegen & bearbeiten', group: 'Mitarbeiter' },
  // Einrichtungen
  { key: 'view_facilities', label: 'Einrichtungen ansehen', group: 'Einrichtungen' },
  { key: 'manage_facilities', label: 'Einrichtungen verwalten', group: 'Einrichtungen' },
  // Zeiterfassung & Stunden
  { key: 'view_timesheets', label: 'Zeiterfassung / Stunden ansehen', group: 'Zeiterfassung' },
  { key: 'manage_timesheets', label: 'Zeiterfassung bearbeiten', group: 'Zeiterfassung' },
  // Berichte
  { key: 'view_reports', label: 'Berichte ansehen', group: 'Berichte' },
  { key: 'manage_reports', label: 'Geplante Berichte verwalten', group: 'Berichte' },
  // Dokumente
  { key: 'view_documents', label: 'Dokumente ansehen', group: 'Dokumente' },
  { key: 'manage_documents', label: 'Dokumentvorlagen verwalten', group: 'Dokumente' },
  // Einstellungen & System
  { key: 'manage_settings', label: 'Einstellungen verwalten (Rollen, Dokumenttypen, …)', group: 'System' },
  { key: 'manage_branding', label: 'Branding (Logo, Firmenname) verwalten', group: 'System' },
  { key: 'data_export', label: 'Datenexport (DSGVO) auslösen', group: 'System' },
  { key: 'data_deletion', label: 'Datenlöschung auslösen', group: 'System' },
];

/** Alle Berechtigungs-Keys (z. B. für Validierung) */
export const PERMISSION_KEYS = PERMISSION_OPTIONS.map(p => p.key);

/** Eindeutige Gruppen in Reihenfolge */
export const PERMISSION_GROUPS = Array.from(
  new Set(PERMISSION_OPTIONS.map(p => p.group))
);
