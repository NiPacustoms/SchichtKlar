/**
 * User role – single source of truth for domain.
 * Aligned with lib/types/user and Firebase custom claims.
 */
export type UserRole = 'nurse' | 'admin';

export const USER_ROLE_VALUES: UserRole[] = ['nurse', 'admin'];

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

export function isNurse(role: UserRole): boolean {
  return role === 'nurse';
}
