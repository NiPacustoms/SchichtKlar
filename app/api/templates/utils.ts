import { NextRequest } from 'next/server';
import type { TemplateChannel, TemplateStatus } from '@/lib/types';
import { adminDb, verifyIdToken } from '@/lib/server/firebaseAdmin';

export type RequestContext = {
  uid: string;
  role: string;
  companyId: string;
};

export type TemplateResponseBody = {
  id: string;
  companyId: string;
  key: string;
  channel: TemplateChannel;
  name: string;
  description?: string;
  locale: string;
  title?: string;
  bodyText?: string;
  subject?: string;
  bodyHtml?: string;
  actionText?: string;
  status: TemplateStatus;
  version: number;
  tags?: string[];
  category?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export async function getRequestContext(request: NextRequest): Promise<RequestContext> {
  const authHeader = request.headers.get('authorization') || undefined;
  const decoded = await verifyIdToken(authHeader);
  if (!decoded) {
    throw new Response(JSON.stringify({ message: 'Unauthenticated' }), { status: 401 });
  }

  if (!adminDb) {
    throw new Response(JSON.stringify({ message: 'Database not initialized' }), { status: 500 });
  }

  const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
  if (!userDoc.exists) {
    throw new Response(JSON.stringify({ message: 'Benutzer nicht gefunden' }), { status: 404 });
  }

  const userData = userDoc.data() as Record<string, unknown>;
  const docRole = typeof userData.role === 'string' ? userData.role : undefined;
  const decodedRecord = decoded as Record<string, unknown>;

  const customClaims = (decodedRecord.customClaims ?? {}) as Record<string, unknown>;
  const claimRole =
    typeof decodedRecord.role === 'string'
      ? decodedRecord.role
      : typeof customClaims.role === 'string'
        ? (customClaims.role as string)
        : undefined;

  const role = claimRole || docRole;
  if (!role || (role !== 'admin' && role !== 'dispatcher')) {
    throw new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }

  const companyId = typeof userData.companyId === 'string' ? userData.companyId : undefined;
  if (!companyId) {
    throw new Response(JSON.stringify({ message: 'Kein Unternehmen zugeordnet' }), { status: 400 });
  }

  return {
    uid: decoded.uid,
    role,
    companyId,
  };
}

export function mapTemplateDoc(doc: FirebaseFirestore.DocumentSnapshot): TemplateResponseBody {
  const data = doc.data() as Record<string, unknown> | undefined;
  if (!data) {
    throw new Error('Template-Dokument ohne Daten');
  }

  const createdAt =
    (data.createdAt as FirebaseFirestore.Timestamp | undefined)?.toDate?.() || new Date();
  const updatedAt =
    (data.updatedAt as FirebaseFirestore.Timestamp | undefined)?.toDate?.() || createdAt;

  return {
    id: doc.id,
    companyId: data.companyId as string,
    key: data.key as string,
    channel: data.channel as TemplateChannel,
    name: data.name as string,
    description:
      typeof data.description === 'string' && data.description.trim().length > 0
        ? data.description
        : undefined,
    locale: typeof data.locale === 'string' && data.locale.trim().length > 0 ? data.locale : 'de',
    title: typeof data.title === 'string' ? data.title : undefined,
    bodyText:
      typeof data.bodyText === 'string'
        ? data.bodyText
        : typeof data.message === 'string'
          ? data.message
          : undefined,
    subject: typeof data.subject === 'string' ? data.subject : undefined,
    bodyHtml: typeof data.bodyHtml === 'string' ? data.bodyHtml : undefined,
    actionText: typeof data.actionText === 'string' ? data.actionText : undefined,
    status: (data.status as TemplateStatus) || 'draft',
    version: typeof data.version === 'number' ? data.version : 1,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
    category: typeof data.category === 'string' ? data.category : undefined,
    createdAt: createdAt.toISOString(),
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : 'unknown',
    updatedAt: updatedAt.toISOString(),
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : 'unknown',
  };
}

export function validateChannel(value: unknown): asserts value is TemplateChannel {
  if (value !== 'app' && value !== 'email') {
    throw new Response(JSON.stringify({ message: 'Ungültiger Kanal. Erlaubt: app, email' }), {
      status: 400,
    });
  }
}

export function validateStatus(value: unknown): asserts value is TemplateStatus {
  if (value !== undefined && value !== 'draft' && value !== 'published') {
    throw new Response(
      JSON.stringify({ message: 'Ungültiger Status. Erlaubt: draft, published' }),
      { status: 400 }
    );
  }
}

export function ensureChannelSpecificFields(
  channel: TemplateChannel,
  payload: Record<string, unknown>
) {
  if (channel === 'app') {
    if (typeof payload.title !== 'string' || payload.title.trim().length === 0) {
      throw new Response(JSON.stringify({ message: 'title ist erforderlich für App-Templates' }), {
        status: 400,
      });
    }
    if (typeof payload.message !== 'string' || payload.message.trim().length === 0) {
      throw new Response(
        JSON.stringify({ message: 'message ist erforderlich für App-Templates' }),
        { status: 400 }
      );
    }
  }

  if (channel === 'email') {
    if (typeof payload.subject !== 'string' || payload.subject.trim().length === 0) {
      throw new Response(
        JSON.stringify({ message: 'subject ist erforderlich für E-Mail-Templates' }),
        { status: 400 }
      );
    }
    if (typeof payload.bodyHtml !== 'string' || payload.bodyHtml.trim().length === 0) {
      throw new Response(
        JSON.stringify({ message: 'bodyHtml ist erforderlich für E-Mail-Templates' }),
        { status: 400 }
      );
    }
    if (
      payload.message !== undefined &&
      (typeof payload.message !== 'string' || payload.message.trim().length === 0)
    ) {
      throw new Response(
        JSON.stringify({ message: 'message muss ein nicht-leerer String sein, wenn angegeben' }),
        { status: 400 }
      );
    }
  }
}
