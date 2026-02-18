import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { PermissionsContext } from '@/contexts/PermissionsContext';

/**
 * Leerer Kontext für Storybook – keine Mock-Daten.
 * user: null, permissions: [], nur leere Funktionen für Kontext-API.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const emptyAuthContext = {
  user: null,
  firebaseUser: null,
  loading: false,
  authError: null as string | null,
  signIn: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
  sendPasswordReset: async () => {},
  sendEmailVerificationEmail: async () => {},
};

const emptyPermissionsContext = {
  permissions: [] as string[],
  hasPermission: () => false,
  canAccessAdminArea: false,
  isLoading: false,
};

export function StorybookProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={emptyAuthContext}>
        <PermissionsContext.Provider value={emptyPermissionsContext}>
          {children}
        </PermissionsContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
