import { getDb } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  orderBy,
} from 'firebase/firestore';

const SETTINGS_COLLECTION = 'settings';
const USER_ROLES_COLLECTION = 'userRoles';
const DOCUMENT_TYPES_COLLECTION = 'documentTypes';
const EMAIL_TEMPLATES_COLLECTION = 'emailTemplates';

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  validityPeriod: number; // in days
  required: boolean;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'notification' | 'reminder' | 'welcome' | 'password_reset';
  active: boolean;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  defaultLanguage: string;
  timezone: string;
}

export interface SecuritySettings {
  sessionTimeout: number;
  require2FA: boolean;
  passwordComplexity: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  reminderEnabled: boolean;
  alertEnabled: boolean;
}

export interface EmailSettings {
  smtpServer: string;
  port: number;
  useTLS: boolean;
  username: string;
  fromAddress: string;
  fromName: string;
}

export interface Settings {
  system: SystemSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  email: EmailSettings;
  userRoles: UserRole[];
  documentTypes: DocumentType[];
  emailTemplates: EmailTemplate[];
}

export const settingsService = {
  // Get all settings
  async getAll(): Promise<Settings> {
    // Prüfe, ob wir serverseitig sind oder Firebase nicht initialisiert ist
    if (typeof window === 'undefined' || !getDb) {
      // Return default settings if called server-side
      return {
        system: {
          maintenanceMode: false,
          allowRegistration: false,
          requireEmailVerification: true,
          defaultLanguage: 'de',
          timezone: 'Europe/Berlin',
        },
        security: {
          sessionTimeout: 30,
          require2FA: false,
          passwordComplexity: true,
          maxLoginAttempts: 5,
          lockoutDuration: 15,
        },
        notifications: {
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
          reminderEnabled: true,
          alertEnabled: true,
        },
        email: {
          smtpServer: '',
          port: 587,
          useTLS: true,
          username: '',
          fromAddress: '',
          fromName: 'JobFlow',
        },
        userRoles: [],
        documentTypes: [],
        emailTemplates: [],
      };
    }
    try {
      // Get system settings
      const systemDoc = await getDoc(doc(getDb(), SETTINGS_COLLECTION, 'system'));
      const securityDoc = await getDoc(doc(getDb(), SETTINGS_COLLECTION, 'security'));
      const notificationsDoc = await getDoc(doc(getDb(), SETTINGS_COLLECTION, 'notifications'));
      const emailDoc = await getDoc(doc(getDb(), SETTINGS_COLLECTION, 'email'));

      // Get user roles
      const userRolesQuery = query(
        collection(getDb(), USER_ROLES_COLLECTION),
        orderBy('name', 'asc')
      );
      const userRolesSnapshot = await getDocs(userRolesQuery);
      const userRoles: UserRole[] = userRolesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        description: doc.data().description,
        permissions: doc.data().permissions || [],
        color: doc.data().color || '#1976d2',
        userCount: doc.data().userCount || 0,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));

      // Get document types
      const documentTypesQuery = query(
        collection(getDb(), DOCUMENT_TYPES_COLLECTION),
        orderBy('name', 'asc')
      );
      const documentTypesSnapshot = await getDocs(documentTypesQuery);
      const documentTypes: DocumentType[] = documentTypesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        description: doc.data().description,
        validityPeriod: doc.data().validityPeriod || 365,
        required: doc.data().required || false,
        category: doc.data().category || 'general',
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));

      // Get email templates
      const emailTemplatesQuery = query(
        collection(getDb(), EMAIL_TEMPLATES_COLLECTION),
        orderBy('name', 'asc')
      );
      const emailTemplatesSnapshot = await getDocs(emailTemplatesQuery);
      const emailTemplates: EmailTemplate[] = emailTemplatesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        subject: doc.data().subject,
        body: doc.data().body,
        type: doc.data().type,
        active: doc.data().active !== false,
        variables: doc.data().variables || [],
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));

      return {
        system: {
          maintenanceMode: systemDoc.data()?.maintenanceMode || false,
          allowRegistration: systemDoc.data()?.allowRegistration || false,
          requireEmailVerification: systemDoc.data()?.requireEmailVerification !== false,
          defaultLanguage: systemDoc.data()?.defaultLanguage || 'de',
          timezone: systemDoc.data()?.timezone || 'Europe/Berlin',
        },
        security: {
          sessionTimeout: securityDoc.data()?.sessionTimeout || 30,
          require2FA: securityDoc.data()?.require2FA || false,
          passwordComplexity: securityDoc.data()?.passwordComplexity !== false,
          maxLoginAttempts: securityDoc.data()?.maxLoginAttempts || 5,
          lockoutDuration: securityDoc.data()?.lockoutDuration || 15,
        },
        notifications: {
          emailEnabled: notificationsDoc.data()?.emailEnabled !== false,
          pushEnabled: notificationsDoc.data()?.pushEnabled !== false,
          smsEnabled: notificationsDoc.data()?.smsEnabled || false,
          reminderEnabled: notificationsDoc.data()?.reminderEnabled !== false,
          alertEnabled: notificationsDoc.data()?.alertEnabled !== false,
        },
        email: {
          smtpServer: emailDoc.data()?.smtpServer || '',
          port: emailDoc.data()?.port || 587,
          useTLS: emailDoc.data()?.useTLS !== false,
          username: emailDoc.data()?.username || '',
          fromAddress: emailDoc.data()?.fromAddress || '',
          fromName: emailDoc.data()?.fromName || 'JobFlow',
        },
        userRoles,
        documentTypes,
        emailTemplates,
      };
    } catch (error) {
      throw error;
    }
  },

  // Update settings section
  async updateSection(
    section: string,
    data: Partial<SystemSettings | SecuritySettings | NotificationSettings | EmailSettings>
  ): Promise<void> {
    try {
      const sectionDoc = doc(getDb(), SETTINGS_COLLECTION, section);
      await updateDoc(sectionDoc, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // User Roles
  async createUserRole(data: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(getDb(), USER_ROLES_COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async updateUserRole(id: string, data: Partial<UserRole>): Promise<void> {
    try {
      const roleRef = doc(getDb(), USER_ROLES_COLLECTION, id);
      await updateDoc(roleRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  async deleteUserRole(id: string): Promise<void> {
    await deleteDoc(doc(getDb(), USER_ROLES_COLLECTION, id));
  },

  // Document Types
  async createDocumentType(data: Omit<DocumentType, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(getDb(), DOCUMENT_TYPES_COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async updateDocumentType(id: string, data: Partial<DocumentType>): Promise<void> {
    try {
      const typeRef = doc(getDb(), DOCUMENT_TYPES_COLLECTION, id);
      await updateDoc(typeRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  async deleteDocumentType(id: string): Promise<void> {
    await deleteDoc(doc(getDb(), DOCUMENT_TYPES_COLLECTION, id));
  },

  // Email Templates
  async createEmailTemplate(data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(getDb(), EMAIL_TEMPLATES_COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async updateEmailTemplate(id: string, data: Partial<EmailTemplate>): Promise<void> {
    try {
      const templateRef = doc(getDb(), EMAIL_TEMPLATES_COLLECTION, id);
      await updateDoc(templateRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  async deleteEmailTemplate(id: string): Promise<void> {
    await deleteDoc(doc(getDb(), EMAIL_TEMPLATES_COLLECTION, id));
  },

  // Export settings
  async exportSettings(): Promise<Blob> {
    try {
      const settings = await this.getAll();
      const jsonContent = JSON.stringify(settings, null, 2);
      return new Blob([jsonContent], { type: 'application/json' });
    } catch (error) {
      throw error;
    }
  },

  // Import settings
  async importSettings(file: File): Promise<void> {
    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      
      // Import system settings
      if (settings.system) {
        await this.updateSection('system', settings.system);
      }
      
      // Import security settings
      if (settings.security) {
        await this.updateSection('security', settings.security);
      }
      
      // Import notification settings
      if (settings.notifications) {
        await this.updateSection('notifications', settings.notifications);
      }
      
      // Import email settings
      if (settings.email) {
        await this.updateSection('email', settings.email);
      }
      
      // TODO: Import user roles, document types, and email templates
      // This would require more complex logic to handle conflicts
      
    } catch (error) {
      throw error;
    }
  },

  // Initialize default settings
  async initializeDefaultSettings(): Promise<void> {
    try {
      // Initialize system settings
      const systemDoc = doc(getDb(), SETTINGS_COLLECTION, 'system');
      await updateDoc(systemDoc, {
        maintenanceMode: false,
        allowRegistration: false,
        requireEmailVerification: true,
        defaultLanguage: 'de',
        timezone: 'Europe/Berlin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Initialize security settings
      const securityDoc = doc(getDb(), SETTINGS_COLLECTION, 'security');
      await updateDoc(securityDoc, {
        sessionTimeout: 30,
        require2FA: false,
        passwordComplexity: true,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Initialize notification settings
      const notificationsDoc = doc(getDb(), SETTINGS_COLLECTION, 'notifications');
      await updateDoc(notificationsDoc, {
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        reminderEnabled: true,
        alertEnabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Initialize email settings
      const emailDoc = doc(getDb(), SETTINGS_COLLECTION, 'email');
      await updateDoc(emailDoc, {
        smtpServer: '',
        port: 587,
        useTLS: true,
        username: '',
        fromAddress: '',
        fromName: 'JobFlow',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

    } catch (error) {
      throw error;
    }
  },
};
