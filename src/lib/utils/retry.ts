/**
 * Retry utility with exponential backoff
 * Useful for API calls that may fail due to transient errors
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBase?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> & { shouldRetry: (error: any) => boolean } = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  exponentialBase: 2,
  shouldRetry: (error: any) => {
    // Default: retry on network errors and 5xx errors
    if (error?.response?.status) {
      const status = error.response.status;
      return status === 429 || status >= 500; // Rate limit or server errors
    }
    return true; // Retry on network errors
  },
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number, exponentialBase: number): number {
  const delay = baseDelay * Math.pow(exponentialBase, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Result of the function
 * @throws Last error if all retries fail
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await axios.get('https://api.example.com/data'),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (!opts.shouldRetry(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt >= opts.maxRetries) {
        break;
      }

      // Calculate delay with jitter to avoid thundering herd
      const delay = calculateDelay(
        attempt,
        opts.baseDelay,
        opts.maxDelay,
        opts.exponentialBase
      );

      // Add random jitter (0-20% of delay)
      const jitter = Math.random() * 0.2 * delay;
      const totalDelay = delay + jitter;

      console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${Math.round(totalDelay)}ms`);

      await sleep(totalDelay);
    }
  }

  throw lastError;
}

/**
 * Retry a function with exponential backoff, but don't throw on final failure
 * Useful for non-critical operations that should not block the main flow
 */
export async function retryWithBackoffSilent<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T | null> {
  try {
    return await retryWithBackoff(fn, options);
  } catch (error) {
    console.error('Retry failed after all attempts:', error);
    return null;
  }
}

