// Execution engine types and interfaces

export interface ExecutionContext {
  hookId: string;
  userId: string;
  triggerContext?: any; // Data from trigger (event data, webhook payload, etc.)
  runId: string;
}

export interface ActionExecutionResult {
  actionId: string;
  actionType: string;
  status: 'SUCCESS' | 'FAILED';
  startedAt: string; // ISO timestamp
  completedAt: string; // ISO timestamp
  duration: number; // milliseconds
  result?: any; // Response from action executor
  error?: string; // Error message if failed
  retryCount?: number;
}

export interface HookExecutionResult {
  runId: string;
  status: 'SUCCESS' | 'FAILED';
  totalDuration: number; // Total execution time in ms
  actions: ActionExecutionResult[];
  failedAt?: number; // Index of action that failed (0-based)
  error?: string; // Overall error message
}

export interface ExecutionMeta {
  triggerContext?: any;
  actions: ActionExecutionResult[];
  totalDuration: number;
  failedAt?: number;
}

export interface ActionExecutor {
  execute(
    actionConfig: any,
    context: ExecutionContext
  ): Promise<ActionExecutionResult>;
}

export interface TriggerContext {
  type: 'MANUAL' | 'WEBHOOK' | 'CRON' | 'ONCHAIN';
  data?: any; // Specific data for each trigger type
  timestamp: string;
}

// Variable interpolation helpers
export interface VariableContext {
  [key: string]: any;
}

export function interpolateVariables(
  template: string,
  context: VariableContext
): string {
  if (!template) return '';

  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const value = context[key];
    return value !== undefined ? String(value) : match;
  });
}

// Execution configuration
export const EXECUTION_CONFIG = {
  TIMEOUTS: {
    TELEGRAM: 10000, // 10 seconds
    WEBHOOK: 30000,  // 30 seconds
    CHAIN: 60000,    // 60 seconds
    CONTRACT_CALL: 60000, // 60 seconds
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAYS: [1000, 2000, 4000], // Exponential backoff in ms
  },
} as const;
