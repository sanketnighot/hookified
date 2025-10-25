import { TriggerDefinition, ValidationResult, FormSchema } from '../types';

export interface CronConfig {
  type: 'CRON';
  cronExpression?: string;
  timezone?: string;
}

export class CronTrigger implements TriggerDefinition<CronConfig> {
  type = 'CRON';
  name = 'Schedule';
  description = 'Run hooks at specific times or intervals';
  icon = 'Clock';

  validateConfig(config: CronConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.cronExpression) {
      errors.push('Cron expression is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  getConfigSchema(): FormSchema {
    return {
      fields: [
        {
          name: 'cronExpression',
          label: 'Schedule',
          type: 'text',
          placeholder: '0 9 * * *',
          required: true,
          description: 'Cron expression format: minute hour day month weekday'
        },
        {
          name: 'timezone',
          label: 'Timezone',
          type: 'select',
          required: false,
          default: 'UTC',
          options: [
            { value: 'UTC', label: 'UTC' },
            { value: 'America/New_York', label: 'America/New_York' },
            { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
            { value: 'Europe/London', label: 'Europe/London' },
            { value: 'Europe/Berlin', label: 'Europe/Berlin' },
            { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
            { value: 'Asia/Shanghai', label: 'Asia/Shanghai' }
          ],
          description: 'Select the timezone for scheduling'
        }
      ]
    };
  }
}

export const cronTrigger = new CronTrigger();
