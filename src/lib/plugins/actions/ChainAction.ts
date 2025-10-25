import { ActionDefinition, FormSchema, ValidationResult } from '../types';

export interface ChainConfig {
  type: 'CHAIN';
  targetHookId?: string;
}

export class ChainAction implements ActionDefinition<ChainConfig> {
  type = 'CHAIN';
  name = 'Chain Hook';
  description = 'Trigger another hook in your workflow';
  icon = 'GitBranch';

  validateConfig(config: ChainConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.targetHookId) {
      errors.push('Target hook ID is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  getConfigSchema(): FormSchema {
    return {
      fields: [
        {
          name: 'targetHookId',
          label: 'Target Hook ID',
          type: 'text',
          placeholder: 'hook-123',
          required: true,
          description: 'The ID of the hook to trigger'
        }
      ]
    };
  }
}

export const chainAction = new ChainAction();
