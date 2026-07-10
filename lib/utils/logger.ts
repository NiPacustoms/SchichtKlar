/**
 * Zentrales Logging-Utility für JobFlow
 * 
 * Optimiert für Performance:
 * - In Production werden Logs deaktiviert (tree-shaking)
 * - In Development werden Logs nur bei Bedarf ausgegeben
 * - Reduziert Fast Refresh Rebuilds durch optimierte Logging-Strategie
 */

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Logging-Level Konfiguration
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
} as const;

// Aktuelles Log-Level (kann über Environment Variable gesteuert werden)
const CURRENT_LOG_LEVEL = IS_PRODUCTION
  ? LOG_LEVELS.ERROR // In Production nur Errors
  : IS_DEVELOPMENT
  ? LOG_LEVELS.DEBUG // In Development alles
  : LOG_LEVELS.INFO;

/**
 * Logger-Klasse mit optimierter Performance
 */
class Logger {
  private shouldLog(level: number): boolean {
    return level >= CURRENT_LOG_LEVEL;
  }

  /**
   * Debug-Logs (nur in Development)
   */
  debug(...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG) && IS_DEVELOPMENT) {
       
      console.debug('[DEBUG]', ...args);
    }
  }

  /**
   * Info-Logs (Development + Production bei Bedarf)
   */
  info(...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
       
      console.info('[INFO]', ...args);
    }
  }

  /**
   * Warn-Logs
   */
  warn(...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
       
      console.warn('[WARN]', ...args);
    }
  }

  /**
   * Error-Logs (immer aktiv)
   */
  error(...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
       
      console.error('[ERROR]', ...args);
    }
  }

  /**
   * Gruppierte Logs (nur in Development)
   */
  group(label: string): void {
    if (IS_DEVELOPMENT) {
       
      console.group(label);
    }
  }

  groupEnd(): void {
    if (IS_DEVELOPMENT) {
       
      console.groupEnd();
    }
  }

  /**
   * Performance-Messung (nur in Development)
   */
  time(label: string): void {
    if (IS_DEVELOPMENT) {
       
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (IS_DEVELOPMENT) {
       
      console.timeEnd(label);
    }
  }
}

// Singleton-Instanz
export const logger = new Logger();

// Named Exports für einfachere Verwendung
export const log = logger.info.bind(logger);
export const logDebug = logger.debug.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);

// Default Export
export default logger;

// Stubs for optional performance/analytics (no-op if not implemented)
export const PerformanceMonitor = {
  startTimer: (_label: string): void => {},
  endTimer: (_label: string, _meta?: Record<string, unknown>): void => {},
};

export const UserActionTracker = {
  trackAction: (_action: string, _meta?: Record<string, unknown>): void => {},
};

