'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Typography } from '@mui/material';

export default function DebugEnvPage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { canAccessAdminArea } = usePermissions();
  const hasAccess = canAccessAdminArea;

  if (loading || !mounted) {
    return (
      <PageContainer maxWidth="standard">
        <Typography variant="h5" component="h1" sx={{ fontFamily: 'monospace', mb: 2 }}>
          Environment Variables Debug
        </Typography>
        <Typography>Lade...</Typography>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer maxWidth="standard">
        <Typography variant="h5" component="h1" sx={{ fontFamily: 'monospace', mb: 2 }}>
          Environment Variables Debug
        </Typography>
        <p style={{ color: '#b91c1c', marginBottom: 16 }}>
          Du musst angemeldet sein, um diese Seite zu sehen.
        </p>
        <Link
          href="/anmelden"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            borderRadius: 6,
            backgroundColor: '#2563eb',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Zum Login →
        </Link>
      </PageContainer>
    );
  }

  if (!hasAccess) {
    return (
      <PageContainer maxWidth="standard">
        <Typography variant="h5" component="h1" sx={{ fontFamily: 'monospace', mb: 2 }}>
          Environment Variables Debug
        </Typography>
        <Typography color="error">
          Zugriff verweigert. Nur Administratoren dürfen diese Seite aufrufen.
        </Typography>
      </PageContainer>
    );
  }

  const envVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  return (
    <PageContainer maxWidth="standard">
      <Typography variant="h5" component="h1" sx={{ fontFamily: 'monospace', mb: 2 }}>
        Environment Variables Debug (Client-Side)
      </Typography>
      <p style={{ color: 'orange' }}>
        ⚠️ Diese Seite zeigt die Variablen, wie sie im Browser verfügbar sind.
      </p>
      <table border={1} cellPadding={10} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Variable Name</th>
            <th>Value Present</th>
            <th>Value Preview</th>
          </tr>
        </thead>
        <tbody>
          {envVars.map(varName => {
            // Try multiple ways to access the variable
            const value =
              (process.env as Record<string, string | undefined>)[varName] ||
              (window as unknown as { __ENV__?: Record<string, string | undefined> }).__ENV__?.[
                varName
              ] ||
              (typeof process !== 'undefined' && process.env && process.env[varName]) ||
              '';

            // SECURITY: eval() entfernt - verwende nur direkten Zugriff
            // Inline-Werte werden von Next.js automatisch eingefügt
            const finalValue = value;

            return (
              <tr key={varName}>
                <td>{varName}</td>
                <td style={{ color: finalValue ? 'green' : 'red' }}>
                  {finalValue ? '✅ YES' : '❌ NO'}
                </td>
                <td>
                  {finalValue ? `${finalValue.substring(0, 20)}...` : 'undefined'}
                  {!finalValue && (
                    <span style={{ fontSize: '10px', color: 'gray', display: 'block' }}>
                      process.env: {value ? 'has value' : 'undefined'}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </PageContainer>
  );
}
