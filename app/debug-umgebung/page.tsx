'use client';

import { useEffect, useState } from 'react';

export default function DebugEnvPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const envVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  if (!mounted) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>Environment Variables Debug</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Debug (Client-Side)</h1>
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
          {envVars.map((varName) => {
            // Try multiple ways to access the variable
            const value = 
              (process.env as Record<string, string | undefined>)[varName] || 
              ((window as unknown as { __ENV__?: Record<string, string | undefined> }).__ENV__?.[varName]) ||
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
    </div>
  );
}
