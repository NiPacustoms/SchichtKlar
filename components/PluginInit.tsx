'use client';

import { useEffect } from 'react';

/**
 * Initialisiert die L8-Plugin-Registry einmalig beim App-Start (nur im Browser).
 * Dynamischer Import verhindert, dass composition/Firebase beim Server-Render geladen werden.
 */
export function PluginInit() {
  useEffect(() => {
    import('@/src/composition')
      .then(({ initPlugins }) => initPlugins())
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[PluginInit] initPlugins failed', err);
        }
      });
  }, []);
  return null;
}
