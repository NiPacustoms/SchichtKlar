/**
 * Structured Logging System for JobFlow Application
 * 
 * Provides consistent logging across development and production environments
 * with context injection, log levels, and external service integration.
 */

import { AppError, ErrorCode } from './ErrorTypes';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  route?: string;
  component?: string;
  action?: string;
  requestId?: string;
  userAgent?: string;
  timestamp: Date;
  additionalData?: Record<string, unknown>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: AppError;
  metadata?: Record<string, unknown>;
}

export interface LoggerConfig {
  enableConsoleLogging: boolean;
  enableStructuredLogging: boolean;
  enableErrorReporting: boolean;
  logLevel: LogLevel;
  enableSourceMaps: boolean;
  enablePerformanceLogging: boolean;
}

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private isDevelopment: boolean;
  
  private constructor(config: Partial<LoggerConfig> = {}) {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    this.config = {
      enableConsoleLogging: true,
      enableStructuredLogging: true,
      enableErrorReporting: !this.isDevelopment,
      logLevel: this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
      enableSourceMaps: !this.isDevelopment,
      enablePerformanceLogging: this.isDevelopment,
      ...config
    };
  }
  
  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }
  
  /**
   * Log debug message
   */
  public debug(message: string, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }
  
  /**
   * Log info message
   */
  public info(message: string, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }
  
  /**
   * Log warning message
   */
  public warn(message: string, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context, undefined, metadata);
  }
  
  /**
   * Log error message
   */
  public error(message: string, error?: AppError | Error, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>): void {
    const appError = error instanceof AppError ? error : 
                    error ? new AppError(ErrorCode.UNKNOWN_ERROR, error.message) : undefined;
    this.log(LogLevel.ERROR, message, context, appError, metadata);
  }
  
  /**
   * Log critical error message
   */
  public critical(message: string, error?: AppError | Error, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>): void {
    const appError = error instanceof AppError ? error : 
                    error ? new AppError(ErrorCode.UNKNOWN_ERROR, error.message) : undefined;
    this.log(LogLevel.CRITICAL, message, context, appError, metadata);
  }
  
  /**
   * Log performance metrics
   */
  public performance(operation: string, duration: number, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>): void {
    if (!this.config.enablePerformanceLogging) return;
    
    this.info(`Performance: ${operation}`, context, {
      ...metadata,
      operation,
      duration,
      performance: true
    });
  }
  
  /**
   * Log user action
   */
  public userAction(action: string, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>): void {
    this.info(`User Action: ${action}`, context, {
      ...metadata,
      action,
      userAction: true
    });
  }
  
  /**
   * Log API request/response
   */
  public apiRequest(
    method: string,
    url: string,
    status: number,
    duration: number,
    context: Partial<LogContext> = {},
    metadata?: Record<string, unknown>
  ): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    
    this.log(level, `API ${method} ${url}`, context, undefined, {
      ...metadata,
      method,
      url,
      status,
      duration,
      apiRequest: true
    });
  }
  
  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context: Partial<LogContext>,
    error?: AppError,
    metadata?: Record<string, unknown>
  ): void {
    // Check if we should log this level
    if (!this.shouldLog(level)) return;
    
    const logContext: LogContext = {
      timestamp: new Date(),
      ...context
    };
    
    const logEntry: LogEntry = {
      level,
      message,
      context: logContext,
      error,
      metadata
    };
    
    // Console logging for development
    if (this.config.enableConsoleLogging) {
      this.logToConsole(logEntry);
    }
    
    // Structured logging for production
    if (this.config.enableStructuredLogging) {
      this.logStructured(logEntry);
    }
    
    // Error reporting for critical errors
    if (this.config.enableErrorReporting && level === LogLevel.CRITICAL) {
      this.reportError(logEntry);
    }
  }
  
  /**
   * Check if we should log at this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }
  
  /**
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, context, error, metadata } = entry;
    
    // Suppress expected Firestore permission-denied warnings for shifts
    // These are expected behavior when user is not yet authenticated or companyId is not loaded
    if (level === LogLevel.WARN && 
        typeof message === 'string' &&
        message.includes('Firestore access denied for shifts') &&
        (message.includes('likely due to security rules') || message.includes('missing authentication'))) {
      // Silently skip this expected warning
      return;
    }
    
    const contextStr = this.formatContext(context);
    const logMethod = this.getConsoleMethod(level);
    const formattedMessage = this.formatConsoleMessage(level, message, contextStr, error);
    
    logMethod(formattedMessage);
    
    // Log error details separately if present
    if (error) {
      console.error('Error Details:', error.toObject());
    }
    
    // Log metadata separately if present
    if (metadata && Object.keys(metadata).length > 0) {
      console.log('Metadata:', metadata);
    }
  }
  
  /**
   * Log structured data (JSON)
   */
  private logStructured(entry: LogEntry): void {
    // Suppress expected Firestore permission-denied warnings for shifts
    // These are expected behavior when user is not yet authenticated or companyId is not loaded
    if (entry.level === LogLevel.WARN && 
        typeof entry.message === 'string' &&
        entry.message.includes('Firestore access denied for shifts') &&
        (entry.message.includes('likely due to security rules') || entry.message.includes('missing authentication'))) {
      // Silently skip this expected warning
      return;
    }
    
    const structuredLog = {
      timestamp: entry.context.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      context: entry.context,
      error: entry.error?.toObject(),
      metadata: entry.metadata,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown'
    };
    
    // In production, this would typically go to a logging service
    // For now, we'll use console.log with JSON.stringify
    console.log(JSON.stringify(structuredLog));
  }
  
  /**
   * Report critical errors to external service
   */
  private reportError(entry: LogEntry): void {
    // This is where we would integrate with Sentry, LogRocket, etc.
    // For now, we'll prepare the data structure
    
    const errorReport = {
      timestamp: entry.context.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      context: entry.context,
      error: entry.error?.toObject(),
      metadata: entry.metadata,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    };
    
    // TODO: Integrate with Sentry or other error reporting service
    // Sentry.captureException(entry.error, { extra: errorReport });
    
    console.error('CRITICAL ERROR REPORT:', errorReport);
  }
  
  /**
   * Get appropriate console method for log level
   */
  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }
  
  /**
   * Format console message with colors and styling
   */
  private formatConsoleMessage(
    level: LogLevel,
    message: string,
    contextStr: string,
    error?: AppError,
  ): string {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.CRITICAL]: '\x1b[35m' // Magenta
    };
    
    const reset = '\x1b[0m';
    const color = colors[level];
    const levelStr = level.toUpperCase().padEnd(8);
    
    let formatted = `${color}[${levelStr}]${reset} ${message}`;
    
    if (contextStr) {
      formatted += ` ${color}${contextStr}${reset}`;
    }
    
    if (error) {
      formatted += ` ${color}Error: ${error.userMessage}${reset}`;
    }
    
    return formatted;
  }
  
  /**
   * Format context for console display
   */
  private formatContext(context: LogContext): string {
    const parts: string[] = [];
    
    if (context.component) parts.push(`[${context.component}]`);
    if (context.action) parts.push(`(${context.action})`);
    if (context.route) parts.push(`route:${context.route}`);
    if (context.userId) parts.push(`user:${context.userId}`);
    
    return parts.join(' ');
  }
  
  /**
   * Create logger for specific component
   */
  public createComponentLogger(component: string) {
    return {
      debug: (message: string, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>) =>
        this.debug(message, { ...context, component }, metadata),
      
      info: (message: string, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>) =>
        this.info(message, { ...context, component }, metadata),
      
      warn: (message: string, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>) =>
        this.warn(message, { ...context, component }, metadata),
      
      error: (message: string, error?: AppError | Error, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>) =>
        this.error(message, error, { ...context, component }, metadata),
      
      critical: (message: string, error?: AppError | Error, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>) =>
        this.critical(message, error, { ...context, component }, metadata),
      
      performance: (operation: string, duration: number, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>) =>
        this.performance(operation, 0, context, { ...metadata, component }),
      
      userAction: (action: string, context: Partial<LogContext> = {}, metadata?: Record<string, unknown>) =>
        this.userAction(action, { ...context, component }, metadata)
    };
  }
}

/**
 * Global logger instance
 */
export const logger = Logger.getInstance();

/**
 * Utility functions for common logging patterns
 */
export const LogUtils = {
  /**
   * Create logger for specific route
   */
  createRouteLogger(route: string) {
    return logger.createComponentLogger(`route:${route}`);
  },
  
  /**
   * Create logger for specific service
   */
  createServiceLogger(service: string) {
    return logger.createComponentLogger(`service:${service}`);
  },
  
  /**
   * Create logger for specific component
   */
  createComponentLogger(component: string) {
    return logger.createComponentLogger(component);
  },
  
  /**
   * Log function execution time
   */
  async logExecutionTime<T>(
    operation: string,
    fn: () => Promise<T>,
    context: Partial<LogContext> = {}
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      logger.performance(operation, duration, context);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`Failed: ${operation}`, error as Error, context, { duration });
      throw error;
    }
  }
};
