'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logging';

/**
 * Initialisiert die L8-Plugin-Registry einmalig beim App-Start (nur im Browser).
 * Dynamischer Import verhindert, dass composition/Firebase beim Server-Render geladen werden.
 */
export function PluginInit() {
  useEffect(() => {
    import('@/src/composition')
      .then(({ initPlugins }) => initPlugins())
      .catch((err) => {
        logger.warn('[PluginInit] initPlugins failed', err instanceof Error ? err : new Error(String(err)));
      });
  }, []);
  return null;
}
