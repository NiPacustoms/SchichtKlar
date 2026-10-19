'use client';

import { createContext, useContext } from 'react';

/**
 * Signalisiert Seiten, dass sie innerhalb der App-Shell (AppLayout) gerendert
 * werden. Die Shell setzt Seitenränder und Breite – PageContainer verzichtet
 * dann auf eigene, sonst doppelte Abstände und Zentrierung.
 */
export const AppShellContext = createContext<{ inShell: boolean }>({ inShell: false });

export const useAppShell = () => useContext(AppShellContext);
