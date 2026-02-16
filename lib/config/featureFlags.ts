/**
 * Feature Flags für schrittweise Migration von Mock zu Production
 * JobFlow App - State-of-the-Art Migration Strategy
 */

import { logger } from '@/lib/utils/logger';

export const FEATURE_FLAGS = {
  // Auth Configuration - Production Mode: Firebase Auth Only
  USE_MOCK_AUTH: false, // Disabled for production
  
  // Data Configuration - Production Mode: Real Firebase Data Only
  USE_MOCK_DATA: false, // Disabled for production
  
  // Realtime Updates - Production Mode: Enabled
  USE_REALTIME: true, // Enabled for production
  
  // Environment
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
} as const;

// Type-safe Feature Flag Check
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

// Migration Status Helper
export function getMigrationStatus() {
  return {
    auth: FEATURE_FLAGS.USE_MOCK_AUTH ? 'mock' : 'firebase',
    data: FEATURE_FLAGS.USE_MOCK_DATA ? 'mock' : 'firebase',
    realtime: FEATURE_FLAGS.USE_REALTIME ? 'enabled' : 'disabled',
    environment: FEATURE_FLAGS.IS_DEVELOPMENT ? 'development' : 'production',
  };
}

// Log current configuration (Development only)
if (FEATURE_FLAGS.IS_DEVELOPMENT && typeof window !== 'undefined') {
  logger.group('🚀 JobFlow Feature Flags');
  logger.debug('Mock Auth:', FEATURE_FLAGS.USE_MOCK_AUTH);
  logger.debug('Mock Data:', FEATURE_FLAGS.USE_MOCK_DATA);
  logger.debug('Realtime:', FEATURE_FLAGS.USE_REALTIME);
  logger.debug('Migration Status:', getMigrationStatus());
  logger.groupEnd();
}

// Validation Helper
export function validateFeatureFlags() {
  const errors: string[] = [];
  
  if (FEATURE_FLAGS.IS_PRODUCTION && FEATURE_FLAGS.USE_MOCK_AUTH) {
    errors.push('❌ Production mode with Mock Auth is not allowed');
  }
  
  if (FEATURE_FLAGS.IS_PRODUCTION && FEATURE_FLAGS.USE_MOCK_DATA) {
    errors.push('❌ Production mode with Mock Data is not allowed');
  }
  
  if (errors.length > 0) {
    logger.error('🚨 Feature Flag Validation Errors:', errors);
    throw new Error(`Invalid feature flag configuration: ${errors.join(', ')}`);
  }
  
  return true;
}

// Export for easy access
export default FEATURE_FLAGS;
