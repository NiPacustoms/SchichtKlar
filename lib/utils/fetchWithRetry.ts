/**
 * Fetch wrapper with automatic retry and exponential backoff
 * Handles network resilience for API calls
 */

import { retryWithBackoff, RetryOptions } from './retry';
import { logger } from '@/lib/logging';

export interface FetchWithRetryOptions extends RetryOptions {
  /** Standard fetch RequestInit options */
  fetchOptions?: RequestInit;
  /** Timeout in ms for each individual request (default: 30000) */
  timeoutMs?: number;
}

/**
 * Fetches a URL with automatic retry on transient failures
 *
 * @example
 * const response = await fetchWithRetry('/api/data', {
 *   maxRetries: 4,
 *   timeoutMs: 10000,
 *   fetchOptions: { method: 'POST', body: JSON.stringify(data) }
 * });
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    fetchOptions = {},
    timeoutMs = 30000,
    maxRetries = 4,
    initialDelayMs = 1000,
    ...retryOptions
  } = options;

  return retryWithBackoff(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Throw errors for 5xx and 429 so retry logic catches them
        if (response.status >= 500 || response.status === 429) {
          const errorWithStatus = new Error(
            `HTTP ${response.status}: ${response.statusText}`
          );
          (errorWithStatus as any).status = response.status;
          throw errorWithStatus;
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);

        // Translate AbortError to a more useful error
        if (error instanceof Error && error.name === 'AbortError') {
          const timeoutError = new Error(`Request timeout after ${timeoutMs}ms`);
          (timeoutError as any).code = 'timeout';
          throw timeoutError;
        }

        throw error;
      }
    },
    {
      maxRetries,
      initialDelayMs,
      ...retryOptions,
      onRetry: (attempt, error, delayMs) => {
        logger.info(`Retrying fetch ${url} (attempt ${attempt}, delay: ${delayMs}ms)`, {
          error: error.message,
        });
        retryOptions.onRetry?.(attempt, error, delayMs);
      },
    }
  );
}

/**
 * Convenience wrapper for JSON API calls
 */
export async function fetchJsonWithRetry<T = unknown>(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    fetchOptions: {
      ...options.fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.fetchOptions?.headers,
      },
    },
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}
