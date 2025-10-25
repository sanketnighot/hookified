import { ActionDefinition, TriggerDefinition, ValidationResult } from './types';

class PluginRegistry {
  private triggers = new Map<string, TriggerDefinition>();
  private actions = new Map<string, ActionDefinition>();

  registerTrigger(trigger: TriggerDefinition): void {
    this.triggers.set(trigger.type, trigger);
  }

  registerAction(action: ActionDefinition): void {
    this.actions.set(action.type, action);
  }

  getTrigger(type: string): TriggerDefinition | undefined {
    return this.triggers.get(type);
  }

  getAction(type: string): ActionDefinition | undefined {
    return this.actions.get(type);
  }

  getAllTriggers(): TriggerDefinition[] {
    return Array.from(this.triggers.values());
  }

  getAllActions(): ActionDefinition[] {
    return Array.from(this.actions.values());
  }

  validateTriggerConfig(type: string, config: any): ValidationResult {
    const trigger = this.triggers.get(type);
    if (!trigger) {
      return {
        isValid: false,
        errors: [`Unknown trigger type: ${type}`]
      };
    }
    return trigger.validateConfig(config);
  }

  validateActionConfig(type: string, config: any): ValidationResult {
    const action = this.actions.get(type);
    if (!action) {
      return {
        isValid: false,
        errors: [`Unknown action type: ${type}`]
      };
    }
    return action.validateConfig(config);
  }
}

// Export singleton instance
export const registry = new PluginRegistry();
