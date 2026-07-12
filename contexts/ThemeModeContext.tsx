'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeModeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

/**
 * Produktentscheidung: Schichtklar ist immer hell („Clean & Light“).
 * Der Modus ist fest auf 'light' gepinnt – Systemeinstellung und frühere
 * gespeicherte Dunkel-Wahl werden ignoriert. Die Context-API bleibt aus
 * Kompatibilität bestehen (setMode/toggleMode sind No-ops).
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', 'light');
    root.classList.remove('dark');
    try {
      // Alte gespeicherte Dunkel-Wahl aufräumen, damit nichts mehr kippen kann
      localStorage.removeItem('schichtklar-theme-mode');
      localStorage.removeItem('jobflow-theme-mode');
    } catch {
      // ignore
    }
  }, []);

  const value: ThemeModeContextValue = {
    mode: 'light',
    setMode: () => {},
    toggleMode: () => {},
  };

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    return {
      mode: 'light',
      setMode: () => {},
      toggleMode: () => {},
    };
  }
  return ctx;
}
