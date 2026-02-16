export type SecurityEvent = {
  type: 'rate_limit_block' | 'auth_failure' | 'suspicious_activity';
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
};

async function postWebhook(url: string, payload: unknown) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // best-effort, kein throw
  }
}

export async function emitSecurityEvent(event: Omit<SecurityEvent, 'createdAt'>) {
  const created = { ...event, createdAt: Date.now() };
  const webhook = process.env.NEXT_PUBLIC_SECURITY_WEBHOOK_URL || process.env.SECURITY_WEBHOOK_URL;
  if (webhook) {
    await postWebhook(webhook, created);
  }
}


