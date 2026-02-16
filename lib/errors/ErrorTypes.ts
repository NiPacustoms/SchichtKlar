/**
 * Error Types and Classes for JobFlow Application
 * 
 * Provides a comprehensive error handling system with typed error classes,
 * severity levels, and structured error information for better debugging
 * and user experience.
 */

export enum ErrorSeverity {
  CRITICAL = 'critical',
  ERROR = 'error', 
  WARNING = 'warning',
  INFO = 'info'
}

export enum ErrorCode {
  // Authentication & Authorization
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  
  // Validation Errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',
  VALIDATION_DUPLICATE_VALUE = 'VALIDATION_DUPLICATE_VALUE',
  
  // Network & Service Errors
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  SERVICE_RATE_LIMITED = 'SERVICE_RATE_LIMITED',
  
  // Firebase Specific
  FIREBASE_PERMISSION_DENIED = 'FIREBASE_PERMISSION_DENIED',
  FIREBASE_NOT_FOUND = 'FIREBASE_NOT_FOUND',
  FIREBASE_ALREADY_EXISTS = 'FIREBASE_ALREADY_EXISTS',
  FIREBASE_QUOTA_EXCEEDED = 'FIREBASE_QUOTA_EXCEEDED',
  FIREBASE_MISSING_INDEX = 'FIREBASE_MISSING_INDEX',
  
  // Business Logic
  SHIFT_CONFLICT = 'SHIFT_CONFLICT',
  SHIFT_FULL = 'SHIFT_FULL',
  QUALIFICATION_MISSING = 'QUALIFICATION_MISSING',
  TIMESHEET_INVALID = 'TIMESHEET_INVALID',
  INVITATION_EXPIRED = 'INVITATION_EXPIRED',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  route?: string;
  component?: string;
  action?: string;
  companyId?: string;
  reportId?: string;
  shiftId?: string;
  format?: string;
  timestamp: Date;
  userAgent?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorMetadata {
  component?: string;
  action?: string;
  retryable?: boolean;
  retryCount?: number;
  maxRetries?: number;
  originalError?: Error;
}

/**
 * Base Error Class for JobFlow Application
 * 
 * Provides structured error information with context, metadata,
 * and user-friendly messages in German.
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly metadata: ErrorMetadata;
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  
  constructor(
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.context = {
      timestamp: new Date(),
      ...context
    };
    this.metadata = {
      retryable: false,
      retryCount: 0,
      maxRetries: 3,
      ...metadata
    };
    
    // Generate user-friendly message
    this.userMessage = this.generateUserMessage();
    this.technicalMessage = message;
    
    // Ensure proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }
  
  /**
   * Generate user-friendly German error messages
   */
  private generateUserMessage(): string {
    const userMessages: Record<ErrorCode, string> = {
      // Authentication
      [ErrorCode.AUTH_REQUIRED]: 'Sie müssen sich anmelden, um fortzufahren.',
      [ErrorCode.AUTH_INVALID_TOKEN]: 'Ihre Anmeldung ist ungültig. Bitte melden Sie sich erneut an.',
      [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 'Sie haben keine Berechtigung für diese Aktion.',
      [ErrorCode.AUTH_SESSION_EXPIRED]: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
      [ErrorCode.INVITATION_EXPIRED]: 'Ihre Einladung ist abgelaufen.',
      
      // Validation
      [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Dieses Feld ist erforderlich.',
      [ErrorCode.VALIDATION_INVALID_FORMAT]: 'Das Format ist ungültig.',
      [ErrorCode.VALIDATION_OUT_OF_RANGE]: 'Der Wert liegt außerhalb des gültigen Bereichs.',
      [ErrorCode.VALIDATION_DUPLICATE_VALUE]: 'Dieser Wert existiert bereits.',
      
      // Network
      [ErrorCode.NETWORK_TIMEOUT]: 'Die Anfrage ist abgelaufen. Bitte versuchen Sie es erneut.',
      [ErrorCode.NETWORK_CONNECTION_FAILED]: 'Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
      [ErrorCode.SERVICE_UNAVAILABLE]: 'Der Service ist vorübergehend nicht verfügbar.',
      [ErrorCode.SERVICE_RATE_LIMITED]: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
      
      // Firebase
      [ErrorCode.FIREBASE_PERMISSION_DENIED]: 'Zugriff verweigert. Überprüfen Sie Ihre Berechtigungen.',
      [ErrorCode.FIREBASE_NOT_FOUND]: 'Die angeforderte Ressource wurde nicht gefunden.',
      [ErrorCode.FIREBASE_ALREADY_EXISTS]: 'Diese Ressource existiert bereits.',
      [ErrorCode.FIREBASE_QUOTA_EXCEEDED]: 'Speicherplatz überschritten. Bitte kontaktieren Sie den Administrator.',
      [ErrorCode.FIREBASE_MISSING_INDEX]: 'Für diese Auswertung fehlt ein Firestore-Index. Bitte erstellen Sie ihn im Firebase-Backend.',
      
      // Business Logic
      [ErrorCode.SHIFT_CONFLICT]: 'Zeitkonflikt: Sie haben bereits eine Schicht zu dieser Zeit.',
      [ErrorCode.SHIFT_FULL]: 'Die Schicht ist bereits voll besetzt.',
      [ErrorCode.QUALIFICATION_MISSING]: 'Fehlende Qualifikationen für diese Schicht.',
      [ErrorCode.TIMESHEET_INVALID]: 'Ungültige Zeiterfassung. Bitte überprüfen Sie Ihre Eingaben.',
      
      // System
      [ErrorCode.INTERNAL_ERROR]: 'Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      [ErrorCode.UNKNOWN_ERROR]: 'Ein unbekannter Fehler ist aufgetreten.'
    };
    
    return userMessages[this.code] || userMessages[ErrorCode.UNKNOWN_ERROR];
  }
  
  /**
   * Check if this error is retryable
   */
  public isRetryable(): boolean {
    return this.metadata.retryable === true && 
           (this.metadata.retryCount || 0) < (this.metadata.maxRetries || 3);
  }
  
  /**
   * Increment retry count
   */
  public incrementRetryCount(): AppError {
    return new AppError(
      this.code,
      this.technicalMessage,
      this.severity,
      this.context,
      {
        ...this.metadata,
        retryCount: (this.metadata.retryCount || 0) + 1
      }
    );
  }
  
  /**
   * Convert to plain object for logging/serialization
   */
  public toObject(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      severity: this.severity,
      message: this.technicalMessage,
      userMessage: this.userMessage,
      context: this.context,
      metadata: this.metadata,
      stack: this.stack
    };
  }
}

/**
 * Specific Error Classes for different error types
 */

export class ValidationError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(code, message, ErrorSeverity.WARNING, context, metadata);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(code, message, ErrorSeverity.ERROR, context, {
      retryable: true,
      ...metadata
    });
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(code, message, ErrorSeverity.ERROR, context, metadata);
    this.name = 'AuthError';
  }
}

