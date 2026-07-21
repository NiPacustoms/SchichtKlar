import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Message } from '@/lib/types';

/** WhatsApp-Zeitformat für die Chat-Liste: heute → Uhrzeit, gestern → „Gestern", sonst Datum. */
export function formatListTime(date: Date): string {
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Gestern';
  return format(date, 'dd.MM.yyyy', { locale: de });
}

/** Beschriftung der Datums-Chips im Gesprächsverlauf. */
export function formatDayChip(date: Date): string {
  if (isToday(date)) return 'Heute';
  if (isYesterday(date)) return 'Gestern';
  return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
}

export interface MessageGroup {
  day: Date;
  messages: Message[];
}

/** Nachrichten nach Kalendertag gruppieren (für Datums-Trenner). */
export function groupMessagesByDay(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  messages.forEach(m => {
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.day, m.createdAt)) {
      last.messages.push(m);
    } else {
      groups.push({ day: m.createdAt, messages: [m] });
    }
  });
  return groups;
}

/** Initialen für Avatare (max. 2 Zeichen). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]!.toUpperCase())
    .join('');
}

/** Deterministische Avatar-Farbe aus Theme-Token-Namen (keine rohen Hex-Werte). */
const AVATAR_COLORS = ['primary.main', 'secondary.main', 'success.main', 'info.main', 'warning.main'] as const;

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
