/**
 * Retry & Recovery Mechanisms
 * 
 * Provides comprehensive retry logic and recovery mechanisms
 * for React Query, manual retries, and network error handling.
 */

import React from 'react';
import { QueryClient, QueryKey } from '@tanstack/react-query';
import { AppError, ErrorCode, ErrorSeverity, isRetryableError } from '@/lib/errors';
import { logger } from '@/lib/logging';

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: AppError) => boolean;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error: AppError) => {
    // Retry on network errors, timeouts, and service unavailable
    return error.code === 'NETWORK_TIMEOUT' ||
           error.code === 'NETWORK_CONNECTION_FAILED' ||
           error.code === 'SERVICE_UNAVAILABLE' ||
           error.code === 'SERVICE_RATE_LIMITED' ||
           (error.severity !== ErrorSeverity.CRITICAL && error.metadata.retryable !== false);
  }
};

// Exponential backoff calculation
export function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

// Retry utility function
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: Record<string, unknown>
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: AppError | Error | null = null;
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const result = await fn();
      
      if (attempt > 0) {
        logger.info(`Retry successful after ${attempt} attempts`, {
          ...context,
          attempt,
          success: true
        } as Record<string, unknown>);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      const appError = error instanceof AppError ? error : 
                      new AppError(ErrorCode.UNKNOWN_ERROR, error instanceof Error ? error.message : String(error));
      
      const shouldRetry = retryConfig.retryCondition ? 
        retryConfig.retryCondition(appError) : 
        isRetryableError(appError);
      
      if (!shouldRetry || attempt >= retryConfig.maxRetries) {
        logger.error(`Retry failed after ${attempt + 1} attempts`, appError, {
          ...context,
          attempt: attempt + 1,
          maxRetries: retryConfig.maxRetries,
          shouldRetry
        } as Record<string, unknown>);
        break;
      }
      
      const delay = calculateBackoffDelay(attempt, retryConfig);
      
      logger.warn(`Retry attempt ${attempt + 1}/${retryConfig.maxRetries}`, {
        ...context,
        attempt: attempt + 1,
        delay,
        errorCode: appError.code,
        errorMessage: appError.technicalMessage
      } as Record<string, unknown>);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// React Query retry configuration
export const createRetryConfig = (config: Partial<RetryConfig> = {}) => {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  return {
    retry: (failureCount: number, error: unknown) => {
      const appError = error instanceof AppError ? error : 
                      new AppError(ErrorCode.UNKNOWN_ERROR, (error as { message?: string })?.message || 'Unknown error');
      
      const shouldRetry = retryConfig.retryCondition ? 
        retryConfig.retryCondition(appError) : 
        isRetryableError(appError);
      
      if (!shouldRetry || failureCount >= retryConfig.maxRetries) {
        return false;
      }
      
      logger.info(`React Query retry attempt ${failureCount + 1}`, {
        failureCount: failureCount + 1,
        maxRetries: retryConfig.maxRetries,
        errorCode: appError.code,
        queryKey: (error as { queryKey?: string })?.queryKey || 'unknown'
      } as Record<string, unknown>);
      
      return true;
    },
    retryDelay: (attemptIndex: number) => {
      return calculateBackoffDelay(attemptIndex, retryConfig);
    }
  };
};

// Network error detection
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  // Check for common network error patterns
  const networkErrorPatterns = [
    'NetworkError',
    'TimeoutError',
    'ConnectionError',
    'fetch failed',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_TIMED_OUT'
  ];
  
  const errorMessage = (error as { message?: string })?.message || String(error);
  return networkErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}

// Offline detection
class OfflineDetector {
  private static isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
  private static listeners: Array<(isOnline: boolean) => void> = [];
  
  static init(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
      logger.info('Network connection restored');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
      logger.warn('Network connection lost');
    });
  }
  
  static isConnected(): boolean {
    return this.isOnline;
  }
  
  static addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  private static notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        logger.error('Error in offline listener', error as Error);
      }
    });
  }
}

// Auto-reconnect mechanism
class AutoReconnect {
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static reconnectDelay = 5000;
  private static isReconnecting = false;
  
