import { VariableContext } from './types';

/**
 * Builds and manages variable context for hook execution.
 * Accumulates trigger data and action results for variable interpolation.
 */
export class VariableContextBuilder {
  private context: VariableContext;

  /**
   * Initialize the variable context builder with trigger data.
   * @param triggerContext - Data from the trigger that fired the hook
   */
  constructor(triggerContext?: any) {
    this.context = {
      trigger: this.flattenObject(triggerContext || {}),
      actions: [],
    };
  }

  /**
   * Add an action result to the variable context.
   * Creates both indexed access (actions[0]) and aliased access (action0).
   *
   * @param actionIndex - Zero-based index of the action
   * @param actionId - Unique identifier for the action
   * @param actionType - Type of the action (TELEGRAM, WEBHOOK, etc.)
   * @param result - Action execution result
   */
  addActionResult(
    actionIndex: number,
    actionId: string,
    actionType: string,
    result: any
  ): void {
    const actionData = {
      id: actionId,
      type: actionType,
      result: result?.result || result,
      error: result?.error,
      timestamp: result?.completedAt || new Date().toISOString(),
    };

    // Pad actions array if necessary
    while (this.context.actions.length <= actionIndex) {
      this.context.actions.push({
        id: '',
        type: '',
        timestamp: new Date().toISOString(),
      });
    }
    this.context.actions[actionIndex] = actionData;

    // Create alias (action0, action1, etc.)
    this.context[`action${actionIndex}`] = actionData;

    // Create alias by action ID if available and valid
    if (actionId && /^[a-zA-Z0-9_-]+$/.test(actionId)) {
      this.context[`action_${actionId}`] = actionData;
    }
  }

  /**
   * Flatten nested objects for easier variable access.
   * Converts nested objects into dot-notation keys.
   *
   * Example:
   * { event: { args: { value: 100 } } }
   * -> { 'event.args.value': 100, 'event': {...}, 'event.args': {...} }
   *
   * @param obj - Object to flatten
   * @param prefix - Current key prefix for recursion
   * @param result - Accumulated result object
   * @returns Flattened object with dot-notation keys
   */
  private flattenObject(
    obj: any,
    prefix = '',
    result: Record<string, any> = {}
  ): Record<string, any> {
    // Handle null and undefined
    if (obj === null || obj === undefined) {
      if (prefix) {
        result[prefix] = obj;
      }
      return result;
    }

    // Handle arrays - store as-is and also flatten array items
    if (Array.isArray(obj)) {
      if (prefix) {
        result[prefix] = obj;
      }
      // Also store individual items if small array
      if (obj.length <= 10) {
        obj.forEach((item, index) => {
          const itemKey = prefix ? `${prefix}[${index}]` : `[${index}]`;
          if (typeof item === 'object' && item !== null && !Array.isArray(item) && !(item instanceof Date)) {
            this.flattenObject(item, itemKey, result);
          } else {
            result[itemKey] = item;
          }
        });
      }
      return result;
    }

    // Handle dates and other non-plain objects
    if (typeof obj !== 'object' || obj instanceof Date) {
      if (prefix) {
        result[prefix] = obj;
      }
      return result;
    }

    // Recursively flatten object properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        // Store the full path for direct access
        result[newKey] = value;

        // Recursively flatten nested objects
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          this.flattenObject(value, newKey, result);
        }
      }
    }

    return result;
  }

  /**
   * Get the current variable context.
   * @returns Current VariableContext object
   */
  getContext(): VariableContext {
    return this.context;
  }
}

