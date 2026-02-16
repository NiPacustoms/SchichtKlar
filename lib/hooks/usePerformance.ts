import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { debounce, throttle } from 'lodash';
import { logger } from '@/lib/logging';

// Debounced callback hook
export const useDebouncedCallback = <Args extends unknown[], R>(
  callback: (...args: Args) => R,
  delay: number
): ((...args: Args) => R) => {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return debouncedCallback as unknown as (...args: Args) => R;
};

// Throttled callback hook
export const useThrottledCallback = <Args extends unknown[], R>(
  callback: (...args: Args) => R,
  delay: number
): ((...args: Args) => R) => {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      throttledCallback.cancel();
    };
  }, [throttledCallback]);

  return throttledCallback as unknown as (...args: Args) => R;
};

// Optimized search hook
export const useOptimizedSearch = <T>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  debounceDelay: number = 300
) => {
  const [filteredData, setFilteredData] = useState<T[]>(data);
  const [isSearching, setIsSearching] = useState(false);

  const searchFunction = useCallback(
    (term: string) => {
      if (!term.trim()) {
        setFilteredData(data);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      
      const filtered = data.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(term.toLowerCase());
          }
          if (typeof value === 'number') {
            return value.toString().includes(term);
          }
          return false;
        })
      );

      setFilteredData(filtered);
      setIsSearching(false);
    },
    [data, searchFields]
  );

  const debouncedSearch = useDebouncedCallback(searchFunction, debounceDelay);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  return {
    filteredData,
    isSearching,
    search: debouncedSearch,
  };
};

// Virtual scrolling hook
export const useVirtualScrolling = <T>(
  itemHeight: number,
  containerHeight: number,
  data: T[]
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, data.length);

  const visibleItems = data.slice(startIndex, endIndex);
  const totalHeight = data.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useThrottledCallback((e: Event) => {
    const target = e.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, 16);

  useEffect(() => {
    if (containerRef) {
      containerRef.addEventListener('scroll', handleScroll);
      return () => containerRef.removeEventListener('scroll', handleScroll);
    }
  }, [containerRef, handleScroll]);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setContainerRef,
  };
};

// Image optimization hook
export const useImageOptimization = (src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}) => {
  const [optimizedSrc, setOptimizedSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setError(null);

    // Simulate image optimization
    const timer = setTimeout(() => {
      setOptimizedSrc(src);
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [src, options]);

  return {
    optimizedSrc,
    isLoading,
    error,
  };
};

// Memory usage hook
export const useMemoryUsage = () => {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    if ('memory' in (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } })) {
      const updateMemoryUsage = () => {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
        setMemoryUsage({
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
        });
      };

      updateMemoryUsage();
      const interval = setInterval(updateMemoryUsage, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  return memoryUsage;
};

// Performance monitoring hook
export const usePerformanceMonitoring = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[Perf] render', {}, { component: componentName, renderNum: renderCount.current, ms: renderTime.toFixed(2) });
    }
  });

  return {
    renderCount: renderCount.current,
  };
};

// Cache optimization hook
export const useCacheOptimization = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
  } = {}
) => {
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const cached = cache.current.get(key);
    const now = Date.now();
    const staleTime = options.staleTime || 5 * 60 * 1000; // 5 minutes

    if (cached && (now - cached.timestamp) < staleTime) {
      setData(cached.data);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cache.current.set(key, { data: result, timestamp: now });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, options.staleTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};

const performanceHooks = {
  useDebouncedCallback,
  useThrottledCallback,
  useOptimizedSearch,
  useVirtualScrolling,
  useImageOptimization,
  useMemoryUsage,
  usePerformanceMonitoring,
  useCacheOptimization,
};

export default performanceHooks;
