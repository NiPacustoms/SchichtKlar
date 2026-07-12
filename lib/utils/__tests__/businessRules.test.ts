/**
 * Geschäftsregel-Tests (Phase 5 – Marktreife).
 *
 * Deckt die zeit- und arbeitsrechtlichen Kernregeln über die reinen
 * Utility-Funktionen ab (keine Firestore-/Netzwerk-Abhängigkeit, daher
 * deterministisch). Bezug zur Anforderungsliste in Klammern.
 */
import { describe, it, expect } from 'vitest';
import {
  diffHHMM,
  calcWorkMin,
  getRequiredBreakMinutes,
  needsBreakWarning,
  isEndAfterStart,
  isValidTimeFormat,
} from '../time';

describe('Geschäftsregel 3/5 – Arbeitszeitberechnung, keine negativen Zeiten', () => {
  it('berechnet die Bruttodauer einer regulären Schicht korrekt', () => {
    expect(diffHHMM('08:00', '16:00')).toBe(480);
  });

  it('behandelt Nachtschichten über Mitternacht (Ende < Beginn) ohne negative Zeit', () => {
    // 22:00 -> 06:00 = 8h, nicht -16h
    expect(diffHHMM('22:00', '06:00')).toBe(480);
  });

  it('calcWorkMin zieht Pausen ab und wird nie negativ', () => {
    expect(calcWorkMin('08:00', '16:00', 30)).toBe(450);
    // Pause länger als Arbeitszeit -> 0, niemals negativ (Regel 5)
    expect(calcWorkMin('08:00', '08:15', 60)).toBe(0);
  });
});

describe('Geschäftsregel 4 – gesetzliche Pausen (§4 ArbZG)', () => {
  it('verlangt keine Pause bis einschließlich 6h', () => {
    expect(getRequiredBreakMinutes(6 * 60)).toBe(0);
  });

  it('verlangt 30 Minuten bei mehr als 6h bis 9h', () => {
    expect(getRequiredBreakMinutes(6 * 60 + 1)).toBe(30);
    expect(getRequiredBreakMinutes(9 * 60)).toBe(30);
  });

  it('verlangt 45 Minuten bei mehr als 9h', () => {
    expect(getRequiredBreakMinutes(9 * 60 + 1)).toBe(45);
  });

  it('warnt, wenn die genommene Pause die Pflichtpause unterschreitet', () => {
    // 8h Arbeit, nur 15min Pause -> Warnung
    expect(needsBreakWarning(8 * 60, 15)).toBe(true);
    // 8h Arbeit, 30min Pause -> keine Warnung
    expect(needsBreakWarning(8 * 60, 30)).toBe(false);
  });
});

describe('Geschäftsregel 3 – Arbeitsende darf nicht vor Arbeitsbeginn liegen', () => {
  it('akzeptiert Ende nach Beginn', () => {
    expect(isEndAfterStart('08:00', '16:00')).toBe(true);
  });

  it('interpretiert Ende <= Beginn als (gültige) Nachtschicht, nicht als Fehler', () => {
    // Fachliche Entscheidung der App: 22:00->06:00 ist eine Nachtschicht.
    expect(isEndAfterStart('22:00', '06:00')).toBe(true);
  });

  it('lehnt leere Zeitangaben ab', () => {
    expect(isEndAfterStart('', '16:00')).toBe(false);
    expect(isEndAfterStart('08:00', '')).toBe(false);
  });
});

describe('Eingabevalidierung – Zeitformat HH:MM', () => {
  it('akzeptiert gültige Uhrzeiten', () => {
    expect(isValidTimeFormat('00:00')).toBe(true);
    expect(isValidTimeFormat('23:59')).toBe(true);
    expect(isValidTimeFormat('08:30')).toBe(true);
  });

  it('lehnt ungültige Uhrzeiten ab', () => {
    expect(isValidTimeFormat('24:00')).toBe(false);
    expect(isValidTimeFormat('08:60')).toBe(false);
    expect(isValidTimeFormat('8:30')).toBe(false);
    expect(isValidTimeFormat('abc')).toBe(false);
  });
});
