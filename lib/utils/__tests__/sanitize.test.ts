import { describe, it, expect } from 'vitest';
import { escapeHtml, stripTags, sanitizeUserUpdate } from '../sanitize';

describe('escapeHtml', () => {
  it('escapt & < > " \'', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapt einfache Anführungszeichen', () => {
    expect(escapeHtml("O'Brien")).toBe('O&#x27;Brien');
  });

  it('gibt leeren String für null/undefined zurück', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('lässt normalen Text unverändert', () => {
    expect(escapeHtml('Hallo Welt')).toBe('Hallo Welt');
  });
});

describe('stripTags', () => {
  it('entfernt HTML-Tags', () => {
    expect(stripTags('<b>Fett</b>')).toBe('Fett');
  });

  it('normalisiert Whitespace', () => {
    expect(stripTags('  viel   Leerzeichen  ')).toBe('viel Leerzeichen');
  });

  it('gibt undefined für Nicht-Strings zurück', () => {
    expect(stripTags(42)).toBeUndefined();
    expect(stripTags(null)).toBeUndefined();
  });

  it('entfernt Script-Tags vollständig', () => {
    const result = stripTags('<script>evil()</script>harmlos');
    expect(result).toBe('evil()harmlos');
  });
});

describe('sanitizeUserUpdate', () => {
  it('escapt displayName von HTML', () => {
    const result = sanitizeUserUpdate({ displayName: '<b>Max</b>' });
    expect(result.displayName).toBe('Max');
  });

  it('trimmt Telefonnummern', () => {
    const result = sanitizeUserUpdate({ phone: '  0123456789  ' });
    expect(result.phone).toBe('0123456789');
  });

  it('sanitisiert Adressfelder', () => {
    const result = sanitizeUserUpdate({
      address: { street: '<img>Musterstr.</img>', city: 'Berlin' },
    });
    const addr = result.address as Record<string, unknown>;
    expect(addr.street).toBe('Musterstr.');
    expect(addr.city).toBe('Berlin');
  });

  it('lässt unbekannte Felder unverändert', () => {
    const result = sanitizeUserUpdate({ unknownField: 'wert' });
    expect(result.unknownField).toBe('wert');
  });
});
