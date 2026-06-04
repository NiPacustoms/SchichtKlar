/**
 * Retry utility with exponential backoff
 * Implements industry-standard retry pattern for network resilience
 */

import { logger } from '@/lib/logging';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 4) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Optional callback for retry events */
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
  /** Function to determine if error is retryable (default: all errors retryable) */
  isRetryable?: (error: unknown) => boolean;
  /** Add jitter to delays (default: true) */
  useJitter?: boolean;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalDelayMs: number;
}

/**
 * Default check for retryable errors
 * Returns true for network errors, timeouts, and 5xx errors
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  const errorStr = String(error).toLowerCase();
  const errorCode = (error as any)?.code?.toLowerCase() || '';
  const statusCode = (error as any)?.status || (error as any)?.statusCode;

  // Network errors
  if (errorStr.includes('network') || errorStr.includes('fetch')) return true;
  if (errorStr.includes('timeout')) return true;
  if (errorStr.includes('econnreset') || errorStr.includes('econnrefused')) return true;

  // Firebase specific errors
  if (errorCode === 'unavailable') return true;
  if (errorCode === 'deadline-exceeded') return true;
  if (errorCode === 'resource-exhausted') return true;
  if (errorCode === 'internal') return true;
  if (errorCode === 'aborted') return true;

  // HTTP 5xx errors
  if (typeof statusCode === 'number' && statusCode >= 500 && statusCode < 600) return true;

  // HTTP 429 (rate limiting)
  if (statusCode === 429) return true;

  // NON-retryable: 4xx client errors, validation errors, permission errors
  if (errorCode === 'permission-denied' || errorCode === 'unauthenticated') return false;
  if (errorCode === 'not-found' || errorCode === 'already-exists') return false;
  if (errorCode === 'invalid-argument' || errorCode === 'failed-precondition') return false;
  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) return false;

  return false;
}

/**
 * Calculates the next delay with exponential backoff and optional jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  initialDelayMs: number,
  backoffMultiplier: number,
  maxDelayMs: number,
  useJitter: boolean = true
): number {
  const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  if (!useJitter) return cappedDelay;

  // Add jitter (±25%) to prevent thundering herd
  const jitterRange = cappedDelay * 0.25;
  const jitter = (Math.random() * 2 - 1) * jitterRange;
  return Math.max(0, Math.floor(cappedDelay + jitter));
}

/**
 * Wraps an async function with retry logic and exponential backoff
 *
 * @example
 * const result = await retryWithBackoff(
 *   () => fetch('/api/data'),
 *   { maxRetries: 4, initialDelayMs: 1000 }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 4,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    onRetry,
    isRetryable = isRetryableError,
    useJitter = true,
  } = options;

  let lastError: unknown;
  let totalDelayMs = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if this is the last attempt
      if (attempt >= maxRetries) {
        logger.error(`Retry failed after ${maxRetries} attempts`, error instanceof Error ? error : new Error(String(error)));
        throw error;
      }

      // Check if error is retryable
      if (!isRetryable(error)) {
        logger.debug('Non-retryable error encountered, throwing immediately', { error: String(error) });
        throw error;
      }

      // Calculate delay for next retry
      const delayMs = calculateBackoffDelay(
        attempt,
        initialDelayMs,
        backoffMultiplier,
        maxDelayMs,
        useJitter
      );

      totalDelayMs += delayMs;

      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.info(`Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms`, { error: errorObj.message });

      onRetry?.(attempt + 1, errorObj, delayMs);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Wraps an async function with retry logic and returns detailed result
 */
export async function retryWithBackoffDetailed<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  let attempts = 0;
  let totalDelayMs = 0;

  const wrappedOptions: RetryOptions = {
    ...options,
    onRetry: (attempt, error, delayMs) => {
      attempts = attempt;
      totalDelayMs += delayMs;
      options.onRetry?.(attempt, error, delayMs);
    },
  };

  const result = await retryWithBackoff(fn, wrappedOptions);

  return {
    result,
    attempts: attempts + 1, // +1 for the initial attempt
    totalDelayMs,
  };
}
