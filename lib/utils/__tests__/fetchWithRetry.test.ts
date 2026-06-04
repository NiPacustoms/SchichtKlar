import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry, fetchJsonWithRetry } from '../fetchWithRetry';

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should return response on successful fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('OK', { status: 200 })
    );

    const response = await fetchWithRetry('https://api.example.com/data', {
      useJitter: false,
    });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 5xx errors', async () => {
    let attempts = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.resolve(new Response('Error', { status: 503 }));
      }
      return Promise.resolve(new Response('OK', { status: 200 }));
    });

    const response = await fetchWithRetry('https://api.example.com/data', {
      maxRetries: 4,
      initialDelayMs: 10,
      useJitter: false,
    });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should retry on 429 (rate limit)', async () => {
    let attempts = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 2) {
        return Promise.resolve(new Response('Rate limit', { status: 429 }));
      }
      return Promise.resolve(new Response('OK', { status: 200 }));
    });

    const response = await fetchWithRetry('https://api.example.com/data', {
      maxRetries: 4,
      initialDelayMs: 10,
      useJitter: false,
    });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should NOT retry on 4xx errors', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('Not Found', { status: 404 })
    );

    const response = await fetchWithRetry('https://api.example.com/data', {
      useJitter: false,
    });

    // 404 is not retried; it returns the response (no throw because not 5xx)
    expect(response.status).toBe(404);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('fetchJsonWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should return parsed JSON on success', async () => {
    const data = { result: 'ok', count: 42 };
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await fetchJsonWithRetry<typeof data>('https://api.example.com/data', {
      useJitter: false,
    });

    expect(result).toEqual(data);
  });

  it('should add JSON headers automatically', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200 })
    );

    await fetchJsonWithRetry('https://api.example.com/data', {
      fetchOptions: { method: 'POST', body: '{}' },
      useJitter: false,
    });

    const callArgs = (fetch as any).mock.calls[0][1];
    expect(callArgs.headers['Content-Type']).toBe('application/json');
    expect(callArgs.headers['Accept']).toBe('application/json');
  });

  it('should throw on non-OK responses', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('Not Found', { status: 404 })
    );

    await expect(
      fetchJsonWithRetry('https://api.example.com/data', {
        useJitter: false,
      })
    ).rejects.toMatchObject({ status: 404 });
  });
});
