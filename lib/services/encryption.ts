// Client-seitige Verschlüsselung für sensible Gehaltsdaten
// DSGVO-konforme Verschlüsselung sensibler Daten

import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static readonly ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key-change-in-production';
  
  /**
   * Verschlüsselt sensible Daten
   */
  static encrypt(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      throw new Error('Fehler bei der Verschlüsselung');
    }
  }

  /**
   * Entschlüsselt sensible Daten
   */
  static decrypt(encryptedData: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('Fehler bei der Entschlüsselung');
    }
  }

  /**
   * Verschlüsselt IBAN für sichere Speicherung
   */
  static encryptIBAN(iban: string): string {
    if (!this.isValidIBAN(iban)) {
      throw new Error('Ungültige IBAN');
    }
    return this.encrypt(iban);
  }

  /**
   * Entschlüsselt IBAN
   */
  static decryptIBAN(encryptedIBAN: string): string {
    const decrypted = this.decrypt(encryptedIBAN);
    if (!this.isValidIBAN(decrypted)) {
      throw new Error('Entschlüsselte IBAN ist ungültig');
    }
    return decrypted;
  }

  /**
   * Verschlüsselt Sozialversicherungsnummer
   */
  static encryptSocialSecurityNumber(ssn: string): string {
    if (!this.isValidSocialSecurityNumber(ssn)) {
      throw new Error('Ungültige Sozialversicherungsnummer');
    }
    return this.encrypt(ssn);
  }

  /**
   * Entschlüsselt Sozialversicherungsnummer
   */
  static decryptSocialSecurityNumber(encryptedSSN: string): string {
    const decrypted = this.decrypt(encryptedSSN);
    if (!this.isValidSocialSecurityNumber(decrypted)) {
      throw new Error('Entschlüsselte Sozialversicherungsnummer ist ungültig');
    }
    return decrypted;
  }

  /**
   * Verschlüsselt Krankenversicherungsnummer
   */
  static encryptHealthInsuranceNumber(hin: string): string {
    if (!this.isValidHealthInsuranceNumber(hin)) {
      throw new Error('Ungültige Krankenversicherungsnummer');
    }
    return this.encrypt(hin);
  }

  /**
   * Entschlüsselt Krankenversicherungsnummer
   */
  static decryptHealthInsuranceNumber(encryptedHIN: string): string {
    const decrypted = this.decrypt(encryptedHIN);
    if (!this.isValidHealthInsuranceNumber(decrypted)) {
      throw new Error('Entschlüsselte Krankenversicherungsnummer ist ungültig');
    }
    return decrypted;
  }

  /**
   * Verschlüsselt Steuer-ID
   */
  static encryptTaxId(taxId: string): string {
    if (!this.isValidTaxId(taxId)) {
      throw new Error('Ungültige Steuer-ID');
    }
    return this.encrypt(taxId);
  }

  /**
   * Entschlüsselt Steuer-ID
   */
  static decryptTaxId(encryptedTaxId: string): string {
    const decrypted = this.decrypt(encryptedTaxId);
    if (!this.isValidTaxId(decrypted)) {
      throw new Error('Entschlüsselte Steuer-ID ist ungültig');
    }
    return decrypted;
  }

  /**
   * Maskiert IBAN für Anzeige
   */
  static maskIBAN(iban: string): string {
    if (iban.length < 8) return iban;
    return iban.substring(0, 4) + '****' + iban.substring(iban.length - 4);
  }

  /**
   * Maskiert Sozialversicherungsnummer für Anzeige
   */
  static maskSocialSecurityNumber(ssn: string): string {
    if (ssn.length < 6) return ssn;
    return ssn.substring(0, 3) + '***' + ssn.substring(ssn.length - 3);
  }

  /**
   * Maskiert Steuer-ID für Anzeige
   */
  static maskTaxId(taxId: string): string {
    if (taxId.length < 6) return taxId;
    return taxId.substring(0, 3) + '***' + taxId.substring(taxId.length - 3);
  }

  /**
   * Validiert IBAN
   */
  private static isValidIBAN(iban: string): boolean {
    // Vereinfachte IBAN-Validierung
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
    return ibanRegex.test(iban.replace(/\s/g, ''));
  }

  /**
   * Validiert Sozialversicherungsnummer
   */
  private static isValidSocialSecurityNumber(ssn: string): boolean {
    // Deutsche SV-Nummer: 12 Ziffern
    const ssnRegex = /^[0-9]{12}$/;
    return ssnRegex.test(ssn);
  }

  /**
   * Validiert Krankenversicherungsnummer
   */
  private static isValidHealthInsuranceNumber(hin: string): boolean {
    // Deutsche KV-Nummer: 10 Ziffern
    const hinRegex = /^[0-9]{10}$/;
    return hinRegex.test(hin);
  }

  /**
   * Validiert Steuer-ID
   */
  private static isValidTaxId(taxId: string): boolean {
    // Deutsche Steuer-ID: 11 Ziffern
    const taxIdRegex = /^[0-9]{11}$/;
    return taxIdRegex.test(taxId);
  }

  /**
   * Generiert sicheren Schlüssel für Verschlüsselung
   */
  static generateEncryptionKey(): string {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  /**
   * Hasht Daten für Audit-Trails
   */
  static hashData(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Erstellt digitale Signatur für Audit-Trails
   */
  static createSignature(data: string, timestamp: string): string {
    const combined = data + timestamp;
    return CryptoJS.HmacSHA256(combined, this.ENCRYPTION_KEY).toString();
  }

  /**
   * Validiert digitale Signatur
   */
  static validateSignature(data: string, timestamp: string, signature: string): boolean {
    const expectedSignature = this.createSignature(data, timestamp);
    return signature === expectedSignature;
  }
}
