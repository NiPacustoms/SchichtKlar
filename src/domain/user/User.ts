/**
 * User entity – pure domain model (read-focused).
 * Uses lib/types/user for compatibility.
 */
import type { User as IUser } from '@/lib/types/user';
import type { UserRole } from './UserRole';
import { isAdmin, isNurse } from './UserRole';

export type { UserRole } from './UserRole';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (
    value != null &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}

export class User {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly companyId?: string;
  readonly qualifications: string[];
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: IUser) {
    this.id = data.id;
    this.email = data.email;
    this.displayName = data.displayName;
    this.role = (data.role as UserRole) ?? 'nurse';
    this.companyId = data.companyId;
    this.qualifications = data.qualifications ?? [];
    this.active = data.active !== false;
    this.createdAt = toDate(data.createdAt);
    this.updatedAt = toDate(data.updatedAt);
  }

  get isAdmin(): boolean {
    return isAdmin(this.role);
  }

  get isNurse(): boolean {
    return isNurse(this.role);
  }

  toPlain(): IUser {
    return {
      id: this.id,
      email: this.email,
      displayName: this.displayName,
      role: this.role,
      companyId: this.companyId,
      qualifications: this.qualifications,
      active: this.active,
      documents: [],
      notificationSettings: (this as unknown as IUser).notificationSettings ?? {
        emailNotifications: true,
        pushNotifications: true,
        shiftReminders: true,
        documentExpiry: true,
        systemAnnouncements: true,
      },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
