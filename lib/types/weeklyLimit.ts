/**
 * Wochenstunden-Limit (Pflege Compliance)
 * Zeitarbeit: max. Wochenstunden pro Mitarbeiter, Status und Genehmigungen.
 */

export type WeeklyLimitStatus = 'normal' | 'warning' | 'blocked';

export interface WeeklyLimitGenehmigung {
  adminId: string;
  neuesLimit: number;
  datum: Date;
}

export interface WeeklyLimit {
  mitarbeiterId: string;
  wochenstundenLimit: number;
  aktuelleWochenstunden: number;
  status: WeeklyLimitStatus;
  ueberschreitung: number;
  limitGenehmigungen?: WeeklyLimitGenehmigung[];
}

/** Rohdaten auf users/{id} (Firestore) */
export interface WeeklyLimitUserFields {
  wochenstundenLimit?: number;
  aktuelleWochenstunden?: number;
  limitStatus?: WeeklyLimitStatus;
  limitGenehmigungen?: WeeklyLimitGenehmigung[];
}
