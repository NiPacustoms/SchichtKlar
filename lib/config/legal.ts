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

  // Steuerliche Angaben (für Dokument-Fußzeilen)
  taxNumber?: string; // Steuernummer, z. B. "359/5742/0930"

  // Bankverbindung (für Dokument-Fußzeilen)
  bank?: {
    name: string; // z. B. "Sparkasse Gelsenkirchen"
    iban: string;
    bic: string;
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
  taxNumber: process.env.NEXT_PUBLIC_TAX_NUMBER || undefined,
  bank:
    process.env.NEXT_PUBLIC_BANK_NAME || process.env.NEXT_PUBLIC_BANK_IBAN
      ? {
          name: process.env.NEXT_PUBLIC_BANK_NAME || '',
          iban: process.env.NEXT_PUBLIC_BANK_IBAN || '',
          bic: process.env.NEXT_PUBLIC_BANK_BIC || '',
        }
      : undefined,
};

/**
 * Validiert Legal-Config für Production
 * 
 * Wirft einen Fehler, wenn in Production erforderliche ENV-Variablen fehlen
 */
/**
 * Rechtstext-Ziele: Die Web-App wird in eine bestehende Seite eingebunden,
 * die Impressum/Datenschutz/AGB bereits führt. Über diese ENV-Variablen
 * zeigen die Links der App dorthin; ohne Konfiguration greifen die
 * internen Platzhalter-Seiten.
 */
export const LEGAL_URLS = {
  impressum: process.env.NEXT_PUBLIC_IMPRESSUM_URL || '/recht/impressum',
  datenschutz: process.env.NEXT_PUBLIC_DATENSCHUTZ_URL || '/recht/datenschutz',
  agb: process.env.NEXT_PUBLIC_AGB_URL || '/recht/agb',
} as const;

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

  // Kein Produktions-Blocker mehr: Die App wird in eine bestehende Seite
  // eingebunden, die Impressum/AGB/Datenschutz bereits führt (Entscheidung
  // 21.07.2026). Die Firmendaten werden nur noch für Dokument-Briefköpfe
  // genutzt; fehlende Werte fallen auf Platzhalter zurück.
  if (companyName === 'Musterfirma GmbH' || companyStreet === 'Musterstraße 123' || companyEmail === 'info@example.com') {
    console.warn(
      '[legal] Firmendaten enthalten Platzhalter – Dokument-Briefköpfe zeigen Musterdaten. ' +
      'Optional NEXT_PUBLIC_COMPANY_* setzen.'
    );
  }

  if (missing.length > 0) {
    console.warn(
      `[legal] Firmendaten-ENV nicht gesetzt (${missing.join(', ')}) – ` +
      'Dokument-Briefköpfe nutzen Platzhalter. Rechtstexte liefert die einbettende Hauptseite.'
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

