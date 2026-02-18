/**
 * Einheitliche Logik: Wann eine Schicht als "beendet" gilt und wie der Status angezeigt wird.
 * Eine Schicht ist beendet, wenn ihr Datum + Endzeit in der Vergangenheit liegen.
 */

export type ShiftDisplayStatus = 'open' | 'filled' | 'cancelled' | 'ended';

export interface ShiftLike {
  date: string | Date;
  endTime?: string;
  status?: 'open' | 'filled' | 'cancelled';
}

/**
 * Errechnet das End-Datum/Zeit der Schicht (gleicher Tag + endTime) in lokaler Zeit.
 * Falls endTime fehlt, wird 23:59:59 angenommen.
 */
function getShiftEndDate(shift: ShiftLike): Date {
  const d = typeof shift.date === 'string' ? new Date(shift.date) : shift.date;
  const date = d instanceof Date && !Number.isNaN(d.getTime()) ? d : new Date();
  const endTime = shift.endTime?.trim() || '23:59';
  const [hours = 23, minutes = 59] = endTime.split(':').map(Number);
  const end = new Date(date);
  end.setHours(hours, minutes, 59, 999);
  return end;
}

/**
 * true, wenn die Schicht (Datum + Endzeit) in der Vergangenheit liegt.
 */
export function isShiftEnded(shift: ShiftLike): boolean {
  return getShiftEndDate(shift).getTime() < Date.now();
}

/**
 * Anzeige-Status: 'ended' wenn zeitlich vorbei, sonst der gespeicherte status.
 */
export function getShiftDisplayStatus(shift: ShiftLike): ShiftDisplayStatus {
  if (isShiftEnded(shift)) return 'ended';
  const s = shift.status;
  return s === 'open' || s === 'filled' || s === 'cancelled' ? s : 'open';
}

/**
 * Deutsche Bezeichnung für die Anzeige (einheitlich in der ganzen App).
 */
export function getShiftStatusLabel(displayStatus: ShiftDisplayStatus): string {
  switch (displayStatus) {
    case 'open':
      return 'Offen';
    case 'filled':
      return 'Besetzt';
    case 'cancelled':
      return 'Abgesagt';
    case 'ended':
      return 'Beendet';
    default:
      return 'Offen';
  }
}
