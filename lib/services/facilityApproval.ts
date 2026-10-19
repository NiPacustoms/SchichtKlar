import { httpsCallable } from 'firebase/functions';
import { getFunctionsEU } from '@/lib/firebase';

/** Ein Dienst, wie ihn die Einrichtung über den Freigabe-Link sieht */
export interface ApprovalEntry {
  id: string;
  person: string;
  day: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  breakMinutes: number;
  totalHours: number;
  station: string | null;
  status: 'open' | 'approved';
  signerName: string | null;
}

export interface ApprovalView {
  facilityName: string;
  companyName: string;
  from: string;
  to: string;
  expiresAt: string;
  entries: ApprovalEntry[];
}

export interface CreatedLink {
  token: string;
  expiresAt: string;
  pending: number;
  facilityEmail: string | null;
  facilityContact: string | null;
}

function fn<I, O>(name: string) {
  const f = getFunctionsEU();
  if (!f) throw new Error('Verbindung zum Server nicht verfügbar.');
  return httpsCallable<I, O>(f, name);
}

/** Verständliche Meldung aus einem Callable-Fehler */
export function approvalErrorMessage(e: unknown): string {
  const msg = (e as { message?: string })?.message || '';
  return msg && !/^internal$/i.test(msg) ? msg : 'Das hat nicht geklappt. Bitte später erneut versuchen.';
}

export const facilityApprovalService = {
  async createLink(facilityId: string, from: string, to: string): Promise<CreatedLink> {
    return (await fn<{ facilityId: string; from: string; to: string }, CreatedLink>('createFacilityApprovalLink')({ facilityId, from, to })).data;
  },
  async revoke(token: string): Promise<void> {
    await fn<{ token: string }, { ok: boolean }>('revokeFacilityApprovalLink')({ token });
  },
  async get(token: string): Promise<ApprovalView> {
    return (await fn<{ token: string }, ApprovalView>('getFacilityApproval')({ token })).data;
  },
  async decide(input: {
    token: string;
    signerName: string;
    signerRole?: string;
    approveIds: string[];
    rejections: { id: string; reason: string }[];
    confirm: true;
  }): Promise<{ approved: number; rejected: number; skipped: number }> {
    return (await fn<typeof input, { approved: number; rejected: number; skipped: number }>('decideFacilityApproval')(input)).data;
  },
  /** Vollständiger Link zum Teilen */
  urlFor(token: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/freigabe/${token}`;
  },
};
