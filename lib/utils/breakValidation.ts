/**
 * Break validation and compliance checking
 * Ensures compliance with German labor law (ArbZG §4)
 */

import { getRequiredBreakMinutes } from './time';
import { logger } from '@/lib/logging';

export interface BreakValidationResult {
  isValid: boolean;
  requiredBreakMinutes: number;
  providedBreakMinutes: number;
  message?: string;
  compliance: {
    arbzg_paragraph: string;
    status: 'compliant' | 'insufficient' | 'excessive';
    workMinutes: number;
  };
}

/**
 * Validates break minutes against ArbZG §4 requirements
 * @param workMinutes - Total work minutes
 * @param providedBreakMinutes - Break minutes provided by user
 * @returns Validation result with compliance status
 */
export function validateBreakCompliance(
  workMinutes: number,
  providedBreakMinutes: number
): BreakValidationResult {
  const requiredBreakMinutes = getRequiredBreakMinutes(workMinutes);
  const isCompliant = providedBreakMinutes >= requiredBreakMinutes;

  let status: 'compliant' | 'insufficient' | 'excessive' = 'compliant';
  let message: string | undefined;

  if (!isCompliant) {
    status = 'insufficient';
    message = `Pause unzureichend: ${providedBreakMinutes}min vorhanden, aber ${requiredBreakMinutes}min erforderlich (ArbZG §4)`;
  } else if (providedBreakMinutes > requiredBreakMinutes) {
    status = 'excessive';
    message = `Pause überschreitet Anforderungen: ${providedBreakMinutes}min vorhanden, nur ${requiredBreakMinutes}min erforderlich`;
  } else {
    message = `Pause erfüllt ArbZG §4: ${providedBreakMinutes}min für ${Math.round(workMinutes / 60)}h Arbeit`;
  }

  return {
    isValid: isCompliant,
    requiredBreakMinutes,
    providedBreakMinutes,
    message,
    compliance: {
      arbzg_paragraph: 'ArbZG §4',
      status,
      workMinutes,
    },
  };
}

/**
 * Calculates and logs compliance audit trail
 * @param workMinutes - Total work minutes
 * @param breakMinutes - Break minutes
 * @param context - Additional context (user, timestamp, etc.)
 */
export function logBreakComplianceAudit(
  workMinutes: number,
  breakMinutes: number,
  context?: Record<string, unknown>
): void {
  const validation = validateBreakCompliance(workMinutes, breakMinutes);

  const auditLog = {
    timestamp: new Date().toISOString(),
    workMinutes,
    breakMinutes,
    requiredBreakMinutes: validation.requiredBreakMinutes,
    compliance: validation.compliance.status,
    message: validation.message,
    ...context,
  };

  if (validation.compliance.status === 'insufficient') {
    logger.warn('Break compliance violation (ArbZG §4)', auditLog);
  } else {
    logger.debug('Break compliance audit', auditLog);
  }
}

/**
 * Gets human-readable break requirement description
 */
export function getBreakRequirementText(workMinutes: number): string {
  const hours = Math.round(workMinutes / 60);

  if (workMinutes > 9 * 60) {
    return `${hours}h Arbeit → 45 Min Pause erforderlich (ArbZG §4)`;
  }

  if (workMinutes > 6 * 60) {
    return `${hours}h Arbeit → 30 Min Pause erforderlich (ArbZG §4)`;
  }

  return `${hours}h Arbeit → Keine Pause erforderlich (ArbZG §4)`;
}
