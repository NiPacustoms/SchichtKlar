'use client';

import { useAuth } from './AuthContext';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Role = 'nurse' | 'dispatcher' | 'admin';

interface RoleContextType {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  isAdmin: boolean;
  isNurse: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>('nurse');
  const { user } = useAuth();

  // Role basierend auf AuthContext setzen
  useEffect(() => {
    if (user) {
      setCurrentRole(user.role as Role);
    }
  }, [user]);

  // Role aus localStorage laden beim ersten Laden (nur wenn kein User)
  useEffect(() => {
    if (!user) {
      const savedRole = localStorage.getItem('currentRole') as Role;
      if (
        savedRole &&
        (savedRole === 'nurse' || savedRole === 'dispatcher' || savedRole === 'admin')
      ) {
        setCurrentRole(savedRole);
      }
    }
  }, [user]);

  // Role in localStorage speichern
  useEffect(() => {
    localStorage.setItem('currentRole', currentRole);
  }, [currentRole]);

  const isAdmin = currentRole === 'dispatcher' || currentRole === 'admin';
  const isNurse = currentRole === 'nurse';

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        isAdmin,
        isNurse,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
