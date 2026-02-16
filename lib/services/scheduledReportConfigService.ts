import { auth } from '@/lib/firebase';
import type {
  ScheduledReportConfig,
  ScheduledReportConfigCreate,
  ScheduledReportConfigUpdate,
} from '@/lib/types/scheduledReportConfig';
import { createAppError, ErrorCode } from '@/lib/errors';

/** Beim Anlegen setzt die API companyId aus dem Token; vom Client nicht mitsenden. */
export type ScheduledReportConfigCreateInput = Omit<ScheduledReportConfigCreate, 'companyId'>;

const BASE = '/api/admin/scheduled-reports';

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) {
    throw createAppError(new Error('Nicht angemeldet'), ErrorCode.AUTH_REQUIRED, { component: 'scheduledReportConfigService', action: 'getAuthHeaders' });
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const scheduledReportConfigService = {
  async list(): Promise<ScheduledReportConfig[]> {
    const res = await fetch(BASE, { headers: await getAuthHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw createAppError(new Error((data as { message?: string }).message || 'Fehler beim Laden'), ErrorCode.INTERNAL_ERROR, { component: 'scheduledReportConfigService', action: 'list' });
    }
    const data = (await res.json()) as { items: ScheduledReportConfig[] };
    return data.items ?? [];
  },

  async getById(configId: string): Promise<ScheduledReportConfig | null> {
    const res = await fetch(`${BASE}/${configId}`, { headers: await getAuthHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw createAppError(new Error((data as { message?: string }).message || 'Fehler beim Laden'), ErrorCode.INTERNAL_ERROR, { component: 'scheduledReportConfigService', action: 'getById' });
    }
    return (await res.json()) as ScheduledReportConfig;
  },

  async create(payload: ScheduledReportConfigCreateInput): Promise<{ id: string }> {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw createAppError(new Error((data as { message?: string }).message || 'Fehler beim Anlegen'), ErrorCode.INTERNAL_ERROR, { component: 'scheduledReportConfigService', action: 'create' });
    }
    return { id: (data as { id: string }).id };
  },

  async update(configId: string, payload: ScheduledReportConfigUpdate): Promise<void> {
    const res = await fetch(`${BASE}/${configId}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw createAppError(new Error((data as { message?: string }).message || 'Fehler beim Aktualisieren'), ErrorCode.INTERNAL_ERROR, { component: 'scheduledReportConfigService', action: 'update' });
    }
  },

  async delete(configId: string): Promise<void> {
    const res = await fetch(`${BASE}/${configId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw createAppError(new Error((data as { message?: string }).message || 'Fehler beim Löschen'), ErrorCode.INTERNAL_ERROR, { component: 'scheduledReportConfigService', action: 'delete' });
    }
  },

  /** Geplante Berichte sofort ausführen (Proxy zur Cloud Function, CORS-sicher). */
  async runNow(): Promise<{ ok: boolean }> {
    const res = await fetch(`${BASE}/run`, {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw createAppError(new Error((data as { message?: string }).message || 'Ausführung fehlgeschlagen'), ErrorCode.INTERNAL_ERROR, { component: 'scheduledReportConfigService', action: 'runNow' });
    }
    return { ok: (data as { ok?: boolean }).ok ?? true };
  },
};
