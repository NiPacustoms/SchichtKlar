import { auth } from '@/lib/firebase';
import type { CompanyTemplate, TemplateChannel, TemplateStatus } from '@/lib/types';

type TemplateResponse = Omit<CompanyTemplate, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export interface TemplateQuery {
  channel?: TemplateChannel;
  status?: TemplateStatus;
  locale?: string;
  key?: string;
  search?: string;
}

export interface TemplateUpsertPayload {
  key: string;
  channel: TemplateChannel;
  name: string;
  description?: string;
  locale?: string;
  title?: string;
  bodyText?: string;
  subject?: string;
  bodyHtml?: string;
  actionText?: string;
  status?: TemplateStatus;
  tags?: string[];
  category?: string;
}

interface TemplateUpdatePayload extends Partial<Omit<TemplateUpsertPayload, 'channel' | 'key'>> {
  status?: TemplateStatus;
}

function assertAuthenticatedUser() {
  if (!auth?.currentUser) {
    throw new Error('Kein authentifizierter Benutzer gefunden');
  }
  return auth.currentUser;
}

async function getAuthHeaders() {
  const user = assertAuthenticatedUser();
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function toCompanyTemplate(data: TemplateResponse): CompanyTemplate {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

function buildQueryString(query: TemplateQuery): string {
  const params = new URLSearchParams();
  if (query.channel) params.set('channel', query.channel);
  if (query.status) params.set('status', query.status);
  if (query.locale) params.set('locale', query.locale);
  if (query.key) params.set('key', query.key);
  if (query.search) params.set('search', query.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const templateService = {
  async list(query: TemplateQuery = {}): Promise<CompanyTemplate[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/templates${buildQueryString(query)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || `HTTP ${response.status}`);
    }

    const json = (await response.json()) as { data: TemplateResponse[] };
    return json.data.map(toCompanyTemplate);
  },

  async get(templateId: string): Promise<CompanyTemplate> {
    if (!templateId) throw new Error('Template-ID fehlt');
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/templates/${templateId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || `HTTP ${response.status}`);
    }

    const json = (await response.json()) as { data: TemplateResponse };
    return toCompanyTemplate(json.data);
  },

  async create(payload: TemplateUpsertPayload): Promise<CompanyTemplate> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `HTTP ${response.status}`);
    }

    const json = (await response.json()) as { data: TemplateResponse };
    return toCompanyTemplate(json.data);
  },

  async update(templateId: string, payload: TemplateUpdatePayload): Promise<CompanyTemplate> {
    if (!templateId) throw new Error('Template-ID fehlt');
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/templates/${templateId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `HTTP ${response.status}`);
    }

    const json = (await response.json()) as { data: TemplateResponse };
    return toCompanyTemplate(json.data);
  },

  async remove(templateId: string): Promise<void> {
    if (!templateId) throw new Error('Template-ID fehlt');
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/templates/${templateId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `HTTP ${response.status}`);
    }
  },
};

export default templateService;

