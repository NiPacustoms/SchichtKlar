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
  // Nur serverseitige Variable: Ein Security-Webhook darf niemals ins Client-Bundle
  // gelangen (NEXT_PUBLIC_* wäre öffentlich einsehbar und missbrauchbar).
  const webhook = process.env.SECURITY_WEBHOOK_URL;
  if (webhook) {
    await postWebhook(webhook, created);
  }
}


