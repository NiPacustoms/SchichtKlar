/**
 * Zentraler Logger für Cloud Functions.
 * Nutzt firebase-functions/logger für Cloud Logging und Error Reporting.
 * Ersetzt console.log/error/warn für einheitliches, strukturiertes Logging.
 */
import * as firebaseLogger from 'firebase-functions/logger';

export const log = firebaseLogger.log;
export const info = firebaseLogger.info;
export const warn = firebaseLogger.warn;
export const error = firebaseLogger.error;
export const debug = firebaseLogger.debug;

/** Logger-Namespace für Aufrufe wie logger.error('msg', err) */
export const logger = firebaseLogger;
