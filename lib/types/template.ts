/**
 * Template Types
 */

export type TemplateChannel = 'email' | 'push' | 'sms' | 'in-app' | 'app';
export type TemplateStatus = 'draft' | 'active' | 'archived' | 'published';

export interface CompanyTemplate {
  id: string;
  companyId: string;
  key: string;
  channel: TemplateChannel;
  name: string;
  description?: string;
  locale: string;
  title?: string;
  message?: string;
  subject?: string;
  bodyHtml?: string;
  actionText?: string;
  status: TemplateStatus;
  version: number;
  tags?: string[];
  category?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}
