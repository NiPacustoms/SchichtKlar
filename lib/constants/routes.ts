// Zentrale Route-Constants für Schichtklar App

export const ROUTES = {
  // Root & Auth
  HOME: '/',
  LOGIN: '/anmelden',
  /** @deprecated Die öffentliche Registrierung ist deaktiviert. Verwenden Sie ADMIN_REGISTER für Admin-Registrierungen. */
  REGISTER: '/registrieren',
  ADMIN_REGISTER: '/admin-registrieren',
  AUTH_CALLBACK: '/anmeldung/rueckruf',

  // Legal
  IMPRINT: '/recht/impressum',
  PRIVACY: '/recht/datenschutz',

  // Employee-Routen (deutsch)
  EMPLOYEE: {
    DASHBOARD: '/employee/arbeitsplatz',
    DIENSTPLAN: '/employee/dienstplan',
    ZEITERFASSUNG: '/employee/zeiterfassung',
    ZEITEN: '/employee/zeiten',
    PROFIL: '/employee/profil',
    DOKUMENTE: '/employee/dokumente',
    ASSIGNMENTS: '/employee/einsaetze',
    EINRICHTUNGEN: '/employee/einrichtungen',
    BERICHTE: '/employee/berichte',
    BENACHRICHTIGUNGEN: '/employee/benachrichtigungen',
  },

  // Admin-Routen
  ADMIN: {
    ROOT: '/admin',
    SHIFTS: '/admin/schichten',
    DIENSTPLAN: '/admin/dienstplan',
    MITARBEITER: '/admin/mitarbeiter',
    MITARBEITER_DETAIL: (uid: string) => `/admin/mitarbeiter/${uid}`,
    EINRICHTUNGEN: '/admin/einrichtungen',
    EINRICHTUNGEN_DETAIL: (id: string) => `/admin/einrichtungen/${id}`,
    STUNDEN: '/admin/stunden',
    BERICHTE: '/admin/berichte',
    EINSTELLUNGEN: '/admin/einstellungen',
    UEBERSICHT: '/admin/uebersicht',
    EINSAETZE: '/admin/einsaetze',
    AKTIVITAETEN: '/admin/aktivitaeten',
    PRÜFPROTOKOLLE: '/admin/pruefprotokolle',
    DOCUMENTE_VORLAGEN: '/admin/dokumente/vorlagen',
    PERSONAL_KOMPAKT: '/admin/personal-kompakt',
    STAFF_SIMPLE: '/admin/staff-simple',
  },
} as const;

// Navigation-Konfiguration für verschiedene Rollen (alle Labels auf Deutsch)
export const NAVIGATION = {
  NURSE: [
    { href: ROUTES.EMPLOYEE.DASHBOARD, label: 'Arbeitsplatz', icon: 'Home' },
    { href: ROUTES.EMPLOYEE.DIENSTPLAN, label: 'Dienstplan', icon: 'CalendarMonth' },
    { href: ROUTES.EMPLOYEE.ZEITERFASSUNG, label: 'Zeit', icon: 'AccessTime' },
    { href: ROUTES.EMPLOYEE.PROFIL, label: 'Profil', icon: 'Person' },
  ],
  ADMIN: [
    { href: '/admin/uebersicht', label: 'Übersicht', icon: 'Dashboard' },
    { href: ROUTES.ADMIN.SHIFTS, label: 'Schichten', icon: 'CalendarMonth' },
    { href: ROUTES.ADMIN.MITARBEITER, label: 'Personal', icon: 'People' },
    { href: ROUTES.ADMIN.EINRICHTUNGEN, label: 'Standorte', icon: 'Business' },
  ],
} as const;

// Route-Gruppen für Layouts (nicht mehr benötigt)
export const ROUTE_GROUPS = {
  MITARBEITER: 'employee',
  ADMIN: 'admin',
  AUTH: 'auth',
} as const;

// Hilfsfunktionen
export const isAdminRoute = (pathname: string): boolean => {
  return pathname.startsWith('/admin');
};

export const isMitarbeiterRoute = (pathname: string): boolean => {
  return pathname.startsWith('/employee');
};

export const isAuthRoute = (pathname: string): boolean => {
  return pathname.startsWith('/anmelden') || 
         pathname.startsWith('/registrieren') || 
         pathname.startsWith('/admin-registrieren') ||
         pathname.startsWith('/passwort-vergessen') ||
         pathname.startsWith('/anmeldung/') ||
         pathname.startsWith('/recht/');
};
