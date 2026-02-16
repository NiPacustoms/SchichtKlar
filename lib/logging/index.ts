/**
 * Logging Configuration and Setup
 * 
 * Provides centralized logging configuration and initialization
 * for the JobFlow application.
 */

import { Logger, LogLevel, LoggerConfig } from '../errors/ErrorLogger';

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Default configuration
const defaultConfig: LoggerConfig = {
  enableConsoleLogging: true,
  enableStructuredLogging: true,
  enableErrorReporting: isProduction,
  logLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
  enableSourceMaps: isProduction,
  enablePerformanceLogging: isDevelopment,
};

// Initialize logger with configuration
export const logger = Logger.getInstance(defaultConfig);

// Performance monitoring utilities
class PerformanceMonitor {
  private static timers = new Map<string, number>();
  
  static startTimer(label: string): void {
    if (typeof window === 'undefined' || typeof performance === 'undefined') {
      return;
    }
    this.timers.set(label, performance.now());
  }
  
  static endTimer(label: string, context?: Record<string, unknown>): number {
    if (typeof window === 'undefined' || typeof performance === 'undefined') {
      return 0;
    }
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger.warn(`Timer '${label}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.timers.delete(label);
    
    logger.performance(`Timer: ${label}`, duration, context);
    return duration;
  }
  
  static async measureAsync<T>(
    label: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    this.startTimer(label);
    try {
      const result = await fn();
      this.endTimer(label, context);
      return result;
    } catch (error) {
      this.endTimer(label, { ...context, error: true });
      throw error;
    }
  }
}

// Error tracking utilities
class ErrorTracker {
  private static errorCounts = new Map<string, number>();
  private static errorRates = new Map<string, number[]>();
  
  static trackError(errorCode: string, context?: Record<string, unknown>): void {
    const count = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, count + 1);
    
    // Track error rate (last 100 errors)
    const rates = this.errorRates.get(errorCode) || [];
    rates.push(Date.now());
    if (rates.length > 100) {
      rates.shift();
    }
    this.errorRates.set(errorCode, rates);
    
    logger.error(`Error tracked: ${errorCode}`, undefined, {
      ...context,
      errorCode,
      count: count + 1
    } as Record<string, unknown>);
  }
  
  static getErrorStats(): Record<string, { count: number; rate: number }> {
    const stats: Record<string, { count: number; rate: number }> = {};
    
    for (const [code, count] of this.errorCounts) {
      const rates = this.errorRates.get(code) || [];
      const now = Date.now();
      const recentErrors = rates.filter(time => now - time < 60000); // Last minute
      
      stats[code] = {
        count,
        rate: recentErrors.length
      };
    }
    
    return stats;
  }
  
  static resetStats(): void {
    this.errorCounts.clear();
    this.errorRates.clear();
  }
}

// User action tracking
class UserActionTracker {
  private static actions: Array<{ action: string; timestamp: number; context?: Record<string, unknown> }> = [];
  
  static trackAction(action: string, context?: Record<string, unknown>): void {
    this.actions.push({
      action,
      timestamp: Date.now(),
      context
    });
    
    // Keep only last 1000 actions
    if (this.actions.length > 1000) {
      this.actions.shift();
    }
    
    logger.userAction(action, context);
  }
  
  static getRecentActions(minutes: number = 60): Array<{ action: string; timestamp: number; context?: Record<string, unknown> }> {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.actions.filter(action => action.timestamp > cutoff);
  }
  
  static getActionStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const action of this.actions) {
      stats[action.action] = (stats[action.action] || 0) + 1;
    }
    
    return stats;
  }
}

// Network monitoring
class NetworkMonitor {
  private static requests: Array<{ url: string; method: string; status: number; duration: number; timestamp: number }> = [];
  
  static trackRequest(url: string, method: string, status: number, duration: number): void {
    this.requests.push({
      url,
      method,
      status,
      duration,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 requests
    if (this.requests.length > 1000) {
      this.requests.shift();
    }
    
    logger.apiRequest(method, url, status, duration);
  }
  
  static getNetworkStats(): {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    slowestRequests: Array<{ url: string; duration: number }>;
  } {
    const now = Date.now();
    const recentRequests = this.requests.filter(req => now - req.timestamp < 300000); // Last 5 minutes
    
    const errorCount = recentRequests.filter(req => req.status >= 400).length;
    const errorRate = recentRequests.length > 0 ? (errorCount / recentRequests.length) * 100 : 0;
    
    const averageResponseTime = recentRequests.length > 0 
      ? recentRequests.reduce((sum, req) => sum + req.duration, 0) / recentRequests.length 
      : 0;
    
    const slowestRequests = recentRequests
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(req => ({ url: req.url, duration: req.duration }));
    
    return {
      totalRequests: recentRequests.length,
      errorRate,
      averageResponseTime,
      slowestRequests
    };
  }
}

// Application health monitoring
class HealthMonitor {
  private static healthChecks = new Map<string, () => Promise<boolean>>();
  private static lastHealthCheck = 0;
  private static healthStatus: Record<string, boolean> = {};
  
  static registerHealthCheck(name: string, check: () => Promise<boolean>): void {
    this.healthChecks.set(name, check);
  }
  
  static async performHealthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, check] of this.healthChecks) {
      try {
        results[name] = await check();
      } catch (error) {
        results[name] = false;
        logger.error(`Health check failed: ${name}`, error as Error);
      }
    }
    
    this.healthStatus = results;
    this.lastHealthCheck = Date.now();
    
    const allHealthy = Object.values(results).every(status => status);
    logger.info(`Health check completed`, { 
      results,
      timestamp: new Date(this.lastHealthCheck),
      allHealthy
    } as Record<string, unknown>);
    
    return results;
  }
  
  static getHealthStatus(): Record<string, boolean> {
    return { ...this.healthStatus };
  }
  
  static isHealthy(): boolean {
    return Object.values(this.healthStatus).every(status => status);
  }
}

// Initialize health checks
HealthMonitor.registerHealthCheck('database', async () => {
  // TODO: echte Datenbank-Prüfung integrieren
  return true;
});

HealthMonitor.registerHealthCheck('firebase', async () => {
  // TODO: echte Firebase-Prüfung integrieren
  return true;
});

// Export all monitoring utilities
export {
  PerformanceMonitor,
  ErrorTracker,
  UserActionTracker,
  NetworkMonitor,
  HealthMonitor
};
