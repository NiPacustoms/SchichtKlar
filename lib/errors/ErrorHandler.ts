/**
 * Central Error Handler for JobFlow Application
 * 
 * Provides error transformation, normalization, and context enrichment
 * for consistent error handling across the application.
 */

import { AppError, ErrorCode, ErrorSeverity, ErrorContext, ErrorMetadata, createAppError, isAppError } from './ErrorTypes';

export interface ErrorHandlerConfig {
  enableContextEnrichment: boolean;
  enableErrorTransformation: boolean;
  enableRetryLogic: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private config: ErrorHandlerConfig;
  
  private constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableContextEnrichment: true,
      enableErrorTransformation: true,
      enableRetryLogic: true,
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      ...config
    };
  }
  
  public static getInstance(config?: Partial<ErrorHandlerConfig>): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(config);
    }
    return ErrorHandler.instance;
  }
  
  /**
   * Handle and transform unknown errors into AppError
   */
  public handleError(
    error: unknown,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ): AppError {
    // If already an AppError, enrich with additional context
    if (isAppError(error)) {
      return this.enrichError(error, context, metadata);
    }
    
    // Transform unknown errors to AppError
    const appError = createAppError(error, ErrorCode.UNKNOWN_ERROR, context);
    return this.enrichError(appError, context, metadata);
  }
  
  /**
   * Transform Firebase errors to AppError
   */
  public handleFirebaseError(
    error: unknown,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ): AppError {
    const firebaseLike = (e: unknown): e is { code?: string; message?: string } =>
      typeof e === 'object' && e !== null && ('code' in e || 'message' in e);
    const firebaseErrorMap: Record<string, { code: ErrorCode; severity: ErrorSeverity }> = {
      'permission-denied': { code: ErrorCode.FIREBASE_PERMISSION_DENIED, severity: ErrorSeverity.ERROR },
      'not-found': { code: ErrorCode.FIREBASE_NOT_FOUND, severity: ErrorSeverity.WARNING },
      'already-exists': { code: ErrorCode.FIREBASE_ALREADY_EXISTS, severity: ErrorSeverity.WARNING },
      'resource-exhausted': { code: ErrorCode.FIREBASE_QUOTA_EXCEEDED, severity: ErrorSeverity.CRITICAL },
      'unauthenticated': { code: ErrorCode.AUTH_REQUIRED, severity: ErrorSeverity.ERROR },
      'failed-precondition': { code: ErrorCode.VALIDATION_REQUIRED_FIELD, severity: ErrorSeverity.WARNING },
      'invalid-argument': { code: ErrorCode.VALIDATION_INVALID_FORMAT, severity: ErrorSeverity.WARNING },
      'deadline-exceeded': { code: ErrorCode.NETWORK_TIMEOUT, severity: ErrorSeverity.ERROR },
      'unavailable': { code: ErrorCode.SERVICE_UNAVAILABLE, severity: ErrorSeverity.ERROR },
      'internal': { code: ErrorCode.INTERNAL_ERROR, severity: ErrorSeverity.CRITICAL }
    };
    
    const errorCode = firebaseLike(error) && typeof error.code === 'string' ? error.code : 'unknown';
    const errorMapping = firebaseErrorMap[errorCode] || { 
      code: ErrorCode.UNKNOWN_ERROR, 
      severity: ErrorSeverity.ERROR 
    };
    
    const appError = new AppError(
      errorMapping.code,
      firebaseLike(error) && typeof error.message === 'string' ? error.message : 'Firebase error occurred',
      errorMapping.severity,
      context,
      {
        ...metadata,
        originalError: error as Error,
        component: 'firebase'
      }
    );
    
    return this.enrichError(appError, context, metadata);
  }
  
  /**
   * Transform network/fetch errors to AppError
   */
  public handleNetworkError(
    error: unknown,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ): AppError {
    const networkLike = (e: unknown): e is { name?: string; code?: string | number; status?: number; message?: string } =>
      typeof e === 'object' && e !== null;
    let errorCode = ErrorCode.NETWORK_CONNECTION_FAILED;
    let severity = ErrorSeverity.ERROR;
    
    if (networkLike(error) && (error.name === 'TimeoutError' || error.code === 'TIMEOUT')) {
      errorCode = ErrorCode.NETWORK_TIMEOUT;
    } else if (networkLike(error) && error.status === 429) {
      errorCode = ErrorCode.SERVICE_RATE_LIMITED;
    } else if (networkLike(error) && typeof error.status === 'number' && error.status >= 500) {
      errorCode = ErrorCode.SERVICE_UNAVAILABLE;
      severity = ErrorSeverity.CRITICAL;
    } else if (networkLike(error) && error.status === 401) {
      errorCode = ErrorCode.AUTH_INVALID_TOKEN;
    } else if (networkLike(error) && error.status === 403) {
      errorCode = ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS;
    }
    
    const appError = new AppError(
      errorCode,
      networkLike(error) && typeof error.message === 'string' ? error.message : 'Network error occurred',
      severity,
      context,
      {
        ...metadata,
        originalError: error as Error,
        component: 'network',
        retryable: true
      }
    );
    
    return this.enrichError(appError, context, metadata);
  }
  
  /**
   * Transform validation errors to AppError
   */
  public handleValidationError(
    error: unknown,
    field?: string,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ): AppError {
    const validationLike = (e: unknown): e is { type?: string; message?: string } =>
      typeof e === 'object' && e !== null;
    let errorCode = ErrorCode.VALIDATION_REQUIRED_FIELD;
    
    if (validationLike(error) && error.type === 'format') {
      errorCode = ErrorCode.VALIDATION_INVALID_FORMAT;
    } else if (validationLike(error) && error.type === 'range') {
      errorCode = ErrorCode.VALIDATION_OUT_OF_RANGE;
    } else if (validationLike(error) && error.type === 'duplicate') {
      errorCode = ErrorCode.VALIDATION_DUPLICATE_VALUE;
    }
    
    const baseMessage = validationLike(error) && typeof error.message === 'string' ? error.message : 'Validation failed';
    const message = field ? `${field}: ${baseMessage}` : baseMessage;
    
    const appError = new AppError(
      errorCode,
      message,
      ErrorSeverity.WARNING,
      context,
      {
        ...metadata,
        originalError: error as Error,
        component: 'validation',
        action: field ? `validate_${field}` : 'validate'
      }
    );
    
    return this.enrichError(appError, context, metadata);
  }
  
  /**
   * Enrich error with additional context and metadata
   */
  private enrichError(
    error: AppError,
    additionalContext: Partial<ErrorContext> = {},
    additionalMetadata: Partial<ErrorMetadata> = {}
  ): AppError {
    if (!this.config.enableContextEnrichment) {
      return error;
    }
    
    const enrichedContext: ErrorContext = {
      ...error.context,
      ...additionalContext,
      timestamp: new Date()
    };
    
    const enrichedMetadata: ErrorMetadata = {
      ...error.metadata,
      ...additionalMetadata
    };
    
    return new AppError(
      error.code,
      error.technicalMessage,
      error.severity,
      enrichedContext,
      enrichedMetadata
    );
  }
  
  /**
   * Execute function with error handling and retry logic
   */
  public async executeWithRetry<T>(
    fn: () => Promise<T>,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ): Promise<T> {
    let lastError: AppError | null = null;
    
    for (let attempt = 0; attempt <= this.config.maxRetryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const appError = this.handleError(error, context, {
          ...metadata,
          retryCount: attempt,
          maxRetries: this.config.maxRetryAttempts
        });
        
        lastError = appError;
        
        // Don't retry if error is not retryable or we've reached max attempts
        if (!appError.isRetryable() || attempt >= this.config.maxRetryAttempts) {
          break;
        }
        
        // Wait before retry with exponential backoff
        const delay = this.config.retryDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new AppError(
      ErrorCode.UNKNOWN_ERROR,
      'Unknown error occurred during retry execution',
      ErrorSeverity.ERROR,
      context,
      metadata
    );
  }
  
  /**
   * Create error handler for specific component/context
   */
  public createComponentHandler(component: string) {
    return {
      handleError: (error: unknown, context: Partial<ErrorContext> = {}, metadata: Partial<ErrorMetadata> = {}) =>
        this.handleError(error, context, { ...metadata, component }),
      
      handleFirebaseError: (error: unknown, context: Partial<ErrorContext> = {}, metadata: Partial<ErrorMetadata> = {}) =>
        this.handleFirebaseError(error, context, { ...metadata, component }),
      
      handleNetworkError: (error: unknown, context: Partial<ErrorContext> = {}, metadata: Partial<ErrorMetadata> = {}) =>
        this.handleNetworkError(error, context, { ...metadata, component }),
      
      handleValidationError: (error: unknown, field?: string, context: Partial<ErrorContext> = {}, metadata: Partial<ErrorMetadata> = {}) =>
        this.handleValidationError(error, field, context, { ...metadata, component }),
      
      executeWithRetry: <T>(fn: () => Promise<T>, context: Partial<ErrorContext> = {}, metadata: Partial<ErrorMetadata> = {}) =>
        this.executeWithRetry(fn, context, { ...metadata, component })
    };
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = ErrorHandler.getInstance();

/**
 * Utility functions for common error handling patterns
 */
export const ErrorUtils = {
  /**
   * Wrap async function with error handling
   */
  async wrapAsync<T>(
    fn: () => Promise<T>,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw errorHandler.handleError(error, context, metadata);
    }
  },
  
  /**
   * Wrap sync function with error handling
   */
  wrapSync<T>(
    fn: () => T,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ): T {
    try {
      return fn();
    } catch (error) {
      throw errorHandler.handleError(error, context, metadata);
    }
  },
  
  /**
   * Create error handler for specific route
   */
  createRouteHandler(route: string) {
    return errorHandler.createComponentHandler(`route:${route}`);
  },
  
  /**
   * Create error handler for specific service
   */
  createServiceHandler(service: string) {
    return errorHandler.createComponentHandler(`service:${service}`);
  }
};
