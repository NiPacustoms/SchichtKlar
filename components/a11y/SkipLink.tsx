'use client';

import React from 'react';

export function SkipLink() {
  return (
    <a
      href="#main-content"
      style={{
        position: 'absolute',
        top: '-100%',
        left: 8,
        zIndex: 9999,
        padding: '8px 16px',
        background: '#1976d2',
        color: '#fff',
        borderRadius: 4,
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'top 0.1s',
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.top = '8px';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.top = '-100%';
      }}
    >
      Zum Hauptinhalt springen
    </a>
  );
}
