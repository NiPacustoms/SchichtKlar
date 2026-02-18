'use client';

import { logger } from '@/lib/logging';

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

interface UsePerformanceMonitoringOptions {
  componentName: string;
  enabled?: boolean;
  logToConsole?: boolean;
  threshold?: number; // Log if render time exceeds threshold (ms)
}

export function usePerformanceMonitoring({
  componentName,
  enabled = process.env.NODE_ENV === 'development',
  logToConsole = false,
  threshold = 16 // 16ms = 60fps
}: UsePerformanceMonitoringOptions) {
  const renderStartTime = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);

  useEffect(() => {
    if (!enabled) return;

    renderStartTime.current = performance.now();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const renderTime = performance.now() - renderStartTime.current;
    
    const newMetric: PerformanceMetrics = {
      renderTime,
      componentName,
      timestamp: Date.now()
    };

    setMetrics(prev => [...prev.slice(-9), newMetric]); // Keep last 10 metrics

    if (logToConsole && renderTime > threshold) {
      logger.warn(`🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }, [enabled, componentName, logToConsole, threshold]);

  const getAverageRenderTime = () => {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, metric) => sum + metric.renderTime, 0) / metrics.length;
  };

  const getMaxRenderTime = () => {
    if (metrics.length === 0) return 0;
    return Math.max(...metrics.map(metric => metric.renderTime));
  };

  const clearMetrics = () => {
    setMetrics([]);
  };

  return {
    metrics,
    averageRenderTime: getAverageRenderTime(),
    maxRenderTime: getMaxRenderTime(),
    clearMetrics,
    isSlowRender: metrics.length > 0 && getAverageRenderTime() > threshold
  };
}

// Hook for measuring specific operations
export function useOperationTimer(operationName: string) {
  const startTime = useRef<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const startTimer = () => {
    startTime.current = performance.now();
  };

  const endTimer = () => {
    const endTime = performance.now();
    const operationDuration = endTime - startTime.current;
    setDuration(operationDuration);
    
    if (process.env.NODE_ENV === 'development') {
      logger.info(`⏱️ ${operationName}: ${operationDuration.toFixed(2)}ms`);
    }
    
    return operationDuration;
  };

  return {
    startTimer,
    endTimer,
    duration
  };
}

export default usePerformanceMonitoring;
