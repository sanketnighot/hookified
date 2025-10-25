import { TriggerDefinition, ValidationResult, FormSchema } from '../types';

export interface ManualConfig {
  type: 'MANUAL';
}

export class ManualTrigger implements TriggerDefinition<ManualConfig> {
  type = 'MANUAL';
  name = 'Manual';
  description = 'Trigger hooks manually when you need them';
  icon = 'MousePointer';

  validateConfig(config: ManualConfig): ValidationResult {
    // Manual triggers require no configuration
    return { isValid: true, errors: [] };
  }

  getConfigSchema(): FormSchema {
    return {
      fields: []
    };
  }
}

export const manualTrigger = new ManualTrigger();
