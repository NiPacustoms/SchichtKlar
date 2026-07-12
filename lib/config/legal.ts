/**
 * Legal/Impressum Configuration
 * 
 * Diese Datei enthält die Konfiguration für Impressum und Datenschutz.
 * Für Produktion: Bitte alle Platzhalter durch echte Firmendaten ersetzen!
 */

export interface LegalInfo {
  // Firmendaten
  companyName: string;
  legalForm: string; // z.B. "GmbH", "UG (haftungsbeschränkt)", etc.
  address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  
  // Kontakt
  contact: {
    email: string;
    phone?: string;
    fax?: string;
    website?: string;
  };
  
  // Registereintrag
  registration?: {
    registerType: string; // z.B. "Handelsregister"
    registerNumber: string; // z.B. "HRB 12345"
    registerCourt: string; // z.B. "Amtsgericht Musterstadt"
    vatId?: string; // USt-IdNr.
  };
  
  // Verantwortlich für den Inhalt
  responsiblePerson?: {
    name: string;
    position: string; // z.B. "Geschäftsführer"
  };
}

/**
 * Standard-Impressum-Daten
 * 
 * WICHTIG: Diese müssen vor Produktions-Release durch echte Daten ersetzt werden!
 * Alternativ: Daten aus SystemSettings oder ENV-Variablen laden
 */
export const DEFAULT_LEGAL_INFO: LegalInfo = {
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Musterfirma GmbH',
  legalForm: process.env.NEXT_PUBLIC_LEGAL_FORM || 'GmbH',
  address: {
    street: process.env.NEXT_PUBLIC_COMPANY_STREET || 'Musterstraße 123',
    city: process.env.NEXT_PUBLIC_COMPANY_CITY || 'Musterstadt',
    zipCode: process.env.NEXT_PUBLIC_COMPANY_ZIP || '12345',
    country: process.env.NEXT_PUBLIC_COMPANY_COUNTRY || 'Deutschland',
  },
  contact: {
    email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'info@example.com',
    phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '+49 123 456789',
    fax: process.env.NEXT_PUBLIC_COMPANY_FAX,
    website: process.env.NEXT_PUBLIC_COMPANY_WEBSITE || process.env.NEXT_PUBLIC_APP_URL || 'https://example.com',
  },
  registration: {
    registerType: 'Handelsregister',
    registerNumber: process.env.NEXT_PUBLIC_REGISTER_NUMBER || 'HRB 12345',
    registerCourt: process.env.NEXT_PUBLIC_REGISTER_COURT || 'Amtsgericht Musterstadt',
    vatId: process.env.NEXT_PUBLIC_VAT_ID || 'DE123456789',
  },
  responsiblePerson: {
    name: process.env.NEXT_PUBLIC_RESPONSIBLE_NAME || 'Max Mustermann',
    position: process.env.NEXT_PUBLIC_RESPONSIBLE_POSITION || 'Geschäftsführer',
  },
};

/**
 * Validiert Legal-Config für Production
 * 
 * Wirft einen Fehler, wenn in Production erforderliche ENV-Variablen fehlen
 */
export function validateLegalConfig(): void {
  // In Development/Test sind Platzhalter-Werte erlaubt
  // Prüfe auch auf Next.js Development-Modus
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_APP_ENV === 'development') {
    return;
  }

  const requiredEnvVars = [
    'NEXT_PUBLIC_COMPANY_NAME',
    'NEXT_PUBLIC_COMPANY_STREET',
    'NEXT_PUBLIC_COMPANY_CITY',
    'NEXT_PUBLIC_COMPANY_ZIP',
    'NEXT_PUBLIC_COMPANY_EMAIL',
  ];

  const missing: string[] = [];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar] || process.env[envVar] === '') {
      missing.push(envVar);
    }
  }

  // Prüfe auch auf Mock-Daten-Werte
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME;
  const companyStreet = process.env.NEXT_PUBLIC_COMPANY_STREET;
  const companyEmail = process.env.NEXT_PUBLIC_COMPANY_EMAIL;

  if (companyName === 'Musterfirma GmbH' || companyStreet === 'Musterstraße 123' || companyEmail === 'info@example.com') {
    throw new Error(
      'PRODUCTION BLOCKER: Legal configuration contains mock data. ' +
      'Please set the following ENV variables with real company data: ' +
      'NEXT_PUBLIC_COMPANY_NAME, NEXT_PUBLIC_COMPANY_STREET, NEXT_PUBLIC_COMPANY_CITY, ' +
      'NEXT_PUBLIC_COMPANY_ZIP, NEXT_PUBLIC_COMPANY_EMAIL'
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `PRODUCTION BLOCKER: Missing required legal ENV variables: ${missing.join(', ')}. ` +
      'The app cannot run in production without proper legal information.'
    );
  }
}

/**
 * Lädt Legal-Info aus SystemSettings oder verwendet Defaults.
 * Optional Produktion: aus Firestore/SystemSettings laden.
 */
export function getLegalInfo(): LegalInfo {
  // In Production: Validiere dass keine Mock-Daten verwendet werden
  if (typeof window === 'undefined') {
    validateLegalConfig();
  }
  
  return DEFAULT_LEGAL_INFO;
}

