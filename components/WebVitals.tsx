'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WebVitals] ${metric.name}: ${Math.round(metric.value)}ms`);
    }
    // In production: an Analytics-Endpoint senden (z. B. Sentry, Plausible)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/vitals', body);
      }
    }
  });
  return null;
}
