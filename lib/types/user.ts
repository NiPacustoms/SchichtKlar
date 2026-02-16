/**
 * User & Profile Types
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'nurse' | 'admin' | 'dispatcher';
  companyId?: string;
  phone?: string;
  qualifications: string[];
  workingHoursPerWeek?: number;
  documents: string[];
  active: boolean;
  currentStatus?: 'active' | 'inactive' | 'on-leave' | 'sick';
  group?: string;
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    shiftReminders: boolean;
    documentExpiry: boolean;
    systemAnnouncements: boolean;
  };
  address?: {
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  contact?: {
    phoneMobile?: string;
    phoneHome?: string;
    phoneWork?: string;
    emailPrivate?: string;
  };
  emergencyContact?: {
    name?: string;
    relation?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  bankAccount?: {
    iban?: string;
    bic?: string;
    bankName?: string;
    accountHolder?: string;
  };
  education?: {
    highestDegree?: string;
    institution?: string;
    graduationYear?: number;
    apprenticeships?: Array<{
      title: string;
      provider?: string;
      startDate?: string;
      endDate?: string;
    }>;
    trainings?: Array<{
      title: string;
      provider?: string;
      date?: string;
      hours?: number;
    }>;
    certificates?: Array<{
      name: string;
      issuer?: string;
      issuedAt?: string;
      expiresAt?: string;
      certificateId?: string;
    }>;
  };
  driversLicense?: {
    hasLicense?: boolean;
    classes?: string[];
    ownCar?: boolean;
    notes?: string;
  };
  jobTitle?: string;
  preferences?: { [key: string]: unknown };
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
}

export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

export interface UserUpdateForm {
  displayName: string;
  phone?: string;
  active?: boolean;
  notificationSettings: User['notificationSettings'];
  preferences?: { [key: string]: unknown };
  currentStatus?: 'active' | 'inactive' | 'on-leave' | 'sick';
}
