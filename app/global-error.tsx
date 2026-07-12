'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Global Error Boundary – fängt Fehler im Root-Layout selbst ab (app/error.tsx
 * greift dort nicht). Muss eigenes <html>/<body> rendern und darf nicht von
 * Theme/Provider-Code abhängen, da genau dieser fehlgeschlagen sein kann.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          backgroundColor: '#252422',
          color: '#fffcf2',
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
          Etwas ist schiefgelaufen
        </h1>
        <p style={{ fontSize: 14, opacity: 0.8, maxWidth: 420, marginBottom: 8 }}>
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
        </p>
        {error?.digest && (
          <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 16 }}>
            Fehler-Referenz: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#005f73',
              color: '#fffcf2',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Erneut versuchen
          </button>
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid rgba(255,252,242,0.4)',
              backgroundColor: 'transparent',
              color: '#fffcf2',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Zur Startseite
          </button>
        </div>
      </body>
    </html>
  );
}
