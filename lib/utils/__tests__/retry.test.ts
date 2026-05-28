import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retryWithBackoff, calculateBackoffDelay, isRetryableError } from '../retry';

describe('Retry with Exponential Backoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential delays without jitter', () => {
      expect(calculateBackoffDelay(0, 1000, 2, 30000, false)).toBe(1000);
      expect(calculateBackoffDelay(1, 1000, 2, 30000, false)).toBe(2000);
      expect(calculateBackoffDelay(2, 1000, 2, 30000, false)).toBe(4000);
      expect(calculateBackoffDelay(3, 1000, 2, 30000, false)).toBe(8000);
      expect(calculateBackoffDelay(4, 1000, 2, 30000, false)).toBe(16000);
    });

    it('should cap at maxDelayMs', () => {
      const delay = calculateBackoffDelay(10, 1000, 2, 30000, false);
      expect(delay).toBe(30000);
    });

    it('should add jitter when enabled', () => {
      const delays = new Set<number>();
      for (let i = 0; i < 20; i++) {
        delays.add(calculateBackoffDelay(2, 1000, 2, 30000, true));
      }
      // With jitter, we should get different values
      expect(delays.size).toBeGreaterThan(1);
    });

    it('should always return non-negative values', () => {
      for (let i = 0; i < 100; i++) {
        const delay = calculateBackoffDelay(2, 1000, 2, 30000, true);
        expect(delay).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('isRetryableError', () => {
    it('should retry network errors', () => {
      expect(isRetryableError(new Error('network error'))).toBe(true);
      expect(isRetryableError(new Error('fetch failed'))).toBe(true);
      expect(isRetryableError(new Error('timeout'))).toBe(true);
    });

    it('should retry Firebase unavailable errors', () => {
      const error = { code: 'unavailable', message: 'Service unavailable' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should retry on 5xx errors', () => {
      expect(isRetryableError({ status: 500 })).toBe(true);
      expect(isRetryableError({ status: 503 })).toBe(true);
      expect(isRetryableError({ statusCode: 502 })).toBe(true);
    });

    it('should retry on 429 (rate limit)', () => {
      expect(isRetryableError({ status: 429 })).toBe(true);
    });

    it('should NOT retry on 4xx errors', () => {
      expect(isRetryableError({ status: 400 })).toBe(false);
      expect(isRetryableError({ status: 401 })).toBe(false);
      expect(isRetryableError({ status: 403 })).toBe(false);
      expect(isRetryableError({ status: 404 })).toBe(false);
    });

    it('should NOT retry on permission errors', () => {
      expect(isRetryableError({ code: 'permission-denied' })).toBe(false);
      expect(isRetryableError({ code: 'unauthenticated' })).toBe(false);
    });

    it('should NOT retry on validation errors', () => {
      expect(isRetryableError({ code: 'invalid-argument' })).toBe(false);
      expect(isRetryableError({ code: 'not-found' })).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('network error');
        }
        return Promise.resolve('success');
      });

      const result = await retryWithBackoff(fn, {
        maxRetries: 4,
        initialDelayMs: 10,
        useJitter: false,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after maxRetries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('network error'));

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 2,
          initialDelayMs: 10,
          useJitter: false,
        })
      ).rejects.toThrow('network error');

      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue({ code: 'permission-denied', message: 'Forbidden' });

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 4,
          initialDelayMs: 10,
        })
      ).rejects.toMatchObject({ code: 'permission-denied' });

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      let attempts = 0;
      const fn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('network error');
        }
        return Promise.resolve('success');
      });

      await retryWithBackoff(fn, {
        maxRetries: 4,
        initialDelayMs: 10,
        useJitter: false,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number));
    });

    it('should respect custom isRetryable function', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('custom error'));
      const isRetryable = vi.fn().mockReturnValue(false);

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 4,
          initialDelayMs: 10,
          isRetryable,
        })
      ).rejects.toThrow('custom error');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(isRetryable).toHaveBeenCalled();
    });

    it('should handle rapid succession of failures with backoff', async () => {
      const startTime = Date.now();
      const fn = vi.fn().mockRejectedValue(new Error('network error'));

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 3,
          initialDelayMs: 50,
          backoffMultiplier: 2,
          useJitter: false,
        })
      ).rejects.toThrow();

      const elapsed = Date.now() - startTime;
      // Should have waited at least 50 + 100 + 200 = 350ms
      expect(elapsed).toBeGreaterThanOrEqual(300);
    });
  });
});