  static async attemptReconnect(): Promise<boolean> {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return false;
    }
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    try {
      logger.info(`Auto-reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      // Simple connectivity test
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        logger.info('Auto-reconnect successful');
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        return true;
      }
      
      throw new Error('Health check failed');
    } catch (error) {
      logger.warn(`Auto-reconnect attempt ${this.reconnectAttempts} failed`, {
        error: error instanceof Error ? error.message : String(error),
        nextAttemptIn: this.reconnectDelay
      } as Record<string, unknown>);
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.isReconnecting = false;
          this.attemptReconnect();
        }, this.reconnectDelay);
      } else {
        logger.error('Auto-reconnect failed after maximum attempts');
        this.isReconnecting = false;
      }
      
      return false;
    }
  }
  
  static reset(): void {
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }
}

// Manual retry hook for React components
export function useManualRetry<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options: Partial<RetryConfig> = {}
) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  
  const retry = React.useCallback(async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      const result = await withRetry(queryFn, options, {
        queryKey: queryKey.join(','),
        manualRetry: true,
        retryCount: retryCount + 1
      });
      
      logger.info('Manual retry successful', {
        queryKey: queryKey.join(','),
        retryCount: retryCount + 1
      } as Record<string, unknown>);
      
      return result;
    } catch (error) {
      logger.error('Manual retry failed', error as Error, {
        queryKey: queryKey.join(','),
        retryCount: retryCount + 1
      } as Record<string, unknown>);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [queryFn, queryKey, options, retryCount]);
  
  return {
    retry,
    isRetrying,
    retryCount,
    canRetry: retryCount < (options.maxRetries || DEFAULT_RETRY_CONFIG.maxRetries)
  };
}

// React Query configuration with retry
export const createQueryClient = (config: Partial<RetryConfig> = {}) => {
  const retryConfig = createRetryConfig(config);
  
  return new QueryClient({
    defaultOptions: {
      queries: {
        ...retryConfig,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true
      },
      mutations: {
        ...retryConfig,
        retry: (failureCount: number, error: unknown) => {
          // Be more conservative with mutations
          const appError = error instanceof AppError ? error :
                          new AppError(ErrorCode.UNKNOWN_ERROR, (error as { message?: string })?.message || 'Unknown error');
          
          return failureCount < 2 && 
                 (appError.code === 'NETWORK_TIMEOUT' || 
                  appError.code === 'NETWORK_CONNECTION_FAILED') &&
                 appError.severity !== ErrorSeverity.CRITICAL;
        }
      }
    }
  });
};

// Recovery strategies
class RecoveryStrategies {
  static async recoverFromNetworkError<T>(
    operation: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (isNetworkError(error)) {
        logger.warn('Network error detected, attempting recovery');
        
        // Try to reconnect
        const reconnected = await AutoReconnect.attemptReconnect();
        
        if (reconnected) {
          // Retry the operation
          return await withRetry(operation, {
            maxRetries: 2,
            baseDelay: 1000
          });
        }
        
        // Use fallback if available
        if (fallback) {
          logger.info('Using fallback after network error');
          return fallback();
        }
      }
      
      throw error;
    }
  }
  
  static async recoverFromServiceError<T>(
    operation: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const appError = error instanceof AppError ? error :
                      new AppError(ErrorCode.UNKNOWN_ERROR, error instanceof Error ? error.message : String(error));
      
      if (appError.code === 'SERVICE_UNAVAILABLE' || 
          appError.code === 'SERVICE_RATE_LIMITED') {
        
        logger.warn('Service error detected, attempting recovery', {
          errorCode: appError.code
        } as Record<string, unknown>);
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          return await operation();
        } catch (retryError) {
          if (fallback) {
            logger.info('Using fallback after service error');
            return fallback();
          }
          throw retryError;
        }
      }
      
      throw error;
    }
  }
}

// Initialize offline detection
if (typeof window !== 'undefined') {
  OfflineDetector.init();
}

// Export all retry and recovery utilities
export {
  DEFAULT_RETRY_CONFIG,
  OfflineDetector,
  AutoReconnect,
  RecoveryStrategies
};
