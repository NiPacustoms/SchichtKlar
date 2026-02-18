'use client';

// ARIA Labels and Accessibility Utilities

export const ariaLabels = {
  // Navigation
  mainNavigation: 'Hauptnavigation',
  breadcrumbNavigation: 'Breadcrumb-Navigation',
  skipToContent: 'Zum Hauptinhalt springen',
  
  // Actions
  edit: 'Bearbeiten',
  delete: 'Löschen',
  save: 'Speichern',
  cancel: 'Abbrechen',
  close: 'Schließen',
  open: 'Öffnen',
  search: 'Suchen',
  filter: 'Filtern',
  sort: 'Sortieren',
  export: 'Exportieren',

  // Status
  loading: 'Wird geladen',
  error: 'Fehler',
  success: 'Erfolgreich',
  warning: 'Warnung',
  info: 'Information',
  
  // Forms
  required: 'Pflichtfeld',
  optional: 'Optional',
  invalid: 'Ungültig',
  valid: 'Gültig',
  
  // Tables
  sortAscending: 'Aufsteigend sortieren',
  sortDescending: 'Absteigend sortieren',
  selectAll: 'Alle auswählen',
  selectRow: 'Zeile auswählen',
  selectColumn: 'Spalte auswählen',
  
  // Time and Date
  selectDate: 'Datum auswählen',
  selectTime: 'Zeit auswählen',
  selectMonth: 'Monat auswählen',
  selectYear: 'Jahr auswählen',
  
  // User Interface
  expand: 'Aufklappen',
  collapse: 'Zuklappen',
  showMore: 'Mehr anzeigen',
  showLess: 'Weniger anzeigen',
  toggleMenu: 'Menü umschalten',

  // File Operations
  upload: 'Hochladen',
  download: 'Herunterladen',
  preview: 'Vorschau',
  view: 'Anzeigen',
  
  // Communication
  sendMessage: 'Nachricht senden',
  reply: 'Antworten',
  forward: 'Weiterleiten',
  markAsRead: 'Als gelesen markieren',
  markAsUnread: 'Als ungelesen markieren',
  
  // Settings
  toggleSetting: 'Einstellung umschalten',
  enable: 'Aktivieren',
  disable: 'Deaktivieren',
  configure: 'Konfigurieren',
  
  // Data
  refresh: 'Aktualisieren',
  reload: 'Neu laden',
  clear: 'Löschen',
  reset: 'Zurücksetzen',
  
  // Navigation specific to JobFlow
  goToDashboard: 'Zum Dashboard',
  goToSchedule: 'Zum Dienstplan',
  goToStaff: 'Zu den Mitarbeitern',
  goToReports: 'Zu den Berichten',
  goToSettings: 'Zu den Einstellungen',
  goToProfile: 'Zum Profil',
  goToDocuments: 'Zu den Dokumenten',
  goToTimeTracking: 'Zur Zeiterfassung',
  // JobFlow specific actions
  startShift: 'Schicht beginnen',
  endShift: 'Schicht beenden',
  startBreak: 'Pause beginnen',
  endBreak: 'Pause beenden',
  acceptShift: 'Schicht annehmen',
  declineShift: 'Schicht ablehnen',
  requestShift: 'Schicht anfragen',
  assignShift: 'Schicht zuweisen',
  unassignShift: 'Schicht-Zuweisung aufheben',
  
  // Status indicators
  active: 'Aktiv',
  inactive: 'Inaktiv',
  online: 'Online',
  offline: 'Offline',
  available: 'Verfügbar',
  unavailable: 'Nicht verfügbar',
  busy: 'Beschäftigt',
  away: 'Abwesend',
  
  // Time tracking
  clockIn: 'Einchecken',
  clockOut: 'Auschecken',
  breakTime: 'Pausenzeit',
  workTime: 'Arbeitszeit',
  overtime: 'Überstunden',
  
  // Document management
  documentExpired: 'Dokument abgelaufen',
  documentExpiring: 'Dokument läuft bald ab',
  documentValid: 'Dokument gültig',
  documentPending: 'Dokument ausstehend',
  documentRejected: 'Dokument abgelehnt',
  documentApproved: 'Dokument genehmigt',
  
  // Notifications
  newNotification: 'Neue Benachrichtigung',
  notificationRead: 'Benachrichtigung gelesen',
  notificationUnread: 'Benachrichtigung ungelesen',
  
  // Charts and graphs
  chartData: 'Diagrammdaten',
  dataPoint: 'Datenpunkt',
  trendUp: 'Trend nach oben',
  trendDown: 'Trend nach unten',
  trendStable: 'Stabiler Trend',
  
  // Pagination
  goToFirstPage: 'Zur ersten Seite',
  goToLastPage: 'Zur letzten Seite',
  goToNextPage: 'Zur nächsten Seite',
  goToPreviousPage: 'Zur vorherigen Seite',
  currentPage: 'Aktuelle Seite',
  totalPages: 'Gesamtseiten',
  
  // Search and filters
  clearSearch: 'Suche löschen',
  clearFilters: 'Filter löschen',
  applyFilters: 'Filter anwenden',
  resetFilters: 'Filter zurücksetzen',
  
  // Accessibility
  screenReaderOnly: 'Nur für Bildschirmleser',
  visuallyHidden: 'Visuell versteckt',
  focusIndicator: 'Fokus-Indikator',
  keyboardShortcut: 'Tastenkürzel',
  
  // Error messages
  networkError: 'Netzwerkfehler',
  serverError: 'Serverfehler',
  validationError: 'Validierungsfehler',
  permissionError: 'Berechtigungsfehler',
  notFoundError: 'Nicht gefunden',
  timeoutError: 'Zeitüberschreitung',
  
  // Success messages
  saveSuccess: 'Erfolgreich gespeichert',
  deleteSuccess: 'Erfolgreich gelöscht',
  updateSuccess: 'Erfolgreich aktualisiert',
  createSuccess: 'Erfolgreich erstellt',
  uploadSuccess: 'Erfolgreich hochgeladen',
  downloadSuccess: 'Erfolgreich heruntergeladen'
};