export class ServiceError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(code, message, ErrorSeverity.ERROR, context, {
      retryable: true,
      ...metadata
    });
    this.name = 'ServiceError';
  }
}

export class CriticalError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    context: Partial<ErrorContext> = {},
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(code, message, ErrorSeverity.CRITICAL, context, metadata);
    this.name = 'CriticalError';
  }
}

/**
 * Utility function to create AppError from unknown error
 */
export function createAppError(
  error: unknown,
  fallbackCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  context: Partial<ErrorContext> = {}
): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    const normalizedMessage = error.message?.toLowerCase() ?? '';
    let resolvedCode = fallbackCode;

    if (fallbackCode === ErrorCode.UNKNOWN_ERROR) {
      if (normalizedMessage.includes('the query requires an index')) {
        resolvedCode = ErrorCode.FIREBASE_MISSING_INDEX;
      } else if (normalizedMessage.includes('missing or insufficient permissions')) {
        resolvedCode = ErrorCode.FIREBASE_PERMISSION_DENIED;
      }
    }

    return new AppError(
      resolvedCode,
      error.message,
      ErrorSeverity.ERROR,
      context,
      { originalError: error }
    );
  }
  
  return new AppError(
    fallbackCode,
    String(error),
    ErrorSeverity.ERROR,
    context
  );
}

/**
 * Utility function to check if error is of specific type
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Utility function to check error severity
 */
export function isCriticalError(error: unknown): boolean {
  return isAppError(error) && error.severity === ErrorSeverity.CRITICAL;
}

/**
 * Utility function to check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return isAppError(error) && error.isRetryable();
}
