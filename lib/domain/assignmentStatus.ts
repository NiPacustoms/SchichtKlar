/**
 * Einsatz-Status: Bezeichnung, Farbton und Gruppe für die Oberfläche.
 * Eine Quelle für alle Listen, Filter und Badges – vorher wurden mehrere
 * reale Status ('assigned', 'requested', 'pending-signature', 'published')
 * als „Unbekannt“ angezeigt.
 */

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

/** Arbeitsgruppen, nach denen die Disposition filtert. */
export type AssignmentGroup = 'open' | 'planned' | 'signature' | 'done' | 'declined';

interface StatusMeta {
  label: string;
  tone: StatusTone;
  group: AssignmentGroup;
}

const STATUS: Record<string, StatusMeta> = {
  published: { label: 'Ausgeschrieben', tone: 'info', group: 'open' },
  requested: { label: 'Angefragt', tone: 'info', group: 'open' },
  pending: { label: 'Wartet auf Zusage', tone: 'warning', group: 'open' },
  assigned: { label: 'Zugewiesen', tone: 'neutral', group: 'planned' },
  accepted: { label: 'Bestätigt', tone: 'success', group: 'planned' },
  'pending-signature': { label: 'Unterschrift fehlt', tone: 'warning', group: 'signature' },
  completed: { label: 'Abgeschlossen', tone: 'neutral', group: 'done' },
  done: { label: 'Abgeschlossen', tone: 'neutral', group: 'done' },
  declined: { label: 'Abgelehnt', tone: 'error', group: 'declined' },
  cancelled: { label: 'Storniert', tone: 'error', group: 'declined' },
};

export const ASSIGNMENT_GROUPS: Array<{ key: AssignmentGroup; label: string }> = [
  { key: 'open', label: 'Offen' },
  { key: 'planned', label: 'Geplant' },
  { key: 'signature', label: 'Unterschrift fehlt' },
  { key: 'done', label: 'Abgeschlossen' },
  { key: 'declined', label: 'Abgelehnt' },
];

export function assignmentStatusMeta(status: string | undefined | null): StatusMeta {
  return (status && STATUS[status]) || { label: status ? status : 'Ohne Status', tone: 'neutral', group: 'open' };
}

export function assignmentStatusLabel(status: string | undefined | null): string {
  return assignmentStatusMeta(status).label;
}

/** MUI-Farbe für Chips. */
export function assignmentStatusColor(
  status: string | undefined | null
): 'default' | 'info' | 'success' | 'warning' | 'error' {
  const tone = assignmentStatusMeta(status).tone;
  return tone === 'neutral' ? 'default' : tone;
}
