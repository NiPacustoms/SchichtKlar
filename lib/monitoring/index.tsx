import React from 'react';
import * as Sentry from '@sentry/nextjs';

export interface LogContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  context?: LogContext;
}

export interface ErrorReport {
  error: Error;
  context?: LogContext;
  userId?: string;
  timestamp: Date;
}

export interface UserAction {
  action: string;
  userId?: string;
  timestamp: Date;
  context?: LogContext;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: Date;
}

export interface HealthCheck {
  name: string;
  status: boolean;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface MonitoringConfig {
  enableErrorTracking: boolean;
  enablePerformanceMonitoring: boolean;
  enableUserActionTracking: boolean;
  enableNetworkMonitoring: boolean;
  enableHealthChecks: boolean;
  sampleRate: number;
  environment: string;
  release?: string;
  userId?: string;
}

export interface MonitoringData {
  errors: ErrorReport[];
  performance: PerformanceMetrics[];
  userActions: UserAction[];
  networkRequests: NetworkRequest[];
  healthChecks: HealthCheck[];
  timestamp: Date;
}

export interface MonitoringProviderProps {
  children: React.ReactNode;
  config?: Partial<MonitoringConfig>;
}

export interface MonitoringContextType {
  config: MonitoringConfig;
  trackError: (error: Error, context?: LogContext) => void;
  trackPerformance: (operation: string, duration: number, context?: LogContext) => void;
  trackUserAction: (action: string, context?: LogContext) => void;
  trackNetworkRequest: (request: Omit<NetworkRequest, 'timestamp'>) => void;
  trackHealthCheck: (check: Omit<HealthCheck, 'timestamp'>) => void;
  getMonitoringData: () => MonitoringData;
  clearData: () => void;
}

export const MonitoringContext = React.createContext<MonitoringContextType | null>(null);

export const useMonitoring = () => {
  const context = React.useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};

export const MonitoringProvider: React.FC<MonitoringProviderProps> = ({ children, config = {} }) => {
  const defaultConfig: MonitoringConfig = {
    enableErrorTracking: true,
    enablePerformanceMonitoring: true,
    enableUserActionTracking: true,
    enableNetworkMonitoring: true,
    enableHealthChecks: true,
    sampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
    ...config
  };

  const [data, setData] = React.useState<MonitoringData>({
    errors: [],
    performance: [],
    userActions: [],
    networkRequests: [],
    healthChecks: [],
    timestamp: new Date()
  });

  React.useEffect(() => {
    if (defaultConfig.userId) {
      Sentry.setUser({ id: defaultConfig.userId });
    } else {
      Sentry.setUser(null);
    }
    Sentry.setTag('app.environment', defaultConfig.environment);
  }, [defaultConfig.environment, defaultConfig.userId]);

  const trackError = React.useCallback((error: Error, context?: LogContext) => {
    if (!defaultConfig.enableErrorTracking) return;
    
    const errorReport: ErrorReport = {
      error,
      context,
      userId: defaultConfig.userId,
      timestamp: new Date()
    };
    
    setData(prev => ({
      ...prev,
      errors: [...prev.errors, errorReport]
    }));
    
    Sentry.withScope(scope => {
      if (context?.component) scope.setTag('component', context.component);
      if (context?.action) scope.setExtra('action', context.action);
      if (context?.metadata) scope.setContext('metadata', context.metadata as Record<string, unknown>);
      scope.setExtra('capturedAt', new Date().toISOString());
      Sentry.captureException(error);
    });
  }, [defaultConfig.enableErrorTracking, defaultConfig.userId]);

  const trackPerformance = React.useCallback((operation: string, duration: number, context?: LogContext) => {
    if (!defaultConfig.enablePerformanceMonitoring) return;
    
    const metrics: PerformanceMetrics = {
      operation,
      duration,
      timestamp: new Date(),
      context
    };
    
    setData(prev => ({
      ...prev,
      performance: [...prev.performance, metrics]
    }));

    Sentry.addBreadcrumb({
      category: 'performance',
      message: operation,
      data: {
        duration,
        component: context?.component,
        action: context?.action,
      },
      level: 'info',
    });
  }, [defaultConfig.enablePerformanceMonitoring]);

  const trackUserAction = React.useCallback((action: string, context?: LogContext) => {
    if (!defaultConfig.enableUserActionTracking) return;
    
    const userAction: UserAction = {
      action,
      userId: defaultConfig.userId,
      timestamp: new Date(),
      context
    };
    
    setData(prev => ({
      ...prev,
      userActions: [...prev.userActions, userAction]
    }));

    Sentry.addBreadcrumb({
      category: 'user',
      message: action,
      data: {
        component: context?.component,
        metadata: context?.metadata,
      },
      level: 'info',
    });
  }, [defaultConfig.enableUserActionTracking, defaultConfig.userId]);

  const trackNetworkRequest = React.useCallback((request: Omit<NetworkRequest, 'timestamp'>) => {
    if (!defaultConfig.enableNetworkMonitoring) return;
    
    const networkRequest: NetworkRequest = {
      ...request,
      timestamp: new Date()
    };
    
    setData(prev => ({
      ...prev,
      networkRequests: [...prev.networkRequests, networkRequest]
    }));

    Sentry.addBreadcrumb({
      category: 'http',
      message: `${request.method} ${request.url}`,
      data: {
        status: request.status,
        duration: request.duration,
      },
      level: request.status >= 500 ? 'error' : 'info',
    });
  }, [defaultConfig.enableNetworkMonitoring]);

  const trackHealthCheck = React.useCallback((check: Omit<HealthCheck, 'timestamp'>) => {
    if (!defaultConfig.enableHealthChecks) return;
    
    const healthCheck: HealthCheck = {
      ...check,
      timestamp: new Date()
    };
    
    setData(prev => ({
      ...prev,
      healthChecks: [...prev.healthChecks, healthCheck]
    }));

    if (!check.status) {
      Sentry.captureMessage(`HealthCheck failed: ${check.name}`, {
        level: 'warning',
        extra: check.details ?? {},
      });
    } else {
      Sentry.addBreadcrumb({
        category: 'health',
        message: check.name,
        data: { status: check.status, details: check.details },
        level: 'info',
      });
    }
  }, [defaultConfig.enableHealthChecks]);

  const getMonitoringData = React.useCallback(() => data, [data]);

  const clearData = React.useCallback(() => {
    setData({
      errors: [],
      performance: [],
      userActions: [],
      networkRequests: [],
      healthChecks: [],
      timestamp: new Date()
    });
  }, []);

  const value: MonitoringContextType = {
    config: defaultConfig,
    trackError,
    trackPerformance,
    trackUserAction,
    trackNetworkRequest,
    trackHealthCheck,
    getMonitoringData,
    clearData
  };

  return (
    <MonitoringContext.Provider value={value}>
      {children}
    </MonitoringContext.Provider>
  );
};

export default MonitoringProvider;