// Helper function to generate ARIA labels with context
export function generateAriaLabel(baseLabel: string, context?: string): string {
  if (!context) return baseLabel;
  return `${baseLabel} - ${context}`;
}

// Helper function to create ARIA descriptions
export function createAriaDescription(description: string): string {
  return description;
}

// Helper function for form field ARIA attributes
export function getFormFieldAriaProps(
  id: string,
  label: string,
  required: boolean = false,
  invalid: boolean = false,
  describedBy?: string
) {
  return {
    id,
    'aria-label': label,
    'aria-required': required,
    'aria-invalid': invalid,
    'aria-describedby': describedBy,
    'aria-labelledby': `${id}-label`
  };
}

// Helper function for button ARIA attributes
export function getButtonAriaProps(
  label: string,
  pressed?: boolean,
  expanded?: boolean,
  controls?: string,
  describedBy?: string
) {
  return {
    'aria-label': label,
    'aria-pressed': pressed,
    'aria-expanded': expanded,
    'aria-controls': controls,
    'aria-describedby': describedBy
  };
}

// Helper function for table ARIA attributes
export function getTableAriaProps(
  caption: string,
  rowCount: number,
  columnCount: number
) {
  return {
    'aria-label': caption,
    'aria-rowcount': rowCount,
    'aria-colcount': columnCount,
    role: 'table'
  };
}

// Helper function for dialog ARIA attributes
export function getDialogAriaProps(
  title: string,
  describedBy?: string
) {
  return {
    'aria-labelledby': `${title}-title`,
    'aria-describedby': describedBy,
    role: 'dialog',
    'aria-modal': true
  };
}

export default ariaLabels;
