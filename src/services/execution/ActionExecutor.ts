import { ActionExecutionResult, EXECUTION_CONFIG, ExecutionContext } from './types';

export abstract class BaseActionExecutor {
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    actionType: string,
    maxAttempts: number = EXECUTION_CONFIG.RETRY.MAX_ATTEMPTS
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on the last attempt
        if (attempt === maxAttempts - 1) {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        const delay = EXECUTION_CONFIG.RETRY.DELAYS[attempt] || 4000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  protected async executeWithTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    actionType: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${actionType} execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([operation, timeoutPromise]);
  }

  protected createExecutionResult(
    actionId: string,
    actionType: string,
    startedAt: Date,
    status: 'SUCCESS' | 'FAILED',
    result?: any,
    error?: string,
    retryCount?: number
  ): ActionExecutionResult {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    return {
      actionId,
      actionType,
      status,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      duration,
      result,
      error,
      retryCount,
    };
  }

  abstract execute(
    actionConfig: any,
    context: ExecutionContext
  ): Promise<ActionExecutionResult>;
}
