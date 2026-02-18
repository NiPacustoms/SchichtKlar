import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { PermissionsContext } from '@/contexts/PermissionsContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const mockAuth = {
  user: null,
  firebaseUser: null,
  loading: false,
  signIn: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
  sendPasswordReset: async () => {},
  sendEmailVerificationEmail: async () => {},
};

const mockPermissions = {
  permissions: [],
  hasPermission: () => false,
  canAccessAdminArea: false,
  isLoading: false,
};

export function StorybookProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={mockAuth}>
        <PermissionsContext.Provider value={mockPermissions}>
          {children}
        </PermissionsContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
