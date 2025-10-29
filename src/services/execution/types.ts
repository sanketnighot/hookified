// Execution engine types and interfaces

export interface VariableContext {
  // Trigger data (flattened for easy access)
  trigger: Record<string, any>;
  // All action results indexed
  actions: Array<{
    id: string;
    type: string;
    result?: any;
    error?: string;
    timestamp: string;
  }>;
  // Dynamic aliases for quick access (e.g., action0, action1)
  [key: string]: any;
}

export interface ExecutionContext {
  hookId: string;
  userId: string;
  triggerContext?: any; // Data from trigger (event data, webhook payload, etc.)
  runId: string;
  variables: VariableContext; // Variable context for interpolation
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

/**
 * Resolve a variable path from context.
 * Supports trigger paths, action index paths, and action alias paths.
 *
 * @param path - Variable path (e.g., "trigger.event.value", "actions[0].result.data")
 * @param context - Variable context containing trigger and action data
 * @returns Resolved value or undefined if not found
 */
function resolveVariablePath(path: string, context: VariableContext): any {
  // Handle array access: actions[0].result.data
  const actionIndexMatch = path.match(/^actions\[(\d+)\]\.(.+)$/);
  if (actionIndexMatch) {
    const index = parseInt(actionIndexMatch[1], 10);
    const subPath = actionIndexMatch[2];
    const action = context.actions[index];
    if (!action) return undefined;
    return getNestedValue(action, subPath);
  }

  // Handle action alias: action0.result.data
  const actionAliasMatch = path.match(/^action(\d+)\.(.+)$/);
  if (actionAliasMatch) {
    const index = parseInt(actionAliasMatch[1], 10);
    const alias = `action${index}`;
    const action = context[alias];
    if (!action) return undefined;
    const subPath = actionAliasMatch[2];
    return getNestedValue(action, subPath);
  }

  // Handle trigger data: trigger.event.value
  if (path.startsWith('trigger.')) {
    const key = path.substring(8); // Remove 'trigger.'
    // Try flattened key first
    const flattenedValue = context.trigger[key];
    if (flattenedValue !== undefined) {
      return flattenedValue;
    }
    // Fallback to nested access
    return getNestedValue(context.trigger, key);
  }

  // Handle direct trigger access (backward compatibility): triggerField
  if (!path.includes('.') && context.trigger[path] !== undefined) {
    return context.trigger[path];
  }

  // Fallback: try direct access or nested path
  if (context[path] !== undefined) {
    return context[path];
  }
  return getNestedValue(context, path);
}

/**
 * Get nested value using dot notation path.
 *
 * @param obj - Object to traverse
 * @param path - Dot-notation path (e.g., "result.data.value")
 * @returns Value at path or undefined if not found
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    // Handle array access in path (e.g., "data[0].value")
    if (part.includes('[') && part.includes(']')) {
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const arrayKey = arrayMatch[1];
        const arrayIndex = parseInt(arrayMatch[2], 10);
        current = current[arrayKey];
        if (Array.isArray(current)) {
          current = current[arrayIndex];
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    } else {
      current = current[part];
    }
  }

  return current;
}

/**
 * Enhanced variable interpolation with path support.
 * Supports nested paths for accessing trigger data and action results.
 *
 * Syntax examples:
 * - {trigger.event.value} - Access trigger data
 * - {actions[0].result.data} - Access action by index
 * - {action0.result.data} - Access action by alias
 *
 * @param template - Template string with {variable} placeholders
 * @param context - Variable context for interpolation
 * @param options - Interpolation options
 * @returns Interpolated string with variables replaced
 */
export function interpolateVariables(
  template: string,
  context: VariableContext,
  options: {
    fallbackToEmpty?: boolean;
    strictMode?: boolean;
  } = {}
): string {
  if (!template) return "";

  const { fallbackToEmpty = true, strictMode = false } = options;

  return template.replace(/\{([^}]+)\}/g, (match, path) => {
    try {
      const trimmedPath = path.trim();
      const value = resolveVariablePath(trimmedPath, context);

      if (value === undefined || value === null) {
        if (strictMode) {
          throw new Error(`Variable not found: ${trimmedPath}`);
        }
        return fallbackToEmpty ? "" : match;
      }

      // Handle different types
      if (typeof value === "object" && !Array.isArray(value)) {
        return JSON.stringify(value);
      }

      if (Array.isArray(value)) {
        return JSON.stringify(value);
      }

      return String(value);
    } catch (error) {
      if (strictMode) {
        throw error;
      }
      return fallbackToEmpty ? "" : match;
    }
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
