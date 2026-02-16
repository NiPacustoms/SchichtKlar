type BucketState = {
  tokens: number;
  lastRefillMs: number;
};

type LimiterOptions = {
  windowMs: number; // Zeitfenster für vollständigen Refill
  max: number; // maximale Anfragen pro Fenster
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

// simple global store (best-effort). Für echte Produktion: externes KV (Redis/Upstash/Cloudflare KV)
const getGlobalStore = (): Map<string, BucketState> => {
  const g = globalThis as unknown as { __rateLimitStore?: Map<string, BucketState> };
  if (!g.__rateLimitStore) {
    g.__rateLimitStore = new Map<string, BucketState>();
  }
  return g.__rateLimitStore;
};

export function getRateLimiter(options: LimiterOptions) {
  const store = getGlobalStore();
  const capacity = options.max;
  const refillIntervalMs = options.windowMs;
  const refillRatePerMs = capacity / refillIntervalMs; // Token pro ms

  function nowMs() {
    return Date.now();
  }

  return {
    check: (key: string): RateLimitResult => {
      const currentTime = nowMs();
      const state = store.get(key) ?? { tokens: capacity, lastRefillMs: currentTime };

      // Refill basierend auf vergangener Zeit
      const elapsed = currentTime - state.lastRefillMs;
      if (elapsed > 0) {
        const refill = elapsed * refillRatePerMs;
        state.tokens = Math.min(capacity, state.tokens + refill);
        state.lastRefillMs = currentTime;
      }

      let allowed = false;
      if (state.tokens >= 1) {
        state.tokens -= 1;
        allowed = true;
      }

      store.set(key, state);

      const remaining = Math.max(0, Math.floor(state.tokens));
      const deficit = allowed ? 0 : 1 - state.tokens; // wie viele Tokens fehlen bis zur Erlaubnis
      const retryAfterSeconds = deficit > 0 ? Math.ceil((deficit / refillRatePerMs) / 1000) : 0;

      return { allowed, remaining, retryAfterSeconds };
    },
  };
}


