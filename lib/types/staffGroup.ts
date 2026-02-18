export interface StaffGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  members: string[]; // User IDs
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffGroupData {
  name: string;
  description?: string;
  color: string;
  members: string[];
  permissions: string[];
}

export interface StaffGroupMember {
  userId: string;
  displayName: string;
  email: string;
  role: 'nurse' | 'admin';
  addedAt: Date;
}
