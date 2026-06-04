import { describe, it, expect } from 'vitest';
import {
  validateBreakCompliance,
  getBreakRequirementText,
  BreakValidationResult,
} from '../breakValidation';

describe('Break Validation (ArbZG §4)', () => {
  describe('validateBreakCompliance', () => {
    it('should not require break for ≤6h work', () => {
      const result = validateBreakCompliance(6 * 60, 0);
      expect(result.isValid).toBe(true);
      expect(result.requiredBreakMinutes).toBe(0);
      expect(result.compliance.status).toBe('compliant');
    });

    it('should require 30min for 6-9h work', () => {
      const result = validateBreakCompliance(7 * 60, 30);
      expect(result.isValid).toBe(true);
      expect(result.requiredBreakMinutes).toBe(30);
      expect(result.compliance.status).toBe('compliant');
    });

    it('should require 45min for >9h work', () => {
      const result = validateBreakCompliance(10 * 60, 45);
      expect(result.isValid).toBe(true);
      expect(result.requiredBreakMinutes).toBe(45);
      expect(result.compliance.status).toBe('compliant');
    });

    it('should mark insufficient break as non-compliant', () => {
      const result = validateBreakCompliance(7 * 60, 15);
      expect(result.isValid).toBe(false);
      expect(result.requiredBreakMinutes).toBe(30);
      expect(result.compliance.status).toBe('insufficient');
      expect(result.message).toContain('unzureichend');
    });

    it('should mark excessive break as compliant but excessive', () => {
      const result = validateBreakCompliance(7 * 60, 60);
      expect(result.isValid).toBe(true);
      expect(result.compliance.status).toBe('excessive');
      expect(result.message).toContain('überschreitet');
    });

    it('should handle boundary case: exactly 6h', () => {
      const result = validateBreakCompliance(6 * 60, 0);
      expect(result.isValid).toBe(true);
      expect(result.requiredBreakMinutes).toBe(0);
    });

    it('should handle boundary case: 6h + 1min', () => {
      const result = validateBreakCompliance(6 * 60 + 1, 30);
      expect(result.isValid).toBe(true);
      expect(result.requiredBreakMinutes).toBe(30);
    });

    it('should handle boundary case: exactly 9h', () => {
      const result = validateBreakCompliance(9 * 60, 30);
      expect(result.isValid).toBe(true);
      expect(result.requiredBreakMinutes).toBe(30);
    });

    it('should handle boundary case: 9h + 1min', () => {
      const result = validateBreakCompliance(9 * 60 + 1, 45);
      expect(result.isValid).toBe(true);
      expect(result.requiredBreakMinutes).toBe(45);
    });
  });

  describe('getBreakRequirementText', () => {
    it('should return correct text for ≤6h', () => {
      const text = getBreakRequirementText(5 * 60);
      expect(text).toContain('5h');
      expect(text).toContain('Keine Pause erforderlich');
      expect(text).toContain('ArbZG §4');
    });

    it('should return correct text for 6-9h', () => {
      const text = getBreakRequirementText(7 * 60);
      expect(text).toContain('7h');
      expect(text).toContain('30 Min Pause');
      expect(text).toContain('ArbZG §4');
    });

    it('should return correct text for >9h', () => {
      const text = getBreakRequirementText(10 * 60);
      expect(text).toContain('10h');
      expect(text).toContain('45 Min Pause');
      expect(text).toContain('ArbZG §4');
    });
  });

  describe('Compliance edge cases', () => {
    it('should handle 0 work minutes', () => {
      const result = validateBreakCompliance(0, 0);
      expect(result.isValid).toBe(true);
      expect(result.requiredBreakMinutes).toBe(0);
    });

    it('should handle very short work (5min)', () => {
      const result = validateBreakCompliance(5, 0);
      expect(result.isValid).toBe(true);
      expect(result.requiredBreakMinutes).toBe(0);
    });

    it('should handle very long work (12h)', () => {
      const result = validateBreakCompliance(12 * 60, 45);
      expect(result.isValid).toBe(true);
      expect(result.requiredBreakMinutes).toBe(45);
    });

    it('should mark negative break as invalid', () => {
      const result = validateBreakCompliance(7 * 60, -10);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Realistic scenarios', () => {
    it('should handle 8.5h day with 30min break', () => {
      const result = validateBreakCompliance(8.5 * 60, 30);
      expect(result.isValid).toBe(true);
      expect(result.compliance.status).toBe('compliant');
    });

    it('should flag 6.5h day with only 15min break', () => {
      const result = validateBreakCompliance(6.5 * 60, 15);
      expect(result.isValid).toBe(false);
      expect(result.compliance.status).toBe('insufficient');
    });

    it('should flag 10h day with only 30min break', () => {
      const result = validateBreakCompliance(10 * 60, 30);
      expect(result.isValid).toBe(false);
      expect(result.compliance.status).toBe('insufficient');
    });

    it('should handle 10h day with 45min + overtime break', () => {
      const result = validateBreakCompliance(10 * 60, 60);
      expect(result.isValid).toBe(true);
      expect(result.compliance.status).toBe('excessive');
    });
  });
});
