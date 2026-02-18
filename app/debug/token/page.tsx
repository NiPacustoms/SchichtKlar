'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { debugTokenStatus, refreshTokenAndDebug, logTokenStatus } from '@/lib/utils/tokenDebug';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { Typography } from '@mui/material';

export default function DebugTokenPage() {
  const [token, setToken] = useState<string>('');
  const [tokenStatus, setTokenStatus] = useState<Awaited<
    ReturnType<typeof debugTokenStatus>
  > | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const loadTokenData = async (forceRefresh = false) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('Debug-Token-Seite ist nur in Entwicklung verfügbar');
      }
      if (!auth) {
        setError('Firebase nicht initialisiert');
        return;
      }

      // Prüfe Auth-Status
      const status = await debugTokenStatus();
      setTokenStatus(status);

      if (!status.authenticated || !auth.currentUser) {
        setError('Kein Nutzer eingeloggt');
        return;
      }

      const t = await auth.currentUser.getIdToken(forceRefresh);
      setToken(t);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let _cancelled = false;
    (async () => {
      await loadTokenData(false);
    })();
    return () => {
      _cancelled = true;
    };
  }, []);

  // Überwache Auth-State-Änderungen
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        // Benutzer hat sich eingeloggt, lade Daten neu
        await loadTokenData(false);
      } else {
        // Benutzer hat sich ausgeloggt
        setToken('');
        setTokenStatus(null);
        setError('Kein Nutzer eingeloggt');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      alert('Token kopiert');
    } catch {
      // ignore
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    const result = await refreshTokenAndDebug();
    if (result.success) {
      setTokenStatus(result.after);
      // Token neu laden
      await loadTokenData(true);
    } else {
      setError(result.error || 'Token-Refresh fehlgeschlagen');
    }
    setLoading(false);
  };

  const handleLogStatus = async () => {
    await logTokenStatus();
  };

  const isNotAuthenticated =
    !loading && (!tokenStatus?.authenticated || error === 'Kein Nutzer eingeloggt');

  return (
    <PageContainer maxWidth="standard">
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
        Debug: Token & Custom Claims
      </Typography>

      {loading && <p>Lade…</p>}

      {isNotAuthenticated && (
        <div style={{ padding: 16, backgroundColor: '#fef3c7', borderRadius: 8, marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#92400e' }}>
            ⚠️ Kein Nutzer eingeloggt
          </h2>
          <p style={{ color: '#92400e', marginBottom: 12 }}>
            Um den Token-Status zu prüfen, musst du dich zuerst anmelden.
          </p>
          <Link
            href="/anmelden"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 6,
              fontWeight: 600,
            }}
          >
            Zum Login →
          </Link>
        </div>
      )}

      {!loading && error && !isNotAuthenticated && (
        <div style={{ padding: 12, backgroundColor: '#fee2e2', borderRadius: 8, marginBottom: 16 }}>
          <p style={{ color: '#b91c1c', fontWeight: 600 }}>Fehler: {error}</p>
        </div>
      )}

      {!loading && !isNotAuthenticated && tokenStatus && tokenStatus.authenticated && (
        <div>
          {/* Token Status */}
          <div
            style={{ marginBottom: 24, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Token Status</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 8 }}>
              <div style={{ fontWeight: 600 }}>Authentifiziert:</div>
              <div>{tokenStatus.authenticated ? '✅ Ja' : '❌ Nein'}</div>

              {tokenStatus.authenticated && (
                <>
                  <div style={{ fontWeight: 600 }}>UID:</div>
                  <div style={{ fontFamily: 'monospace' }}>{tokenStatus.uid}</div>

                  <div style={{ fontWeight: 600 }}>Company ID:</div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      color: tokenStatus.companyId ? '#059669' : '#dc2626',
                    }}
                  >
                    {tokenStatus.companyId || '❌ NICHT GESETZT'}
                  </div>

                  <div style={{ fontWeight: 600 }}>Role:</div>
                  <div style={{ color: tokenStatus.role ? '#059669' : '#dc2626' }}>
                    {tokenStatus.role || '❌ NICHT GESETZT'}
                  </div>

                  <div style={{ fontWeight: 600 }}>Token Ablauf:</div>
                  <div style={{ fontFamily: 'monospace' }}>
                    {tokenStatus.tokenExpiry?.toLocaleString() || 'Unbekannt'}
                    {tokenStatus.needsRefresh && ' ⚠️ (Bald abgelaufen)'}
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                onClick={handleRefresh}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                🔄 Token Refresh
              </button>
              <button
                onClick={handleLogStatus}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                📋 Status in Konsole loggen
              </button>
            </div>
          </div>

          {/* All Claims */}
          {tokenStatus.authenticated && (
            <div
              style={{ marginBottom: 24, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                Alle Custom Claims
              </h2>
              <pre
                style={{
                  padding: 12,
                  backgroundColor: '#ffffff',
                  borderRadius: 6,
                  overflow: 'auto',
                  fontSize: 12,
                  fontFamily: 'monospace',
                }}
              >
                {JSON.stringify(tokenStatus.allClaims, null, 2)}
              </pre>
            </div>
          )}

          {/* Token */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>ID Token (Raw)</h2>
            <textarea
              value={token}
              readOnly
              rows={8}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: 11,
                padding: 12,
                borderRadius: 6,
                border: '1px solid #d1d5db',
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                marginTop: 8,
                padding: '8px 16px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              📋 In Zwischenablage kopieren
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, padding: 12, backgroundColor: '#fef3c7', borderRadius: 8 }}>
        <p style={{ color: '#92400e', margin: 0 }}>
          <strong>Hinweis:</strong> Diese Seite ist nur in <b>development</b> verfügbar.
        </p>
        <p style={{ color: '#92400e', margin: '8px 0 0 0', fontSize: 14 }}>
          Falls <code>companyId</code> nicht gesetzt ist, prüfe die Cloud Function Logs, ob Custom
          Claims korrekt synchronisiert werden.
        </p>
      </div>
    </PageContainer>
  );
}
