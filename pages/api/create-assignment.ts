import type { NextApiRequest, NextApiResponse } from 'next';

function getProjectId(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    ''
  );
}

type Payload = {
  facilityId: string;
  companyId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  qualification?: string;
  hours?: number;
  limit?: number;
  selectedUserIds?: string[];
};

function isPayload(body: unknown): body is Payload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.facilityId === 'string' &&
    typeof b.companyId === 'string' &&
    typeof b.startDate === 'string' &&
    typeof b.startTime === 'string' &&
    typeof b.endTime === 'string'
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  if (!isPayload(req.body)) {
    return res.status(400).json({
      error: 'Invalid payload: facilityId, companyId, startDate, startTime, endTime required',
    });
  }

  const projectId = getProjectId();
  if (!projectId) {
    return res.status(500).json({ error: 'Firebase project ID not configured' });
  }

  const cfUrl = `https://us-central1-${projectId}.cloudfunctions.net/createWithMatching`;

  try {
    const response = await fetch(cfUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ data: req.body }),
    });

    const raw = await response.text();
    let json: Record<string, unknown> = {};
    try {
      json = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      if (!response.ok) {
        return res.status(response.status >= 400 ? response.status : 500).json({
          error: response.statusText || raw.slice(0, 200),
        });
      }
    }

    const err = json.error as { status?: string; message?: string } | undefined;
    if (err && typeof err === 'object') {
      const message = err.message ?? 'Cloud Function error';
      const status =
        err.status === 'unauthenticated' ? 401
        : err.status === 'permission-denied' ? 403
        : err.status === 'invalid-argument' ? 400
        : 500;
      return res.status(status).json({ error: message });
    }

    if (!response.ok) {
      const msg = (json.error as { message?: string } | undefined)?.message ?? response.statusText;
      const status = response.status === 401 ? 401 : response.status === 403 ? 403 : 500;
      return res.status(status).json({ error: msg });
    }

    const result = json.result as {
      success?: boolean;
      assignmentId?: string;
      candidateUserIds?: string[];
      candidateCount?: number;
    } | undefined;
    if (!result) {
      return res.status(502).json({ error: 'Invalid response from createWithMatching' });
    }
    return res.status(200).json({
      success: result.success,
      assignmentId: result.assignmentId,
      candidateCount:
        result.candidateCount ?? (Array.isArray(result.candidateUserIds) ? result.candidateUserIds.length : 0),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: `Proxy request failed: ${message}` });
  }
}
