export interface Alert {
  id: string;
  type: 'document' | 'shift' | 'overtime' | 'conflict' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  userId?: string; // für user-spezifische Alerts
  companyId: string; // Mandantenzugehörigkeit
  metadata: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  type: Alert['type'];
  severity: Alert['severity'];
  enabled: boolean;
  conditions: Record<string, unknown>;
  messageTemplate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  alertFrequency: 'immediate' | 'hourly' | 'daily';
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}
