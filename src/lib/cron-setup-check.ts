import { CronSetupValidator } from '@/services/triggers/CronSetupValidator';

let setupCheckCache: {
  isValid: boolean;
  checkedAt: Date;
  status?: any;
} | null = null;

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if CRON setup is valid (with caching)
 */
export async function checkCronSetup(): Promise<boolean> {
  // Return cached result if available and fresh
  if (setupCheckCache) {
    const cacheAge = Date.now() - setupCheckCache.checkedAt.getTime();
    if (cacheAge < CACHE_DURATION_MS) {
      return setupCheckCache.isValid;
    }
  }

  // Perform fresh check
  try {
    const validator = new CronSetupValidator();
    const isValid = await validator.isSetupAvailable();

    // Cache the result
    setupCheckCache = {
      isValid,
      checkedAt: new Date(),
    };

    // Log status
    if (!isValid) {
      console.warn('⚠️  CRON scheduling is not available');
      console.warn('   CRON hooks will not execute until pg_cron is configured');
      console.warn("   Run the setup script: supabase-cron-jobs-setup.sql");
    }

    return isValid;
  } catch (error) {
    console.error('Error checking CRON setup:', error);
    // Return false on error to be safe
    return false;
  }
}

/**
 * Get detailed setup status (with caching)
 */
export async function getCronSetupStatus() {
  if (setupCheckCache?.status &&
      Date.now() - setupCheckCache.checkedAt.getTime() < CACHE_DURATION_MS) {
    return setupCheckCache.status;
  }

  try {
    const validator = new CronSetupValidator();
    const status = await validator.validateSetup();

    setupCheckCache = {
      isValid: status.isValid,
      checkedAt: new Date(),
      status,
    };

    return status;
  } catch (error) {
    console.error('Error getting CRON setup status:', error);
    throw error;
  }
}

/**
 * Clear the cache to force a fresh check
 */
export function clearSetupCache() {
  setupCheckCache = null;
}

/**
 * Initialize setup check on import (for server-side only)
 */
if (typeof window === 'undefined') {
  // Only run on server
  setTimeout(() => {
    checkCronSetup().catch(console.error);
  }, 1000); // Wait 1 second after module load
}
