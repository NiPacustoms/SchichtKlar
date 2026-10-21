// Client-seitige Verschlüsselung sensibler Daten (Bankverbindung)
// Steuer- und Sozialversicherungsdaten verarbeitet die App bewusst nicht –
// die Lohnabrechnung inkl. Lohnsteuer macht das Steuerbüro.

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
    } catch (_error) {
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
    } catch (_error) {
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
   * Maskiert IBAN für Anzeige
   */
  static maskIBAN(iban: string): string {
    if (iban.length < 8) return iban;
    return iban.substring(0, 4) + '****' + iban.substring(iban.length - 4);
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
